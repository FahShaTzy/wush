import * as THREE from '../../sumber/three.js/build/three.module.js';
import * as CANNON from '../../sumber/cannon-es/dist/cannon-es.js';
import Stats from '../../sumber/three.js/examples/jsm/libs/stats.module.js';
import { OrbitControls } from '../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import { PointerLockControlsCannon } from '../../sumber/cannon-es/examples/js/PointerLockControlsCannon.js';
// import { addTitle, addSourceButton } from '../../sumber/cannon-es/examples/js/dom-utils.js';

// addTitle();
// addSourceButton();

let camera, scene, renderer, stats, controls;

let world;
const timeStep = 1 / 60;
let lastCallTime = performance.now();
let sphereShape;
let sphereBody;
let physicsMaterial;
const balls = [];
const ballMeshes = [];
const boxes = [];
const boxMeshes = [];
const instructions = document.getElementById( 'instructions' );

initThree();
initCannon();
// initPointerLock();
animate();

function initThree() {

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 2000 );
	camera.position.set( 0, 10, 20 );

	scene = new THREE.Scene();
	// scene.fog = new THREE.Fog( 'white', 0, 500 ); // 'black'
	scene.background = new THREE.Color( 0x012345 );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	// renderer.setClearColor( scene.fog.color );
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	document.body.appendChild( renderer.domElement );

	controls = new OrbitControls( camera, renderer.domElement );
	controls.target.set( 0, 2, 0 );
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;
	controls.update();

	stats = new Stats();
	document.body.appendChild( stats.domElement );

	scene
	.add( new THREE.AxesHelper( 100, 100, 100 ).setColors( 'red', 'green', 'blue' ) )
	.add( new THREE.AxesHelper( -100, -100, -100 ).setColors( 'red', 'green', 'blue' ) );

	// Lights
	const ambientLight = new THREE.AmbientLight( 0xffffff, 0.1 );
	scene.add( ambientLight );

	const spotlight = new THREE.SpotLight( 'cyan', 0.9, 0, Math.PI / 4, 1 );
	spotlight.castShadow = true;
	spotlight.position.set( 20, 20, 20 );
	spotlight.target.position.set( 0, 0, 0 );
	spotlight.shadow.camera.near = 10;
	spotlight.shadow.camera.far = 50;
	spotlight.shadow.camera.fov = 30;
	spotlight.shadow.bias = -0.0001; // asline disabled
	spotlight.shadow.mapSize.width = 4096; // pernah dicoba sampai 131072, sebaiknya tetap di bawah 8192
	spotlight.shadow.mapSize.height = 4096;// pernah dicoba sampai 131072, sebaiknya tetap di bawah 8192
	// scene.add( spotlight );

	const spotLightHelper = new THREE.SpotLightHelper( spotlight );
	// scene.add( spotLightHelper );

	const pointLight = new THREE.PointLight( 'cyan' );
	pointLight.castShadow = true;
	pointLight.position.set( -10, 20, -10 );
	pointLight.shadow.mapSize.width = 4096; // pernah dicoba sampai 65536, sebaiknya tetap di bawah 8192
	pointLight.shadow.mapSize.height = 4096; // pernah dicoba sampai 65536, sebaiknya tetap di bawah 8192
	pointLight.shadow.camera.near = 0.1;
	pointLight.shadow.camera.far = 1000;
	scene.add( pointLight );

	const pointLightHelper = new THREE.PointLightHelper( pointLight );
	scene.add( pointLightHelper );

	const directionalLight = new THREE.DirectionalLight( 'cyan' );
	directionalLight.castShadow = true;
	directionalLight.position.set( 20, 20, -20 );
	directionalLight.shadow.camera.left = -23;
	directionalLight.shadow.camera.right = 23;
	directionalLight.shadow.camera.top = 23;
	directionalLight.shadow.camera.bottom = -23;
	directionalLight.shadow.camera.near = 2;
	directionalLight.shadow.camera.far = 50;
	directionalLight.shadow.mapSize.x = 2048; // jangan lebih dari 8192, nanti ngelag
	directionalLight.shadow.mapSize.y = 2048; // jangan lebih dari 8192, nanti ngelag
	// scene.add( directionalLight );

	const directionalLightHelper = new THREE.DirectionalLightHelper( directionalLight );
	// scene.add( directionalLightHelper );

	const floorGeometry = new THREE.PlaneGeometry( 300, 300, 100, 100 );
	floorGeometry.rotateX( - Math.PI / 2 );
	const floor = new THREE.Mesh( floorGeometry, new THREE.MeshPhongMaterial( { color: 'green', side: THREE.DoubleSide } ) );
	floor.receiveShadow = true;
	scene.add( floor );

	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	} );
}

