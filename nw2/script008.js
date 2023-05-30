import * as THREE from '../../sumber/three.js/build/three.module.js';
import Stats from '../../sumber/three.js/examples/jsm/libs/stats.module.js';
import { ThreeJSComponent } from "../../sumber/ThreeJSComponent.js";
import { Water } from '../../sumber/three.js/examples/jsm/objects/Water.js';
import { Sky } from '../../sumber/three.js/examples/jsm/objects/Sky.js';

const component = new ThreeJSComponent(
    new THREE.Scene(),
    new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 300 ),
    new THREE.WebGLRenderer( { antialias: true, alpha: true } ),
    new Stats(), {
        cameraY: 30,
        cameraZ: 80,
        controlsMax: Math.PI / 2 - 0.01,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneExposure: 0.5
    }
);

component.renderLight( {
    mesh: new THREE.PointLight(),
    x: 50,
    y: 30,
    z: 50,
    helper: true
} );

// BANYU ---

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
component.sendMesh( water );

// BANYU --------

// MATAHARI ---

const sun = new THREE.Vector3();

const sky = new Sky();
sky.scale.setScalar( 10000 );
component.sendMesh( sky );

const skyUniforms = sky.material.uniforms;
skyUniforms[ 'turbidity' ].value = 10;
skyUniforms[ 'rayleigh' ].value = 2;
skyUniforms[ 'mieCoefficient' ].value = 0.005;
skyUniforms[ 'mieDirectionalG' ].value = 0.8;

const pmremGenerator = new THREE.PMREMGenerator( component.getRenderer() );
let renderTarget;

sun.setFromSphericalCoords( 1, THREE.MathUtils.degToRad( 90 - 180 ), THREE.MathUtils.degToRad( 100 ) );

sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

if ( renderTarget !== undefined ) renderTarget.dispose();

renderTarget = pmremGenerator.fromScene( sky );


// MATAHARI --------

// TEMBOK ---
component.renderBox( {
    material: new THREE.MeshPhongMaterial(), sizeX: 20, sizeY: 20, sizeZ: 2, posZ: 11, mapFile: '../../sumber/loader/dinding/wall-1-square.tga'
} );
component.renderBox( {
    material: new THREE.MeshPhongMaterial(), sizeX: 20, sizeY: 20, sizeZ: 2, posX: 11, rotY: - Math.PI * 0.5, mapFile: '../../sumber/loader/dinding/wall-1-square.tga'
} );
component.renderBox( {
    material: new THREE.MeshPhongMaterial(), sizeX: 20, sizeY: 20, sizeZ: 2, posZ: - 11, mapFile: '../../sumber/loader/dinding/wall-1-square.tga'
} );
component.renderBox( {
    material: new THREE.MeshPhongMaterial(), sizeX: 20, sizeY: 20, sizeZ: 2, posX: - 11, rotY: - Math.PI * 0.5, mapFile: '../../sumber/loader/dinding/wall-1-square.tga'
} );
// TEMBOK --------

// TIANG ---
const pos = 12;
component.renderBox( {
    material: new THREE.MeshPhongMaterial(), threeColor: 0xdeb887, sizeX: 4, sizeY: 22, sizeZ: 4, posX: pos, posZ: pos
} );
component.renderBox( {
    material: new THREE.MeshPhongMaterial(), threeColor: 0xdeb887, sizeX: 4, sizeY: 22, sizeZ: 4, posX: - pos, posZ: pos
} );
component.renderBox( {
    material: new THREE.MeshPhongMaterial(), threeColor: 0xdeb887, sizeX: 4, sizeY: 22, sizeZ: 4, posX: pos, posZ: - pos
} );
component.renderBox( {
    material: new THREE.MeshPhongMaterial(), threeColor: 0xdeb887, sizeX: 4, sizeY: 22, sizeZ: 4, posX: - pos, posZ: - pos
} );
// TIANG --------

component.renderCone( {
    material: new THREE.MeshPhongMaterial(),
    radius: 25,
    height: 20,
    radialSegments: 4,
    heightSegments: 1,
    posY: 30,
    threeColor: 0xa52a2a,
    rotY: 62.04
} );

component.sendMeshToLoop( { a: water.material.uniforms[ 'time' ].value += 1.0 / 60.0 } );
component.animate();

console.log( component );