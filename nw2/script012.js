import * as THREE from '../../sumber/three.js/build/three.module.js';
import { OrbitControls } from '../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import Stats from '../../sumber/three.js/examples/jsm/libs/stats.module.js';

const clock = new THREE.Clock();

let physicsWorld;

let scene, camera, renderer, controls, stats;

let tmpTrans;
const rigidBodies = [];
const colGroupPlane = 1, colGroupRedBall = 2, colGroupGreenBall = 4, colGroupBlueBall = 5;

Ammo().then( start );

function start() {

    tmpTrans = new Ammo.btTransform();
    
    setupPhysicsWorld();
    setupGraphics();
    
    createBlock();
    createRedBall();
    createGreenBall();
    createBlueBall();
    
    animate();

}

function setupPhysicsWorld() {

    physicsWorld = new Ammo.btDiscreteDynamicsWorld(
        new Ammo.btCollisionDispatcher( new Ammo.btDefaultCollisionConfiguration() ),
        new Ammo.btDbvtBroadphase(),
        new Ammo.btSequentialImpulseConstraintSolver(),
        new Ammo.btDefaultCollisionConfiguration()
    );
    physicsWorld.setGravity( new Ammo.btVector3( 0, - 9.87, 0 ) );

}

function setupGraphics() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x012345 );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 300 );
    camera.position.set( 0, 5, 20 );
    camera.lookAt( camera.position );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild( renderer.domElement );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.listenToKeyEvents( window );
    controls.target.set( 0, 0, 0 );
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.update();

    stats = new Stats();
    document.body.appendChild( stats.domElement );

    //

    const light = new THREE.PointLight( new THREE.Color( 0xffffff ) );
    light.position.set( 10, 10, 10 );
    light.castShadow = true;
    light.shadow.mapSize.x = 256;
    light.shadow.mapSize.y = 256;
    scene.add( light );

    //

}

function createBlock() {

    const pos = { x: 0, y: 0, z: 0 };
    const scale = { x: 50, y: 2, z: 50 };
    const quat = { x: 0, y: 0, z: 0, w: 1 };
    const mass = 0;

    const blockPlane = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshPhongMaterial( { color: 0x56b73d } )
    );
    blockPlane.position.set( pos.x, pos.y, pos.z );
    blockPlane.scale.set( scale.x, scale.y, scale.z );
    blockPlane.castShadow = true;
    blockPlane.receiveShadow = true;
    scene.add( blockPlane );

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    const motionState = new Ammo.btDefaultMotionState( transform );

    const colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
    colShape.setMargin( 0.05 );

    const localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );

    const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    const body = new Ammo.btRigidBody( rbInfo );

    physicsWorld.addRigidBody( body, colGroupPlane, colGroupRedBall | colGroupGreenBall | colGroupBlueBall);

}

function createRedBall(){

    const pos = { x: 0, y: 20, z: 0 };
    const radius = 2;
    const quat = { x: 0, y: 0, z: 0, w: 1 };
    const mass = 1;

    const ball = new THREE.Mesh(
        new THREE.SphereGeometry( radius, 32, 16 ),
        new THREE.MeshPhongMaterial( { color: 0xff0505 } )
    );
    ball.position.set( pos.x, pos.y, pos.z );
    ball.castShadow = true;
    ball.receiveShadow = true;
    scene.add( ball );

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    const motionState = new Ammo.btDefaultMotionState( transform );

    const colShape = new Ammo.btSphereShape( radius );
    colShape.setMargin( 0.05 );

    const localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );

    const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    const body = new Ammo.btRigidBody( rbInfo );

    physicsWorld.addRigidBody( body, colGroupRedBall, colGroupPlane | colGroupGreenBall | colGroupBlueBall );

    ball.userData.physicsBody = body;
    rigidBodies.push( ball );

}

function createGreenBall(){

    const pos = { x: 1, y: 30, z: 0 };
    const radius = 2;
    const quat = { x: 0, y: 0, z: 0, w: 1 };
    const mass = 1;

    const ball = new THREE.Mesh(
        new THREE.SphereGeometry( radius, 32, 16 ),
        new THREE.MeshPhongMaterial( { color: 0x05ff05 } )
    );
    ball.position.set( pos.x, pos.y, pos.z );
    ball.castShadow = true;
    ball.receiveShadow = true;
    scene.add( ball );

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    const motionState = new Ammo.btDefaultMotionState( transform );

    const colShape = new Ammo.btSphereShape( radius );
    colShape.setMargin( 0.05 );

    const localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );

    const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    const body = new Ammo.btRigidBody( rbInfo );

    physicsWorld.addRigidBody( body, colGroupGreenBall, colGroupPlane | colGroupRedBall | colGroupBlueBall );

    ball.userData.physicsBody = body;
    rigidBodies.push( ball );

}

function createBlueBall(){

    const pos = { x: 2, y: 40, z: 0 };
    const radius = 2;
    const quat = { x: 0, y: 0, z: 0, w: 1 };
    const mass = 1;

    const ball = new THREE.Mesh(
        new THREE.SphereGeometry( radius, 32, 16 ),
        new THREE.MeshPhongMaterial( { color: 0x0505ff } )
    );
    ball.position.set( pos.x, pos.y, pos.z );
    ball.castShadow = true;
    ball.receiveShadow = true;
    scene.add( ball );

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    const motionState = new Ammo.btDefaultMotionState( transform );

    const colShape = new Ammo.btSphereShape( radius );
    colShape.setMargin( 0.05 );

    const localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );

    const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    const body = new Ammo.btRigidBody( rbInfo );

    physicsWorld.addRigidBody( body, colGroupBlueBall, colGroupPlane | colGroupRedBall | colGroupGreenBall );

    ball.userData.physicsBody = body;
    rigidBodies.push( ball );

}

function updatePhysics( deltaTime ){

    physicsWorld.stepSimulation( deltaTime, 10 );

    for ( let i in rigidBodies ) {
        const objThree = rigidBodies[ i ];
        const objAmmo = objThree.userData.physicsBody;
        const ms = objAmmo.getMotionState();
        if ( ms ) {
            ms.getWorldTransform( tmpTrans );
            const p = tmpTrans.getOrigin();
            const q = tmpTrans.getRotation();
            objThree.position.set( p.x(), p.y(), p.z() );
            objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
        }
    }

}

function animate() {

    requestAnimationFrame( animate );

    const deltaTime = clock.getDelta();
    updatePhysics( deltaTime )

    renderer.render( scene, camera );
    controls.update();
    stats.update();

}

window.addEventListener( 'resize', function () {

    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

} );