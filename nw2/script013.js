import * as THREE from '../../sumber/three.js/build/three.module.js';
import Stats from '../../sumber/three.js/examples/jsm//libs/stats.module.js';
import { OrbitControls } from '../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import { ConvexObjectBreaker } from '../../sumber/three.js/examples/jsm/misc/ConvexObjectBreaker.js';
import { ConvexGeometry } from '../../sumber/three.js/examples/jsm/geometries/ConvexGeometry.js';
import { Water } from '../../sumber/three.js/examples/jsm/objects/Water.js';
import { Sky } from '../../sumber/three.js/examples/jsm/objects/Sky.js';
import { TGALoader } from '../../sumber/three.js/examples/jsm/loaders/TGALoader.js';

// - Global variables -

// Graphics variables
let stats;
let camera, controls, scene, renderer;
let textureLoader, water;
const clock = new THREE.Clock();

const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const ballMaterial = new THREE.MeshPhongMaterial( { color: 0x202020 } );

// Physics variables
const gravityConstant = 7.8;
let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
let physicsWorld;
const margin = 0.05;

const convexBreaker = new ConvexObjectBreaker();

// Rigid bodies include all movable objects
const rigidBodies = [];

const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
let transformAux1;
let tempBtVec3_1;

const objectsToRemove = [];

for ( let i = 0; i < 500; i ++ ) {

    objectsToRemove[ i ] = null;

}

let numObjectsToRemove = 0;

const impactPoint = new THREE.Vector3();
const impactNormal = new THREE.Vector3();

// - Main code -

Ammo().then( function ( AmmoLib ) {

    Ammo = AmmoLib;

    init();
    animate();

} );


// - Functions -

function init() {

    initGraphics();

    initPhysics();

    createObjects();

    initInput();

}

function initGraphics() {

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 20000 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x012345 );

    camera.position.set( 0, 20, 20 );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.2;
    document.body.appendChild( renderer.domElement );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.target.set( 0, 8, 0 );
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI * 0.5 - 0.01;
    controls.update();

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    document.body.appendChild( stats.domElement );

    //

    const ambientLight = new THREE.AmbientLight( new THREE.Color( 0xffffff ) );
    // scene.add( ambientLight );

    const pointLight1 = new THREE.PointLight( new THREE.Color(), 3 );
    pointLight1.castShadow = true;
    pointLight1.shadow.mapSize.x = 4096;
    pointLight1.shadow.mapSize.y = 4096;
    pointLight1.position.set( - 50, 100, 50 );
    scene.add( pointLight1 );

    //

    window.addEventListener( 'resize', onWindowResize );

    //

    const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
    water = new Water(
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

    let renderTarget;

    sun.setFromSphericalCoords( 1, THREE.MathUtils.degToRad( 90 - 150 ) /* elevation */, THREE.MathUtils.degToRad( 100 ) /* azimuth */ );

    sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
    water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

    if ( renderTarget !== undefined ) renderTarget.dispose();

    renderTarget = pmremGenerator.fromScene( sky );
    scene.environment = renderTarget.texture;

    //

}

function initPhysics() {

    // Physics configuration

    collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
    broadphase = new Ammo.btDbvtBroadphase();
    solver = new Ammo.btSequentialImpulseConstraintSolver();
    physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
    physicsWorld.setGravity( new Ammo.btVector3( 0, - gravityConstant, 0 ) );

    transformAux1 = new Ammo.btTransform();
    tempBtVec3_1 = new Ammo.btVector3( 0, 0, 0 );

}

function createObject( mass, halfExtents, pos, quat, material ) {

    const object = new THREE.Mesh( new THREE.BoxGeometry( halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2 ), material );
    object.position.copy( pos );
    object.quaternion.copy( quat );
    object.castShadow = true;
    object.receiveShadow = true;
    convexBreaker.prepareBreakableObject( object, mass, new THREE.Vector3(), new THREE.Vector3(), true );
    createDebrisFromBreakableObject( object );

}

