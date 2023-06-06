import * as THREE from '../../sumber/three.js/build/three.module.js';
import { OrbitControls } from '../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import Stats from '../../sumber/three.js/examples/jsm/libs/stats.module.js';

const clock = new THREE.Clock();

let physicsWorld;

let scene, camera, renderer, controls, stats;

let rigidBodies = [], tmpTrans;
let colGroupPlane = 1, colGroupRedBall = 2, colGroupGreenBall = 4

Ammo().then( start );

function start() {

    tmpTrans = new Ammo.btTransform();
    
    setupPhysicsWorld();
    setupGraphics();
    
    createBlock();
    createBall();
    createMaskBall();
    createJointObjects();
    
    animate();
    
};

function setupPhysicsWorld() {

    physicsWorld = new Ammo.btDiscreteDynamicsWorld(
        new Ammo.btCollisionDispatcher( new Ammo.btDefaultCollisionConfiguration() ),
        new Ammo.btDbvtBroadphase(),
        new Ammo.btSequentialImpulseConstraintSolver(),
        new Ammo.btDefaultCollisionConfiguration()
    );
    physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));

}

function setupGraphics() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x87ceeb );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 300 );
    camera.position.set( 0, 10, 20 );
    camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // renderer.gammaInput = true;
    // renderer.gammaOutput = true;
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

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );

    let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
    colShape.setMargin( 0.05 );

    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );

    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let body = new Ammo.btRigidBody( rbInfo );

    physicsWorld.addRigidBody( body, colGroupPlane, colGroupRedBall );

}

function createBall(){
    
    let pos = { x: 0, y: 20, z: 0 };
    let radius = 2;
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 1;

    let ball = new THREE.Mesh(
        new THREE.SphereGeometry( radius ),
        new THREE.MeshPhongMaterial( { color: 0xff0505 } )
    );
    ball.position.set(pos.x, pos.y, pos.z);
    ball.castShadow = true;
    ball.receiveShadow = true;
    scene.add(ball);

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );

    let colShape = new Ammo.btSphereShape( radius );
    colShape.setMargin( 0.05 );

    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );

    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let body = new Ammo.btRigidBody( rbInfo );

    physicsWorld.addRigidBody( body, colGroupRedBall, colGroupPlane | colGroupGreenBall );
    
    ball.userData.physicsBody = body;
    rigidBodies.push( ball );
}

function createMaskBall(){
    
    let pos = { x: 1, y: 30, z: 0 };
    let radius = 2;
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 1;

    let ball = new THREE.Mesh(
        new THREE.SphereGeometry( radius ),
        new THREE.MeshPhongMaterial( { color: 0x00ff08 } )
    );
    ball.position.set( pos.x, pos.y, pos.z );
    ball.castShadow = true;
    ball.receiveShadow = true;
    scene.add( ball );

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );

    let colShape = new Ammo.btSphereShape( radius );
    colShape.setMargin( 0.05 );

    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );

    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let body = new Ammo.btRigidBody( rbInfo );

    physicsWorld.addRigidBody( body, colGroupGreenBall, colGroupRedBall );
    
    ball.userData.physicsBody = body;
    rigidBodies.push( ball );
}

function createJointObjects(){
    
    let pos1 = { x: -1, y: 15, z: 0 };
    let pos2 = { x: -1, y: 10, z: 0 };

    let radius = 2;
    let scale = { x: 5, y: 2, z: 2 };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass1 = 0;
    let mass2 = 1;

    let transform = new Ammo.btTransform();

    //
    let ball = new THREE.Mesh(
        new THREE.SphereGeometry( radius ),
        new THREE.MeshPhongMaterial( { color: 0xb846db } )
    );
    ball.position.set(pos1.x, pos1.y, pos1.z);
    ball.castShadow = true;
    ball.receiveShadow = true;
    scene.add(ball);

    //
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos1.x, pos1.y, pos1.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );

    let sphereColShape = new Ammo.btSphereShape( radius );
    sphereColShape.setMargin( 0.05 );

    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    sphereColShape.calculateLocalInertia( mass1, localInertia );

    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass1, motionState, sphereColShape, localInertia );
    let sphereBody = new Ammo.btRigidBody( rbInfo );

    physicsWorld.addRigidBody( sphereBody, colGroupGreenBall, colGroupRedBall );

    ball.userData.physicsBody = sphereBody;
    rigidBodies.push(ball);

    //
    let block = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshPhongMaterial( { color: 0xf78a1d } )
    );
    block.position.set(pos2.x, pos2.y, pos2.z);
    block.scale.set(scale.x, scale.y, scale.z);
    block.castShadow = true;
    block.receiveShadow = true;
    scene.add(block);

    //
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos2.x, pos2.y, pos2.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    motionState = new Ammo.btDefaultMotionState( transform );

    let blockColShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
    blockColShape.setMargin( 0.05 );

    localInertia = new Ammo.btVector3( 0, 0, 0 );
    blockColShape.calculateLocalInertia( mass2, localInertia );

    rbInfo = new Ammo.btRigidBodyConstructionInfo( mass2, motionState, blockColShape, localInertia );
    let blockBody = new Ammo.btRigidBody( rbInfo );

    physicsWorld.addRigidBody( blockBody, colGroupGreenBall, colGroupRedBall );
    
    block.userData.physicsBody = blockBody;
    rigidBodies.push(block);


    let spherePivot = new Ammo.btVector3( 0, - radius, 0 );
    let blockPivot = new Ammo.btVector3( - scale.x * 0.5, 1, 1 );

    let p2p = new Ammo.btPoint2PointConstraint( sphereBody, blockBody, spherePivot, blockPivot);
    physicsWorld.addConstraint( p2p, false );

}

function updatePhysics( deltaTime ){

    physicsWorld.stepSimulation( deltaTime, 10 );

    for ( let i = 0; i < rigidBodies.length; i++ ) {
        let objThree = rigidBodies[ i ];
        let objAmmo = objThree.userData.physicsBody;
        let ms = objAmmo.getMotionState();
        if ( ms ) {

            ms.getWorldTransform( tmpTrans );
            let p = tmpTrans.getOrigin();
            let q = tmpTrans.getRotation();
            objThree.position.set( p.x(), p.y(), p.z() );
            objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

        }
    }

}

function animate() {

    requestAnimationFrame( animate );

    let deltaTime = clock.getDelta();
    updatePhysics( deltaTime );

    renderer.render( scene, camera );
    controls.update();
    stats.update();

}

window.addEventListener( 'resize', function () {

    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

} );