function initCannon() {

	world = new CANNON.World();
	world.defaultContactMaterial.contactEquationStiffness = 1e9; // 1e9
	world.defaultContactMaterial.contactEquationRelaxation = 4; // 4

	const solver = new CANNON.GSSolver();
	solver.iterations = 7;
	solver.tolerance = 0.1;
	world.solver = new CANNON.SplitSolver( solver );
	// world.solver = solver // use this to test non-split solver
	world.gravity.set( 0, -9.87, 0 ); // -20 asline

	physicsMaterial = new CANNON.Material('physics');
	const physics_physics = new CANNON.ContactMaterial( physicsMaterial, physicsMaterial, {
		friction: 0.0,
		restitution: 0.3,
	} );

	world.addContactMaterial( physics_physics );

	const groundBody = new CANNON.Body( { mass: 0, material: physicsMaterial } );
	groundBody.addShape( new CANNON.Plane() );
	groundBody.quaternion.setFromEuler( - Math.PI / 2, 0, 0 );
	world.addBody( groundBody );

	const sphereRadius = 1;
	sphereShape = new CANNON.Sphere( sphereRadius ); // 1.3 seko const radius = 1.3
	sphereBody = new CANNON.Body( { mass: 5, material: physicsMaterial } );
	sphereBody.addShape( sphereShape );
	sphereBody.position.set( 0, 0, 0 );
	sphereBody.linearDamping = 0.9; // 0.9. hanya 0.99 s/d 0.01
	world.addBody( sphereBody );

	// The shooting balls
	const shootVelocity = 15;
	const ballShape = new CANNON.Sphere( 0.2 );
	const ballGeometry = new THREE.SphereGeometry( ballShape.radius, 32, 32 );
	const ballMaterial = new THREE.MeshPhongMaterial( { color: 'darkBlue' } );

	function getShootDirection() {
		const vector = new THREE.Vector3( 0, 0, 0 );
		// vector.unproject( camera );
		// const ray = new THREE.Ray( 10, vector.sub( sphereBody.position ).normalize() );
		// return ray.direction;
		// return vector.sub( sphereBody.position ).normalize();
		return new THREE.Vector3( 0, 0, 0 );
	}

	window.addEventListener('keydown', (event) => {
		// if ( !controls.enabled ) return;

		const ballBody = new CANNON.Body( { mass: 1 } );
		ballBody.addShape( ballShape );
		const ballMesh = new THREE.Mesh( ballGeometry, ballMaterial );

		ballMesh.castShadow = true;
		ballMesh.receiveShadow = true;

		world.addBody( ballBody );
		scene.add( ballMesh );
		balls.push( ballBody );
		ballMeshes.push( ballMesh );

		const shootDirection = getShootDirection();
		ballBody.velocity.set(
			shootDirection.x * shootVelocity,
			shootDirection.y * shootVelocity,
			shootDirection.z * shootVelocity
		);

		// Ubah posisi bola untuk menjauhi pengguna
		const x = sphereBody.position.x + shootDirection.x * ( sphereRadius * 1.02 + ballShape.radius );
		const y = sphereBody.position.y + shootDirection.y * ( sphereRadius * 1.02 + ballShape.radius );
		const z = sphereBody.position.z + shootDirection.z * ( sphereRadius * 1.02 + ballShape.radius );
		ballBody.position.set( x, y, z );
		// console.log( `x: ${ sphereBody.position.x }\ny: ${ sphereBody.position.y }\nz: ${ sphereBody.position.z }` );
		// console.log( `x: ${ x }\ny: ${ y }\nz: ${ z }` );
		console.log( `x: ${ ballBody.position.x }\ny: ${ ballBody.position.y }\nz: ${ ballBody.position.z }` );
		ballMesh.position.copy( ballBody.position );

		if ( balls.length == 500 ) alert( 'The ball count has reached 500' );

		document.getElementById( 'bola' ).innerText = balls.length;
	} );
}

function initPointerLock() {
	controls = new PointerLockControlsCannon( camera, sphereBody );
	scene.add( controls.getObject() );

	instructions.addEventListener( 'click', () => controls.lock() );

	controls.addEventListener( 'lock', () => {
		controls.enabled = true;
		instructions.style.display = 'none';
	} );

	controls.addEventListener( 'unlock', () => {
		controls.enabled = false;
		instructions.style.display = null;
	} );
}

function animate() {
	requestAnimationFrame( animate );

	const time = performance.now() / 1000;
	const dt = time - lastCallTime;
	lastCallTime = time;

	if ( controls.enabled ) {
	world.step( timeStep, dt );

	// Update ball positions
	for ( let i = 0; i < balls.length; i++ ) {
		ballMeshes[ i ].position.copy( balls[ i ].position );
		ballMeshes[ i ].quaternion.copy( balls[ i ].quaternion );
	}

	// Update box positions
	for ( let i = 0; i < boxes.length; i++ ) {
		boxMeshes[ i ].position.copy( boxes[ i ].position );
		boxMeshes[ i ].quaternion.copy( boxes[ i ].quaternion );
	}
		}
		// controls.update(dt)
		controls.update();
		renderer.render(scene, camera)
		stats.update();
}
// document.querySelector( 'img' ).src = '../../sumber/cannon-es/examples/icons/code.svg';