import * as THREE from '../../sumber/three.js/build/three.module.js';
import * as CANNON from '../../sumber/cannon-es/dist/cannon-es.js';
import { OrbitControls } from '../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import Stats from '../../sumber/three.js/examples/jsm/libs/stats.module.js';
import { Water } from '../../sumber/three.js/examples/jsm/objects/Water.js';
import { Sky } from '../../sumber/three.js/examples/jsm/objects/Sky.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xf0f0f0 );

const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 20000 );
camera.position.set( 0, 10, 20 );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping= THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
document.body.appendChild( renderer.domElement );

// const light = new THREE.DirectionalLight( 0xffffff, 1 );
// light.position.set( 1, 1, 1 ).normalize();
// scene.add( light );

const light = new THREE.AmbientLight( 0xffffff );
scene.add( light );

const clock = new THREE.Clock();

const controls = new OrbitControls( camera, renderer.domElement );
controls.listenToKeyEvents( window );
controls.target.set( 0, 0, 0 );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.01;
controls.update();
// controls.dispose();

// const controls = new FirstPersonControls( camera, renderer.domElement );
// controls.movementSpeed = 200;
// controls.lookSpeed = 0.1;
// controls.autoForward = true;

const stats = new Stats();
document.body.appendChild( stats.domElement );

const world = new CANNON.World( {
    gravity: new CANNON.Vec3( 0, - 9.82, 0 )
} );

//

const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
const water = new Water(
    waterGeometry, {
        textureWidth: 1024,
        textureHeight: 1024,
        waterNormals: new THREE.TextureLoader().load( '../../sumber/three.js/examples/textures/waternormals.jpg', function ( texture ) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        } ),
        sunDirection: new THREE.Vector3(),
        sunColor: new THREE.Color( 0xffffff ),
        waterColor: 0x001e0f,
        distortionScale: 37
    }
);
water.rotation.x = - Math.PI / 2;
scene.add( water );

//

const sun = new THREE.Vector3();

const sky = new Sky();
sky.scale.setScalar( 10000 );
scene.add( sky );

const skyUniforms = sky.material.uniforms;
skyUniforms[ 'turbidity' ].value = 10;
skyUniforms[ 'rayleigh' ].value = 2;
skyUniforms[ 'mieCoefficient' ].value = 0.005;
skyUniforms[ 'mieDirectionalG' ].value = 0.8;

const pmremGenerator = new THREE.PMREMGenerator( renderer );

let renderTarget;

sun.setFromSphericalCoords( 1, THREE.MathUtils.degToRad( 90 - 150 ) /* elevation */, THREE.MathUtils.degToRad( 100 ) /* azimuth */ );

sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

if ( renderTarget !== undefined ) renderTarget.dispose();

renderTarget = pmremGenerator.fromScene( sky );
scene.environment = renderTarget.texture;

//

const geometry = new THREE.BoxGeometry( 20, 20, 20 );
const cubes = [];
const position = [];

for ( let i = 0; i < 100; i ++ ) {

    const object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

    object.position.x = Math.random() * 800 - 400;
    object.position.z = Math.random() * 800 - 400;

    object.rotation.x = Math.random() * 2 * Math.PI;
    object.rotation.y = Math.random() * 2 * Math.PI;
    object.rotation.z = Math.random() * 2 * Math.PI;

    object.scale.x = Math.random() + 0.5;
    object.scale.y = Math.random() + 0.5;
    object.scale.z = Math.random() + 0.5;

    scene.add( object );
    cubes.push( object );
    position.push( object.position );

}

//

const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

document.addEventListener( 'pointermove', function ( event ) {

    pointer.set(
        ( event.clientX / window.innerWidth ) * 2 - 1,
        - ( event.clientY / window.innerHeight ) * 2 + 1,
    );

} );

//

let INTERSECTED;

function animate() {

    requestAnimationFrame( animate );

    controls.update( clock.getDelta() );
    stats.update();

    water.material.uniforms[ 'time' ].value += 0.1 / 60;

    raycaster.setFromCamera( pointer, camera );

    const intersects = raycaster.intersectObjects( cubes, false );

    if ( intersects.length > 0 ) {
        if ( INTERSECTED != intersects[ 0 ].object ) {
            if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
            INTERSECTED = intersects[ 0 ].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex( 0x00ff00 );
        }
    } else {
        if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
        INTERSECTED = null;
    }

    renderer.render( scene, camera );

}
animate();

window.addEventListener( 'resize', function () {

    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

} );