function createObjects() {

    pos.set( 0, - 0.5, 0 );
    quat.set( 0, 0, 0, 1 );
    const ground = createParalellepipedWithPhysics( 100, 1, 100, 0, pos, quat, new THREE.MeshPhongMaterial( { color: 0xFFFFFF } ) );
    ground.receiveShadow = true;
    ground.visible = false;

    // Math.floor( Math.random() * ( 1 << 24 ) ) // warna acak

    const tgaLoader = new TGALoader();
    const textureLoader = new THREE.TextureLoader();
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    const texture = textureLoader.load( '../../sumber/loader/dinding/wall-1-compressed-824x549.jpg' );
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 100, 8 );

    const texture2 = textureLoader.load( '../../sumber/loader/kayu/serat-kayu-4-compressed-500x500.jpg' );
    texture2.colorSpace = THREE.SRGBColorSpace;
    texture2.wrapT = texture2.wrapS = THREE.RepeatWrapping;
    texture2.anisotropy = maxAnisotropy;
    texture2.repeat.set( 64, 64 );

    const texture3 = textureLoader.load( '../../sumber/loader/dinding2/dinding-3-compressed-1030x686.jpg' );
    texture2.colorSpace = THREE.SRGBColorSpace;
    texture2.wrapT = texture2.wrapS = THREE.RepeatWrapping;
    texture3.anisotropy = maxAnisotropy;

    const materials = [
        new THREE.MeshPhongMaterial( { map: texture } ),    // belakang
        new THREE.MeshPhongMaterial( { map: texture } ),    // depan
        new THREE.MeshPhongMaterial( { map: texture2 } ),    // atas
        new THREE.MeshPhongMaterial(),    // bawah
        new THREE.MeshPhongMaterial( { map: texture } ),    // kiri
        new THREE.MeshPhongMaterial( { map: texture } ),    // kanan
    ]

    const landasanMass = 0;
    const landasanHalfExtents= new THREE.Vector3( 50, 4, 50 );
    pos.set( 0, 4, 0 );
    quat.set( 0, 0, 0, 1 );
    createObject( landasanMass, landasanHalfExtents, pos, quat, materials );

    const tembokDepth = 0.2;
    const jarak = 4.2;
    const ketinggian = 10;
    const tembokMass = 10;

    const tembokHalfExtents1 = new THREE.Vector3( 4 + 0.4, 2, tembokDepth );
    pos.set( 0, ketinggian, jarak );
    quat.set( 0, 0, 0, 1 );
    createObject( tembokMass, tembokHalfExtents1, pos, quat, new THREE.MeshPhongMaterial( {
        color: new THREE.Color(),
        map: texture3
    } ) );

    const tembokHalfExtents2 = new THREE.Vector3( 4 + 0.4, 2, tembokDepth );
    pos.set( 0, ketinggian, - jarak );
    quat.set( 0, 0, 0, 1 );
    createObject( tembokMass, tembokHalfExtents2, pos, quat, new THREE.MeshPhongMaterial( {
        color: new THREE.Color(),
        map: texture3
    } ) );

    const tembokHalfExtents3 = new THREE.Vector3( tembokDepth, 2, 4 );
    pos.set( jarak, ketinggian, 0 );
    quat.set( 0, 0, 0, 1 );
    createObject( tembokMass, tembokHalfExtents3, pos, quat, new THREE.MeshPhongMaterial( {
        color: new THREE.Color(),
        map: texture3
    } ) );

    const tembokHalfExtents4 = new THREE.Vector3( tembokDepth, 2, 4 );
    pos.set( - jarak, ketinggian, 0 );
    quat.set( 0, 0, 0, 1 );
    createObject( tembokMass, tembokHalfExtents4, pos, quat, new THREE.MeshPhongMaterial( {
        color: new THREE.Color(),
        map: texture3
    } ) );

}

function createParalellepipedWithPhysics( sx, sy, sz, mass, pos, quat, material ) {

    const object = new THREE.Mesh( new THREE.BoxGeometry( sx, sy, sz, 1, 1, 1 ), material );
    const shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
    shape.setMargin( margin );

    createRigidBody( object, shape, mass, pos, quat );

    return object;

}

