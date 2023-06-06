import * as THREE from '../../sumber/three.js/build/three.module.js';
import * as CANNON from '../../sumber/cannon-es/dist/cannon-es.js';

import { OrbitControls } from '../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import { FirstPersonControls } from '../../sumber/three.js/examples/jsm/controls/FirstPersonControls.js';

import { Water } from '../../sumber/three.js/examples/jsm/objects/Water.js';
import { Sky } from '../../sumber/three.js/examples/jsm/objects/Sky.js';

import { Reflector } from '../../sumber/three.js/examples/jsm/objects/Reflector.js';

import { TGALoader } from "../../sumber/three.js/examples/jsm/loaders/TGALoader.js";

import Stats from '../../sumber/three.js/examples/jsm/libs/stats.module.js';

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
// controls.movementSpeed = 10;
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

const oceanSound = document.createElement( 'audio' );
oceanSound.src = '../../sumber/audio/ocean/ocean-sound-3.mp3';
oceanSound.loop = true;
let isPlayed = false;
document.addEventListener( 'click', () => {
    if ( isPlayed ) return;
    isPlayed = true;
    oceanSound.play();
} );
document.addEventListener( 'contextmenu', () => {
    isPlayed = false;
    oceanSound.pause();
} );

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

const halfExtents = new CANNON.Vec3( 3, 3, 3 );
const geometry = new THREE.BoxGeometry( halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2 );
const boxMesh = [], boxBody = [];

for ( let i = 0; i < 100; i ++ ) {

    const mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial( { color: Math.random() * 0xffffff } ) );
    const body = new CANNON.Body( {
        mass: 0,
        shape: new CANNON.Box( halfExtents )
    } );

    body.position.x = Math.random() * 200 - 100;
    body.position.z = Math.random() * 200 - 100;

    body.quaternion.setFromEuler(
        Math.random() * 2 * Math.PI,
        Math.random() * 2 * Math.PI,
        Math.random() * 2 * Math.PI
    );

    // body.scale.x = Math.random() + 0.5;
    // body.scale.y = Math.random() + 0.5;
    // body.scale.z = Math.random() + 0.5;

    mesh.position.copy( body.position );
    mesh.quaternion.copy( body.quaternion );

    scene.add( mesh );
    world.addBody( body );
    boxMesh.push( mesh );
    boxBody.push( body );

}
const planeBody = new CANNON.Body( {
    mass: 0,
    shape: new CANNON.Plane()
} );
planeBody.quaternion.setFromEuler( - Math.PI * 0.5, 0, 0 );
world.addBody( planeBody );

//

const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const objectMesh = {}, objectBody = {};
const ballMeshes = [], ballBodies = [];

function createBall( event ) {

    mouseCoords.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
    // mouseCoords.set( 0, 0 );

    raycaster.setFromCamera( mouseCoords, camera );

    objectMesh.ballMesh = new THREE.Mesh(
        new THREE.SphereGeometry( 1, 16, 16 ),
        new THREE.MeshPhongMaterial( { color: new THREE.Color( 0x0510ab ) } )
    );
    objectBody.ballBody = new CANNON.Body( {
        mass: 2,
        shape: new CANNON.Sphere( 1 )
    } );

    objectMesh.ballMesh.castShadow = true;
    objectMesh.ballMesh.receiveShadow = true;

    scene.add( objectMesh.ballMesh );
    world.addBody( objectBody.ballBody );
    ballMeshes.push( objectMesh.ballMesh );
    ballBodies.push( objectBody.ballBody );

    const shootVelocity = 100;
    objectBody.ballBody.velocity.set(
        raycaster.ray.direction.x * shootVelocity,
        raycaster.ray.direction.y * shootVelocity,
        raycaster.ray.direction.z * shootVelocity,
    );

    const x = raycaster.ray.origin.x; // sama dengan raycaster.camera.positon : Vector3
    const y = raycaster.ray.origin.y; // sama dengan raycaster.camera.positon : Vector3
    const z = raycaster.ray.origin.z; // sama dengan raycaster.camera.positon : Vector3
    objectBody.ballBody.position.set( x, y, z );
    objectMesh.ballMesh.position.copy( objectBody.ballBody.position );
    objectMesh.ballMesh.quaternion.copy( objectBody.ballBody.quaternion );

}

