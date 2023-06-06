import * as THREE from '../../sumber/three.js/build/three.module.js';
import { Sky } from '../../sumber/three.js/examples/jsm/objects/Sky.js';
import { Water } from '../../sumber/three.js/examples/jsm/objects/Water.js';
import { OrbitControls } from '../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import { FirstPersonControls } from '../../sumber/three.js/examples/jsm/controls/FirstPersonControls.js';
import Stats from '../../sumber/three.js/examples/jsm/libs/stats.module.js';

document.getElementsByTagName( 'body' )[ 0 ].style.cursor = 'none';

const clock = new THREE.Clock();
const cameraVector3 = new THREE.Vector3( 0, 10, - 10 );

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x012345 );
scene.fog = new THREE.Fog( 0x808080, 1, 100  );

const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.01, 20000 );
camera.position.set( 0, 10, - 10 );

// if ( localStorage.getItem( 'cameraPositionX' ) ) {
//     camera.position.set(
//         localStorage.getItem( 'cameraPositionX' ),
//         localStorage.getItem( 'cameraPositionY' ),
//         localStorage.getItem( 'cameraPositionZ' )
//     )
// } else camera.position.set( 0, 10, 20 );

// document.addEventListener( 'keydown', () => {
//     localStorage.setItem( 'cameraPositionX', Math.round( camera.position.x ) );
//     localStorage.setItem( 'cameraPositionY', Math.round( camera.position.y ) );
//     localStorage.setItem( 'cameraPositionZ', Math.round( camera.position.z ) );
// } );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping= THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
document.body.appendChild( renderer.domElement );

// const controls = new OrbitControls( camera, renderer.domElement );
// controls.enableDamping = true;
// controls.dampingFactor = 0.05;
// controls.maxPolarAngle = Math.PI / 2 - 0.01;
// controls.update();

const controls = new FirstPersonControls( camera, renderer.domElement );
controls.movementSpeed = 150;
controls.lookSpeed = 0.1;
document.addEventListener( 'keydown', event => {
    if ( event.code != 'KeyT' ) return;
    controls.enabled = controls.enabled ? false : true;
    document.getElementById( 'kontrol' ).innerText = controls.enabled ? 'aktif' : 'nonaktif';
    document.getElementsByTagName( 'body' )[ 0 ].style.cursor = controls.enabled ? 'none' : 'default';
} );

const stats = new Stats();
document.body.appendChild( stats.domElement );

const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
const water = new Water(
    waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
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
let elevation = 0;
let renderTarget;

function updateSun() {

    sun.setFromSphericalCoords( 1, THREE.MathUtils.degToRad( 90 - elevation ), THREE.MathUtils.degToRad( 180 ) );

    sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
    water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

    if ( renderTarget !== undefined ) renderTarget.dispose();

    renderTarget = pmremGenerator.fromScene( sky );

    scene.environment = renderTarget.texture;

}
updateSun();

let pause = false;
document.addEventListener( 'keydown', event => {
    if ( event.code != 'Space' ) return;
    pause = pause ? false : true;
} )

window.addEventListener( 'resize', function() {
    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    controls.handleResize();
} );

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
    controls.update( clock.getDelta() );
    stats.update();

    water.material.uniforms[ 'time' ].value += 1 / 60;
    if ( !pause ) {
        elevation += 0.01 ;
        updateSun();
    }
}
animate();