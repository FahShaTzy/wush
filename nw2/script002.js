import * as THREE from '../../sumber/three.js/build/three.module.js';
import * as CANNON from '../../sumber/cannon-es/dist/cannon-es.js';
import { OrbitControls } from '../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from '../../sumber/three.js/examples/jsm/controls/PointerLockControls.js';
import Stats from '../../sumber/three.js/examples/jsm/libs/stats.module.js';

Boolean( document.getElementById( 'titik' ) ) ? document.getElementById( 'titik' ).style.display = 'none' : false;

let scene, camera, renderer, stats, controls;
let planeMesh, planeBody, world, light1, light2, light3, light4, lightGroup;
let objectMesh = {}, objectBody = {};
let ballMeshes = [], ballBodies = [];

let lastCallTime = performance.now();

const size = 16;
const halfExtents = new CANNON.Vec3( size, size, size / 4 ); // menghasilkan setengah dari size jebule
const mass = 0, posX = 0, posY = 16, posZ = 0;

const lightVisible = [ true, true, true, true ];

const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

initCanvas();
initWorld();
initMesh();
initCannon();
initInput();
animate();

for ( let propertyObjectMesh in objectMesh ) {
    for ( let propertyObjectBody in objectBody ) {
        scene.add( objectMesh[ propertyObjectMesh ] );
        world.addBody( objectBody[ propertyObjectBody ] );
        objectMesh[ propertyObjectMesh ].position.copy( objectBody[ propertyObjectBody ].position );
        objectMesh[ propertyObjectMesh ].quaternion.copy( objectBody[ propertyObjectBody ].quaternion );
    }
}

function initCanvas() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x012345 );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 300 );
    camera.position.set( 0, 20, 50 );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild( renderer.domElement );

    stats = new Stats();
    stats.showPanel( 1 );
    document.body.appendChild( stats.domElement );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.target.set( 0, 0, 0 );
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.update();

    window.addEventListener( 'resize', () => {

        renderer.setSize( window.innerWidth, window.innerHeight );
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

    } );

}

function initWorld() {

    world = new CANNON.World( {
        gravity: new CANNON.Vec3( 0, -9.82, 0 )
    } );

    planeMesh = new THREE.Mesh(
        new THREE.PlaneGeometry( 300, 300 ),
        new THREE.MeshPhongMaterial( { color: 'white', side: THREE.DoubleSide } )
    );
    planeMesh.receiveShadow = true;
    planeMesh.rotation.x = - Math.PI * 0.5;

    planeBody = new CANNON.Body( {
        mass: 0,
        shape: new CANNON.Plane()
    } );
    planeBody.quaternion.setFromEuler( - Math.PI * 0.5, 0, 0 );
    
    world.addBody( planeBody );
    scene.add( planeMesh );

    const long = 1000;
    scene
    // .add( new THREE.AxesHelper( long, long, long ).setColors( 'red', 'green', 'blue' ) )
    // .add( new THREE.AxesHelper( -long, -long, -long ).setColors( 'red', 'green', 'blue' ) );

    const lightIntensity = 1;
    const distanceFromCenter = 100;
    const shadowMapSize = 512;
    renderLight();

    function renderLight() {

        lightGroup = new THREE.Group();

        light1 = new THREE.PointLight( 'red', lightIntensity );
        light1.position.set( 0, 10, -distanceFromCenter );
        light1.castShadow = true;
        light1.shadow.mapSize.width = shadowMapSize;
        light1.shadow.mapSize.height = shadowMapSize;
        light1.visible = lightVisible[ 0 ];

        light2 = new THREE.PointLight( 'green', lightIntensity );
        light2.position.set( -distanceFromCenter, 10, 0 );
        light2.castShadow = true;
        light2.shadow.mapSize.width = shadowMapSize;
        light2.shadow.mapSize.height = shadowMapSize;
        light2.visible = lightVisible[ 1 ];

        light3 = new THREE.PointLight( 'blue', lightIntensity );
        light3.position.set( distanceFromCenter, 10, 0 );
        light3.castShadow = true;
        light3.shadow.mapSize.width = shadowMapSize;
        light3.shadow.mapSize.height = shadowMapSize;
        light3.visible = lightVisible[ 2 ];

        light4 = new THREE.PointLight( 'yellow', lightIntensity / 2 );
        light4.position.set( 0, 10, distanceFromCenter );
        light4.castShadow = true;
        light4.shadow.mapSize.width = shadowMapSize;
        light4.shadow.mapSize.height = shadowMapSize;
        light4.visible = lightVisible[ 3 ];

        const helper1 = new THREE.PointLightHelper( light1 );
        const helper2 = new THREE.PointLightHelper( light2 );
        const helper3 = new THREE.PointLightHelper( light3 );
        const helper4 = new THREE.PointLightHelper( light4 );

        lightGroup.add( light1 ).add( light2 ).add( light3 ).add( light4 );
        // scene.add( helper1 ).add( helper2 ).add( helper3 ).add( helper4 );

        scene.add( lightGroup );

    }

}

function initMesh() {

    objectMesh.cubeMesh = new THREE.Mesh(
        new THREE.BoxGeometry( halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2 ),
        new THREE.MeshPhongMaterial( { color: 'white' } )
    );
    objectMesh.cubeMesh.castShadow = true;
    objectMesh.cubeMesh.receiveShadow = true;

}

function initCannon() {

    objectBody.cubeBody = new CANNON.Body( {
        mass: mass,
        shape: new CANNON.Box( halfExtents ),
    } );
    objectBody.cubeBody.position.set( posX, posY, posZ );

}

function initInput() {

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

}

function animate() {

    requestAnimationFrame( animate );

    renderer.render( scene, camera );
    // controls.update();
    stats.update();

    const time = performance.now() / 1000;
    const dt = time - lastCallTime;
    lastCallTime = time;
    world.step( 1 / 60, dt );

    lightGroup.rotation.y += 0.01;

    for ( let i = 0; i < ballMeshes.length; i ++ ) {
        ballMeshes[ i ].position.copy( ballBodies[ i ].position );
        ballMeshes[ i ].quaternion.copy( ballBodies[ i ].quaternion );
    }

}