function createDebrisFromBreakableObject( object ) {

    object.castShadow = true;
    object.receiveShadow = true;

    const shape = createConvexHullPhysicsShape( object.geometry.attributes.position.array );
    shape.setMargin( margin );

    const body = createRigidBody( object, shape, object.userData.mass, null, null, object.userData.velocity, object.userData.angularVelocity );

    // Set pointer back to the three object only in the debris objects
    const btVecUserData = new Ammo.btVector3( 0, 0, 0 );
    btVecUserData.threeObject = object;
    body.setUserPointer( btVecUserData );

}

function removeDebris( object ) {

    scene.remove( object );

    physicsWorld.removeRigidBody( object.userData.physicsBody );

}

function createConvexHullPhysicsShape( coords ) {

    const shape = new Ammo.btConvexHullShape();

    for ( let i = 0, il = coords.length; i < il; i += 3 ) {

        tempBtVec3_1.setValue( coords[ i ], coords[ i + 1 ], coords[ i + 2 ] );
        const lastOne = ( i >= ( il - 3 ) );
        shape.addPoint( tempBtVec3_1, lastOne );

    }

    return shape;

}

function createRigidBody( object, physicsShape, mass, pos, quat, vel, angVel ) {

    if ( pos ) object.position.copy( pos );
    else pos = object.position;
    if ( quat ) object.quaternion.copy( quat );
    else quat = object.quaternion;

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    const motionState = new Ammo.btDefaultMotionState( transform );

    const localInertia = new Ammo.btVector3( 0, 0, 0 );
    physicsShape.calculateLocalInertia( mass, localInertia );

    const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
    const body = new Ammo.btRigidBody( rbInfo );

    body.setFriction( 0.5 );

    if ( vel ) {

        body.setLinearVelocity( new Ammo.btVector3( vel.x, vel.y, vel.z ) );

    }

    if ( angVel ) {

        body.setAngularVelocity( new Ammo.btVector3( angVel.x, angVel.y, angVel.z ) );

    }

    object.userData.physicsBody = body;
    object.userData.collided = false;

    scene.add( object );

    if ( mass > 0 ) {

        rigidBodies.push( object );

        // Disable deactivation
        body.setActivationState( 4 );

    }

    physicsWorld.addRigidBody( body );

    return body;

}

function initInput() {

    window.addEventListener( 'pointerdown', function ( event ) {

        mouseCoords.set(
            ( event.clientX / window.innerWidth ) * 2 - 1,
            - ( event.clientY / window.innerHeight ) * 2 + 1
        );

        raycaster.setFromCamera( mouseCoords, camera );

        // Creates a ball and throws it
        const ballMass = 1;
        const ballRadius = 0.4;

        const ball = new THREE.Mesh( new THREE.SphereGeometry( ballRadius, 14, 10 ), ballMaterial );
        ball.castShadow = true;
        ball.receiveShadow = true;
        const ballShape = new Ammo.btSphereShape( ballRadius );
        ballShape.setMargin( margin );
        pos.copy( raycaster.ray.direction );
        pos.add( raycaster.ray.origin );
        quat.set( 0, 0, 0, 1 );
        const ballBody = createRigidBody( ball, ballShape, ballMass, pos, quat );

        pos.copy( raycaster.ray.direction );
        pos.multiplyScalar( 37 ); // 24
        ballBody.setLinearVelocity( new Ammo.btVector3( pos.x, pos.y, pos.z ) );

    } );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    render();
    stats.update();
    controls.update();
    water.material.uniforms[ 'time' ].value += 1 / 60;

}

function render() {

    const deltaTime = clock.getDelta();

    updatePhysics( deltaTime );

    renderer.render( scene, camera );

}

