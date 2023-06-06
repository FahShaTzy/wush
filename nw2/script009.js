import * as THREE from '../../sumber/three.js/build/three.module.js';
import * as CANNON from '../../sumber/cannon-es/dist/cannon-es.js';
import { OrbitControls } from '../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import { FirstPersonControls } from '../../sumber/three.js/examples/jsm/controls/FirstPersonControls.js';
import Stats from '../../sumber/three.js/examples/jsm/libs/stats.module.js';
import { Water } from '../../sumber/three.js/examples/jsm/objects/Water.js';
import { Sky } from '../../sumber/three.js/examples/jsm/objects/Sky.js';

const scene = new THREE.Scene();

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

const clock = new THREE.Clock();

const controls = new OrbitControls( camera, renderer.domElement );
controls.listenToKeyEvents( window );
controls.target.set( 0, 0, 0 );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.01;
controls.update();

// const controls = new FirstPersonControls( camera, renderer.domElement );
// controls.movementSpeed = 200;
// controls.lookSpeed = 0.1;
// controls.autoForward = true;

const stats = new Stats();
document.body.appendChild( stats.domElement );

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

const world = new CANNON.World( {
    gravity: new CANNON.Vec3( 0, -9.82, 0 )
} );

//

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

    raycaster.setFromCamera( mouseCoords, camera );

    objectMesh.ballMesh = new THREE.Mesh(
        new THREE.SphereGeometry( 1, 16, 16 ),
        new THREE.MeshPhongMaterial( { color: 'white' } )
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

function animate() {

    requestAnimationFrame( animate );

    renderer.render( scene, camera );
    controls.update( clock.getDelta() );
    stats.update();
    world.fixedStep();

    water.material.uniforms[ 'time' ].value += 0.1 / 60;

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

    controls.handleResize();

} );