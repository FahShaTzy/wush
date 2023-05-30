import * as THREE from '../../sumber/three.js/build/three.module.js';
import * as CANNON from '../../sumber/cannon-es/dist/cannon-es.js';
import { OrbitControls } from '../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from '../../sumber/three.js/examples/jsm/controls/PointerLockControls.js';
import Stats from '../../sumber/three.js/examples/jsm/libs/stats.module.js';

let scene, camera, renderer, stats, controls;
let planeMesh, planeBody, world, light1, light2, light3, light4, lightGroup;
let playerMesh, playerBody, objectMesh = {}, objectBody = {};
let ballMeshes = [], ballBodies = [];
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false; 

let lastCallTime = performance.now();
let prevTime = performance.now();

const size = 16;
const halfExtents = new CANNON.Vec3( size, size, size / 4 ); // menghasilkan setengah dari size jebule
const mass = 0, posX = 0, posY = size, posZ = 0;

const lightVisible = [ false, true, true, false ];

const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const raycaster2 = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const objects = [];
for ( let property in objectMesh ) array.push( objectMesh[ property ] );

initCanvas();
initWorld();
initPlayer();
initMesh();
initCannon();
initInput();
animate();

// for( let property in objectMesh ) scene.add( objectMesh[ property ] );
// for( let property in objectBody ) world.addBody( objectBody[ property ] );

function initCanvas() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 10000 );
    // camera.position.set( 0, 20, 50 );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild( renderer.domElement );

    stats = new Stats();
    stats.showPanel( 1 );
    document.body.appendChild( stats.domElement );

    // controls = new OrbitControls( camera, renderer.domElement );
    // controls.target.set( 0, 0, 0 );
    // controls.enableDamping = true;
    // controls.dampingFactor = 0.05;
    // controls.update();

    controls = new PointerLockControls( camera, document.body );

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
        new THREE.PlaneGeometry( 10000, 10000 ),
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

function initPlayer() {

    const size = 1;
    const box = new CANNON.Vec3( size, size, size );

    playerMesh = new THREE.Mesh(
        new THREE.BoxGeometry( box.x * 2, box.y * 2, box.z * 2 ),
        new THREE.MeshPhongMaterial( { color: 'white' } )
    );
    playerMesh.castShadow = true;
    playerMesh.receiveShadow = true;
    scene.add( playerMesh );

    playerBody = new CANNON.Body( {
        mass: 0,
        shape: new CANNON.Box( box ),
    } );
    playerBody.position.set( 0, size, 0 );
    world.addBody( playerBody );

    // camera.position.copy( playerMesh.position );

    const blocker = document.getElementById( 'blocker' );
	const instructions = document.getElementById( 'instructions' );

    instructions.addEventListener( 'click', () => controls.lock() );

    controls.addEventListener( 'lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    } );

    controls.addEventListener( 'unlock', function () {
        blocker.style.display = 'block';
        instructions.style.display = '';
    } );

    scene.add( controls.getObject() );

    const onKeyDown = function ( event ) {
        switch ( event.code ) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;
            case 'Space':
                canJump = true;
                console.log( canJump );
                velocity.y += 350;
                canJump = false;
                console.log( canJump );
                break;
        }
    };

    const onKeyUp = function ( event ) {
        switch ( event.code ) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;
        }
    };

    document.addEventListener( 'keydown', onKeyDown );
    document.addEventListener( 'keyup', onKeyUp );

}

function initMesh() {

    objectMesh.cubeMesh = new THREE.Mesh(
        new THREE.BoxGeometry( halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2 ),
        new THREE.MeshPhongMaterial( { color: 'white' } )
    );
    objectMesh.cubeMesh.castShadow = true;
    objectMesh.cubeMesh.receiveShadow = true;

    objects.push( objectMesh.cubeMesh );

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

        // mouseCoords.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
        mouseCoords.set( 0, 0 );

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

    const time1 = performance.now();

    lightGroup.rotation.y += 0.01;

    playerMesh.position.copy( playerBody.position );
    playerMesh.quaternion.copy( playerBody.quaternion );

    for ( let propertyObjectMesh in objectMesh ) {
        for (  let propertyObjectBody in objectBody ) {
            objectMesh[ propertyObjectMesh ].position.copy( objectBody[ propertyObjectBody ].position );
            objectMesh[ propertyObjectMesh ].quaternion.copy( objectBody[ propertyObjectBody ].quaternion );
        }
    }

    for ( let i = 0; i < ballMeshes.length; i ++ ) {
        ballMeshes[ i ].position.copy( ballBodies[ i ].position );
        ballMeshes[ i ].quaternion.copy( ballBodies[ i ].quaternion );
    }

    if ( controls.isLocked ) {

        raycaster.ray.origin.copy( controls.getObject().position );
        raycaster.ray.origin.y -= 10;

        const intersections = raycaster.intersectObjects( objects, false );

        const onObject = intersections.length > 0;

        const delta = ( time1 - prevTime ) / 1000;

        velocity.x -= velocity.x;
        velocity.z -= velocity.z;

        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveRight ) - Number( moveLeft );
        direction.normalize();

        if ( moveForward || moveBackward ) console.log( velocity.z -= direction.z * 0.1 );
        if ( moveLeft || moveRight ) console.log( velocity.x -= direction.x * 0.1 );
        if ( canJump ) {
            velocity.y = Math.max( 0, velocity.y );
            controls.getObject().position.y = velocity.y;
            console.log( canJump )
        }

        if ( onObject ) {
            velocity.y = Math.max( 0, velocity.y );
            // canJump = true;
        }

        controls.moveRight( - velocity.x * delta );
        controls.moveForward( - velocity.z * delta );

        controls.getObject().position.y += ( velocity.y * delta ); // new behavior

        if ( !controls.getObject().position.y < 10 ) {

            velocity.y = 0;
            controls.getObject().position.y = 10;

            // canJump = true;

        }

    }

}