import * as THREE from '../../../sumber/three.js/build/three.module.js';
import { OrbitControls } from '../../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import Stats from '../../../sumber/three.js/examples/jsm/libs/stats.module.js';

import { GPUComputationRenderer } from '../../../sumber/three.js/examples/jsm/misc/GPUComputationRenderer.js';
import { SimplexNoise } from '../../../sumber/three.js/examples/jsm/math/SimplexNoise.js';

//

const params = {
    mouseSize: 20.0,
    viscosity: 0.98,
    waveHeight: 3,
};
const listener = 'mousemove';

const FBO_WIDTH = 128 * 1;
const FBO_HEIGHT = 128 * 1;

const GEOM_WIDTH = 512 * 1;
const GEOM_HEIGHT = 512 * 1;

let mouseMoved = false;
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

//

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 3000 );
camera.position.set( 0, 200, 350 );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.update();

const stats = new Stats();
document.body.appendChild( stats.domElement );

//

// const sun = new THREE.DirectionalLight( 0xffffff, 5 );
// sun.position.set( 300, 400, 175 );
// scene.add( sun );
// const sun2 = new THREE.DirectionalLight( 0x40a040, 0.6 );
// sun2.position.set( - 100, 350, - 200 );
// scene.add( sun2 );

const light = new THREE.PointLight( 0xffffff, 500_000 );
light.position.set( 128, 200, 128 );
light.castShadow = true;
scene.add( light );

//

const plane = new THREE.PlaneGeometry( GEOM_WIDTH, GEOM_HEIGHT, FBO_WIDTH - 1, FBO_HEIGHT - 1 );
const waterMaterial = new THREE.MeshPhongMaterial( { color: new THREE.Color( 0x0040c0 ) } );

const cube = new THREE.Mesh(
    new THREE.BoxGeometry( 50, 50, 50 ),
    new THREE.MeshNormalMaterial()
);
cube.position.set( 0, 80, 80 );
cube.castShadow = true;
cube.receiveShadow = true;
scene.add( cube );

waterMaterial.userData.heightmap = { value: null };

waterMaterial.onBeforeCompile = function ( shader ) {
    shader.uniforms.heightmap = waterMaterial.userData.heightmap;
    shader.vertexShader = shader.vertexShader.replace( '#include <common>', `
        uniform sampler2D heightmap;
        #include <common>
    ` );
    shader.vertexShader = shader.vertexShader.replace( '#include <beginnormal_vertex>', `
        // Compute normal from heightmap
        vec2 cellSize = vec2( 1.0 / (${ FBO_WIDTH.toFixed( 1 ) }), 1.0 / ${ FBO_HEIGHT.toFixed( 1 ) } );
        vec3 objectNormal = vec3(
            ( texture2D( heightmap, uv + vec2( - cellSize.x, 0 ) ).x - texture2D( heightmap, uv + vec2( cellSize.x, 0 ) ).x ) * ${ FBO_WIDTH.toFixed( 1 ) } / ${ GEOM_WIDTH.toFixed( 1 ) },
            ( texture2D( heightmap, uv + vec2( 0, - cellSize.y ) ).x - texture2D( heightmap, uv + vec2( 0, cellSize.y ) ).x ) * ${ FBO_HEIGHT.toFixed( 1 ) } / ${ GEOM_HEIGHT.toFixed( 1 ) },
            1.0 );
    ` );
    shader.vertexShader = shader.vertexShader.replace( '#include <begin_vertex>', `
        float heightValue = texture2D( heightmap, uv ).x;
        vec3 transformed = vec3( position.x, position.y, heightValue );
    ` );
}

const waterMesh = new THREE.Mesh( plane, waterMaterial );
waterMesh.castShadow = true;
waterMesh.receiveShadow = true;
waterMesh.rotation.x = - Math.PI / 2;
waterMesh.matrixAutoUpdate = false;
waterMesh.updateMatrix();
scene.add( waterMesh );

const gpuCompute = new GPUComputationRenderer( FBO_WIDTH, FBO_HEIGHT, renderer );
if ( renderer.capabilities.isWebGL2 === false ) gpuCompute.setDataType( THREE.HalfFloatType);