function updatePhysics( deltaTime ) {

    // Step world
    physicsWorld.stepSimulation( deltaTime, 10 );

    // Update rigid bodies
    for ( let i = 0, il = rigidBodies.length; i < il; i ++ ) {

        const objThree = rigidBodies[ i ];
        const objPhys = objThree.userData.physicsBody;
        const ms = objPhys.getMotionState();

        if ( ms ) {

            ms.getWorldTransform( transformAux1 );
            const p = transformAux1.getOrigin();
            const q = transformAux1.getRotation();
            objThree.position.set( p.x(), p.y(), p.z() );
            objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

            objThree.userData.collided = false;

        }

    }

    for ( let i = 0, il = dispatcher.getNumManifolds(); i < il; i ++ ) {

        const contactManifold = dispatcher.getManifoldByIndexInternal( i );
        const rb0 = Ammo.castObject( contactManifold.getBody0(), Ammo.btRigidBody );
        const rb1 = Ammo.castObject( contactManifold.getBody1(), Ammo.btRigidBody );

        const threeObject0 = Ammo.castObject( rb0.getUserPointer(), Ammo.btVector3 ).threeObject;
        const threeObject1 = Ammo.castObject( rb1.getUserPointer(), Ammo.btVector3 ).threeObject;

        if ( ! threeObject0 && ! threeObject1 ) {

            continue;

        }

        const userData0 = threeObject0 ? threeObject0.userData : null;
        const userData1 = threeObject1 ? threeObject1.userData : null;

        const breakable0 = userData0 ? userData0.breakable : false;
        const breakable1 = userData1 ? userData1.breakable : false;

        const collided0 = userData0 ? userData0.collided : false;
        const collided1 = userData1 ? userData1.collided : false;

        if ( ( ! breakable0 && ! breakable1 ) || ( collided0 && collided1 ) ) {

            continue;

        }

        let contact = false;
        let maxImpulse = 0;
        for ( let j = 0, jl = contactManifold.getNumContacts(); j < jl; j ++ ) {

            const contactPoint = contactManifold.getContactPoint( j );

            if ( contactPoint.getDistance() < 0 ) {

                contact = true;
                const impulse = contactPoint.getAppliedImpulse();

                if ( impulse > maxImpulse ) {

                    maxImpulse = impulse;
                    const pos = contactPoint.get_m_positionWorldOnB();
                    const normal = contactPoint.get_m_normalWorldOnB();
                    impactPoint.set( pos.x(), pos.y(), pos.z() );
                    impactNormal.set( normal.x(), normal.y(), normal.z() );

                }

                break;

            }

        }

        // If no point has contact, abort
        if ( ! contact ) continue;

        // Subdivision

        const fractureImpulse = 250;

        if ( breakable0 && ! collided0 && maxImpulse > fractureImpulse ) {

            const debris = convexBreaker.subdivideByImpact( threeObject0, impactPoint, impactNormal, 1, 2, 1.5 );

            const numObjects = debris.length;
            for ( let j = 0; j < numObjects; j ++ ) {

                const vel = rb0.getLinearVelocity();
                const angVel = rb0.getAngularVelocity();
                const fragment = debris[ j ];
                fragment.userData.velocity.set( vel.x(), vel.y(), vel.z() );
                fragment.userData.angularVelocity.set( angVel.x(), angVel.y(), angVel.z() );

                createDebrisFromBreakableObject( fragment );

            }

            objectsToRemove[ numObjectsToRemove ++ ] = threeObject0;
            userData0.collided = true;

        }

        if ( breakable1 && ! collided1 && maxImpulse > fractureImpulse ) {

            const debris = convexBreaker.subdivideByImpact( threeObject1, impactPoint, impactNormal, 1, 2, 1.5 );

            const numObjects = debris.length;
            for ( let j = 0; j < numObjects; j ++ ) {

                const vel = rb1.getLinearVelocity();
                const angVel = rb1.getAngularVelocity();
                const fragment = debris[ j ];
                fragment.userData.velocity.set( vel.x(), vel.y(), vel.z() );
                fragment.userData.angularVelocity.set( angVel.x(), angVel.y(), angVel.z() );

                createDebrisFromBreakableObject( fragment );

            }

            objectsToRemove[ numObjectsToRemove ++ ] = threeObject1;
            userData1.collided = true;

        }

    }

    for ( let i = 0; i < numObjectsToRemove; i ++ ) {

        removeDebris( objectsToRemove[ i ] );

    }

    numObjectsToRemove = 0;

}