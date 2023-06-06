import * as THREE from '../../sumber/three.js/build/three.module.js';
import * as CANNON from '../../sumber/cannon-es/dist/cannon-es.js';

import { Water } from '../../sumber/three.js/examples/jsm/objects/Water.js';
import { Sky } from '../../sumber/three.js/examples/jsm/objects/Sky.js';

import { OrbitControls } from '../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import Stats from '../../sumber/three.js/examples/jsm/libs/stats.module.js';

// Konstanta
const textureLoader = new THREE.TextureLoader();

// Render

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x012345 );

const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 20000 );

if ( localStorage.getItem( 'cameraPositionX' ) ) {
    camera.position.set(
        localStorage.getItem( 'cameraPositionX' ),
        localStorage.getItem( 'cameraPositionY' ),
        localStorage.getItem( 'cameraPositionZ' )
    )
} else camera.position.set( 0, 10, 20 );

setInterval( () => {
    localStorage.setItem( 'cameraPositionX', Math.round( camera.position.x ) );
    localStorage.setItem( 'cameraPositionY', Math.round( camera.position.y ) );
    localStorage.setItem( 'cameraPositionZ', Math.round( camera.position.z ) );
}, 2000 );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
document.body.appendChild( renderer.domElement );
document.addEventListener( 'keydown', ( event ) => event.code == 'KeyP' ? renderer.dispose() : false );

const controls = new OrbitControls( camera, renderer.domElement );
controls.target.set( 0, 0, 0 );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.01;
controls.update();

const statsFPS = new Stats();
const statsMS = new Stats();
statsMS.showPanel( 1 );
statsMS.domElement.style.marginTop = '48px';
const statsMB = new Stats();
statsMB.showPanel( 2 );
statsMB.domElement.style.marginTop = '96px';
document.body.appendChild( statsFPS.domElement );
document.body.appendChild( statsMS.domElement );
document.body.appendChild( statsMB.domElement );

const ambientLight = new THREE.AmbientLight( 0xffffff, 0.3 );
scene.add( ambientLight );

// Dunia Fisika

const world = new CANNON.World( {
    gravity: new CANNON.Vec3( 0, - 9.82, 0 )
} );

// Laut

const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
const water = new Water(
    waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: textureLoader.load( '../../sumber/three.js/examples/textures/waternormals.jpg', function ( texture ) {
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

// Matahari

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

sun.setFromSphericalCoords( 1, THREE.MathUtils.degToRad( 90 - 170 ) /* elevation */, THREE.MathUtils.degToRad( 0 ) /* azimuth */ );

sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

let renderTarget;

if ( renderTarget !== undefined ) renderTarget.dispose();

renderTarget = pmremGenerator.fromScene( sky );
scene.environment = renderTarget.texture;

// Landasan

const halfExtents = new CANNON.Vec3( 100, 4, 100 );

const loader1 = textureLoader.load( '../../sumber/loader/dinding2/dinding-3-compressed.jpg' );
loader1.colorSpace = THREE.SRGBColorSpace;
loader1.wrapS = THREE.MirroredRepeatWrapping;
loader1.wrapT = THREE.RepeatWrapping;
loader1.repeat.set( 14, 1 );

const loader2 = textureLoader.load( '../../sumber/loader/kayu/serat-kayu-4-compressed.jpg' );
loader2.colorSpace = loader1.colorSpace;
loader2.wrapS = THREE.MirroredRepeatWrapping;
loader2.wrapT = THREE.MirroredRepeatWrapping;
loader2.repeat.set( 25, 25 );

const planeMaterials = [
    new THREE.MeshPhongMaterial( { map: loader1 } ),
    new THREE.MeshPhongMaterial( { map: loader1 } ),
    new THREE.MeshPhongMaterial( { map: loader2 } ),
    new THREE.MeshPhongMaterial(),
    new THREE.MeshPhongMaterial( { map: loader1 } ),
    new THREE.MeshPhongMaterial( { map: loader1 } ),
]

const planeMesh = new THREE.Mesh(
    new THREE.BoxGeometry( halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2 ),
    planeMaterials
);
const planeBody = new CANNON.Body( {
    mass: 0,
    shape: new CANNON.Box( halfExtents )
} );
planeMesh.receiveShadow = true;
planeBody.position.set( 0, 4, 0 );
planeMesh.position.copy( planeBody.position );

scene.add( planeMesh );
world.addBody( planeBody );

//



//

let lastCallTime = new THREE.Clock();
function animate() {

    requestAnimationFrame( animate );

    renderer.render( scene, camera );
    controls.update();
    statsFPS.update();
    statsMS.update();
    statsMB.update();
    
    const time = performance.now() / 1000;
    const dt = time - lastCallTime;
    lastCallTime = time;
    world.step( 1 / 60, dt );

    water.material.uniforms[ 'time' ].value += 1 / 60;

}
animate();

window.addEventListener( 'resize', function() {

    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

} )