const heightmap0 = gpuCompute.createTexture();
fillTexture( heightmap0 );
const heightmapVariable = gpuCompute.addVariable( 'heightmap',
    `#define PI 3.1415926538

    uniform vec2 mousePos;
    uniform float mouseSize;
    uniform float viscosityConstant;
    uniform float waveheightMultiplier;

    void main()	{
        // The size of the computation (sizeX * sizeY) is defined as 'resolution' automatically in the shader.
        // sizeX and sizeY are passed as params when you make a new GPUComputationRenderer instance.
        vec2 cellSize = 1.0 / resolution.xy;

        // gl_FragCoord is in pixels coordinates range from 0.0 to the width/height of the window,
        // note that the window isn't the visible one on your browser here, since the gpgpu renders to its virtual screen
        // thus the uv still is 0..1
        vec2 uv = gl_FragCoord.xy * cellSize;

        // heightmapValue.x == height from previous frame
        // heightmapValue.y == height from penultimate frame
        // heightmapValue.z, heightmapValue.w not used
        vec4 heightmapValue = texture2D( heightmap, uv );

        // Get neighbours
        vec4 north = texture2D( heightmap, uv + vec2( 0.0, cellSize.y ) );
        vec4 south = texture2D( heightmap, uv + vec2( 0.0, - cellSize.y ) );
        vec4 east = texture2D( heightmap, uv + vec2( cellSize.x, 0.0 ) );
        vec4 west = texture2D( heightmap, uv + vec2( - cellSize.x, 0.0 ) );

        // https://web.archive.org/web/20080618181901/http://freespace.virgin.net/hugo.elias/graphics/x_water.htm
        // change in height is proportional to the height of the wave 2 frames older
        // so new height is equaled to the smoothed height plus the change in height
        float newHeight = ( ( north.x + south.x + east.x + west.x ) * 0.5 - heightmapValue.y ) * viscosityConstant;

        // Mouse influence
        float mousePhase = clamp( length( ( uv - vec2( 0.5 ) ) * vec2( GEOM_WIDTH, GEOM_HEIGHT ) - vec2( mousePos.x, - mousePos.y ) ) * PI / mouseSize, 0.0, PI );
        newHeight += ( cos( mousePhase ) + 1.0 ) * waveheightMultiplier;

        heightmapValue.y = heightmapValue.x;
        heightmapValue.x = newHeight;

        gl_FragColor = heightmapValue;

    }
`, heightmap0 );

gpuCompute.setVariableDependencies( heightmapVariable, [ heightmapVariable ] );

heightmapVariable.material.uniforms[ 'mousePos' ] = { value: new THREE.Vector2( 10000, 10000 ) };
heightmapVariable.material.uniforms[ 'mouseSize' ] = { value: params.mouseSize };
heightmapVariable.material.uniforms[ 'viscosityConstant' ] = { value: params.viscosity };
heightmapVariable.material.uniforms[ 'waveheightMultiplier' ] = { value: params.waveHeight };
heightmapVariable.material.defines.GEOM_WIDTH = GEOM_WIDTH.toFixed( 1 );
heightmapVariable.material.defines.GEOM_HEIGHT = GEOM_HEIGHT.toFixed( 1 );

const error = gpuCompute.init();
if ( error !== null ) console.error( error );

function fillTexture( texture ) {

    const waterMaxHeight = 2;
    const simplex = new SimplexNoise();

    function layeredNoise( x, y ) {

        let multR = waterMaxHeight;
        let mult = 0.025;
        let r = 0;
        for ( let i = 0; i < 10; i ++ ) {

            r += multR * simplex.noise( x * mult, y * mult );
            multR *= 0.5;
            mult *= 2;

        }

        return r;

    }

    const pixels = texture.image.data;

    let p = 0;

    for ( let j = 0; j < FBO_HEIGHT; j ++ ) {

        for ( let i = 0; i < FBO_WIDTH; i ++ ) {

            const x = i * 128 / FBO_WIDTH;
            const y = j * 128 / FBO_HEIGHT;

            pixels[ p + 0 ] = layeredNoise( x, y );
            pixels[ p + 1 ] = 0;
            pixels[ p + 2 ] = 0;
            pixels[ p + 3 ] = 1;

            p += 4;

        }

    }

}

window.addEventListener( listener, function ( event ) {

    if ( event.isPrimary === false ) return;

    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    mouseMoved = true;

} );

//

window.addEventListener( 'onresize', () => {
    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
} );

function animate() {

    render();

    controls.update();
    stats.update();

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.03;

}

function render() {

    renderer.render( scene, camera );

    const hmUniforms = heightmapVariable.material.uniforms;
    if ( mouseMoved ) {

        raycaster.setFromCamera( pointer, camera );
        const intersects = raycaster.intersectObject( waterMesh );

        if ( intersects.length > 0 ) {

            const point = intersects[ 0 ].point;
            hmUniforms[ 'mousePos' ].value.set( point.x, point.z );

        } else {

            hmUniforms[ 'mousePos' ].value.set( 10000, 10000 );

        }

        mouseMoved = false;

    } else {

        hmUniforms[ 'mousePos' ].value.set( 10000, 10000 );

    }

    waterMaterial.userData.heightmap.value = gpuCompute.getCurrentRenderTarget( heightmapVariable ).texture;

    gpuCompute.compute();

}