window.addEventListener( 'pointerdown', function ( event ) {
    createBall( event );
    document.getElementById( 'count' ).innerText = ballMeshes.length;
} );

//

const mirrorGeometry = new THREE.PlaneGeometry( 1000, 1000 );
const mirrorMesh = new Reflector( mirrorGeometry, {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: 0xc1cbcb
} );

const mirrorBodyGeometry = new CANNON.Vec3( 1000, 1000, 0.1 );
const mirrorBody = new CANNON.Body( {
    mass: 0,
    shape: new CANNON.Box( mirrorBodyGeometry )
} );
mirrorBody.position.y = 500;
mirrorBody.position.z = - 500;

mirrorMesh.position.copy( mirrorBody.position );

scene.add( mirrorMesh );
world.addBody( mirrorBody );

//

const texture = ( new TGALoader() ).load( '../../sumber/loader/dinding/wall-1-square.tga',
    ( texture ) => console.log( 'Loader was load successfully' ),
    ( xhr ) => {},
    ( error ) => console.error( 'Error occured due to unknown trouble' )
);

const move = 20.5;
const wallBody = new CANNON.Vec3( 20, 20, 1 );
const wallGeometry = new THREE.BoxGeometry( wallBody.x * 2, wallBody.y * 2, wallBody.z * 2 );
const tiangGeometry = new THREE.BoxGeometry( 1, 20, 1 );

for ( let i = 0; i < 4; i ++ ) {

    const mesh = new THREE.Mesh(
        wallGeometry,
        new THREE.MeshPhongMaterial( {
            color: new THREE.Color(),
            map: texture
        } )
    );
    const body = new CANNON.Body( {
        mass: 0,
        shape: new CANNON.Box( wallBody )
    } );

    const tiang = new THREE.Mesh(
        tiangGeometry,
        new THREE.MeshPhongMaterial( {
            color: new THREE.Color( 0xa52a2a )
        } )
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    body.position.y = 10;

    tiang.castShadow = true;
    tiang.receiveShadow = true;
    tiang.position.y = 10;

    if ( i == 0 ) {
        body.position.z = move;
        tiang.position.z = move;
        tiang.position.x = move;
    } else if ( i == 1 ) {
        body.position.z = - move;
        tiang.position.z = - move;
        tiang.position.x = move;
    } else if ( i == 2 ) {
        body.quaternion.setFromEuler( 0, - Math.PI * 0.5, 0 );
        body.position.x = move;
        tiang.position.z = move;
        tiang.position.x = - move;
    } else if ( i == 3 ) {
        body.quaternion.setFromEuler( 0, - Math.PI * 0.5, 0 );
        body.position.x = - move;
        tiang.position.z = - move;
        tiang.position.x = - move;
    }

    mesh.position.copy( body.position );
    mesh.quaternion.copy( body.quaternion );

    scene.add( mesh );
    scene.add( tiang );

    world.addBody( body );

}

const atapMesh = new THREE.Mesh(
    new THREE.ConeGeometry( 37, 14, 4, 1 ),
    new THREE.MeshPhongMaterial( {
        color: new THREE.Color( 0xa52a2a )
    } )
);

const atapBody = new CANNON.Body( {
    mass: 2,
    shape: new CANNON.Cylinder( 0, 37, 14, 4 )
} );

atapBody.position.y = 37;
atapBody.quaternion.setFromEuler( 0, - Math.PI * 0.5 / 2, 0 );
console.log(atapBody);

atapMesh.position.copy( atapBody.position );
atapMesh.quaternion.copy( atapBody.quaternion );

scene.add( atapMesh );
world.addBody( atapBody );

//

function animate() {

    requestAnimationFrame( animate );

    renderer.render( scene, camera );
    controls.update( clock.getDelta() );
    stats.update();
    world.fixedStep();

    water.material.uniforms[ 'time' ].value += 1 / 60;

    for ( let i = 0; i < ballMeshes.length; i ++ ) {
        ballMeshes[ i ].position.copy( ballBodies[ i ].position );
        ballMeshes[ i ].quaternion.copy( ballBodies[ i ].quaternion );
    }


}
animate();

window.addEventListener( 'resize', function () {

    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

} );