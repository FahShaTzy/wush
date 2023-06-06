import * as THREE from '../../sumber/three.js/build/three.module.js';
import { OrbitControls } from '../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import Stats from '../../sumber/three.js/examples/jsm/libs/stats.module.js';
import * as CANNON from '../../sumber/cannon-es/dist/cannon-es.js';

let container, stats, camera, controls, scene, renderer, group;
let objek = {};
let i = 0;

renderGrafik();
bangun();
render();

for ( let key of Object.keys( objek ) ) {
    scene.add( key, objek[ key ] );
    console.log( key, objek[ key ]);
}

function renderGrafik() {

    container = document.getElementById( 'canvas' );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 2000 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x123456 );

    camera.position.set( 0, 10, 50 );

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild( renderer.domElement );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.target.set( 0, 0, 0 );
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.update();

    // const ambientLight = new THREE.AmbientLight( 0x707070 );
    // scene.add( ambientLight );

    group = new THREE.Group();

    // const light = new THREE.DirectionalLight( 0xffffff, 1 );
    // light.position.set( 10, 20, 10 );
    // light.castShadow = true;
    // light.shadow.camera.left = -23;
    // light.shadow.camera.right = 23;
    // light.shadow.camera.top = 23;
    // light.shadow.camera.bottom = -23;
    // light.shadow.camera.near = 2;
    // light.shadow.camera.far = 50;
    // const lightHelper = new THREE.DirectionalLightHelper( light );
    // group.add( light ).add( lightHelper );
    
    const light = new THREE.PointLight( 'white' );
    const lightHelper = new THREE.PointLightHelper( light );
    light.position.set( 10, 20, 10 );
    light.castShadow = true;
    light.shadow.mapSize.x = 2048; // jangan lebih dari 8192, nanti ngelag
    light.shadow.mapSize.y = 2048; // jangan lebih dari 8192, nanti ngelag
    
    group.add( light );

    scene.add( group );

    stats = new Stats();
    container.appendChild( stats.domElement );

    scene
    .add( new THREE.AxesHelper( 100, 100, 100 ).setColors( 'red', 'green', 'blue' ) )
    .add( new THREE.AxesHelper( -100, -100, -100 ).setColors( 'red', 'green', 'blue' ) );

    window.addEventListener( 'resize', function () {

        renderer.setSize( window.innerWidth, window.innerHeight );
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

    } );

}

function bangun() {

    objek.dunia = new CANNON.World( {
        gravity: new CANNON.Vec3( 0, -9.82, 0 )
    } );

    objek.tanahThree = new THREE.Mesh(
        new THREE.PlaneGeometry( 100, 100, 100, 100 ),
        new THREE.MeshPhongMaterial( { color: 'green', side: THREE.DoubleSide } )
    );
    objek.tanahThree.receiveShadow = true;
    objek.tanahThree.rotation.x = Math.PI * -0.5;
    // scene.add( objek.tanahThree );
    objek.tanahCannon = new CANNON.Body({
        // type: CANNON.Body.STATIC,
        mass: 0,
        shape: new CANNON.Plane(),
    });
    objek.tanahCannon.quaternion.setFromEuler( Math.PI * -0.5, 0, 0 );
    objek.dunia.addBody( objek.tanahCannon );

    objek.bolaThree = new THREE.Mesh(
        new THREE.SphereGeometry( 1 ),
        new THREE.MeshPhongMaterial( { color: 'darkBlue' } )
    );
    objek.bolaThree.castShadow = true; 
    objek.bolaThree.receiveShadow = true; 
    // scene.add( objek.bolaThree );
    objek.bolaCannon = new CANNON.Body( {
        mass: 5,
        shape: new CANNON.Sphere( 1 )
    } );
    objek.bolaCannon.position.set( 0, 10, 0 );
    objek.dunia.addBody( objek.bolaCannon );

}

function render() {

    requestAnimationFrame( render );

    renderer.render( scene, camera );
    controls.update();
    stats.update();

    group.rotation.y += 0.01;

    objek.bolaThree.position.copy( objek.bolaCannon.position );
    objek.bolaThree.quaternion.copy( objek.bolaCannon.quaternion );

    objek.dunia.fixedStep();

}