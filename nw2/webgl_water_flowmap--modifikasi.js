import * as THREE from '../../sumber/three.js/build/three.module.js';
import { OrbitControls } from '../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import { Water } from '../../sumber/khusus/Water2.js';
import { GUI } from '../../sumber/three.js/examples/jsm/libs/lil-gui.module.min.js';
import Stats from '../../sumber/three.js/examples/jsm/libs/stats.module.js';

let scene, camera, renderer, controls, stats, water;

scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 200 );
camera.position.set( 0, 25, 0 );
camera.lookAt( scene.position );

const groundMaterial = new THREE.MeshBasicMaterial( { color: 0xe7e7e7 } );
const ground = new THREE.Mesh( new THREE.PlaneGeometry( 20, 20, 10, 10 ), groundMaterial );
ground.rotation.x = Math.PI * - 0.5;
scene.add( ground );

// ground

const textureLoader = new THREE.TextureLoader();
textureLoader.load( '../../sumber/three.js/examples/textures/floors/FloorsCheckerboard_S_Diffuse.jpg', function ( map ) {

    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 16;
    map.repeat.set( 4, 4 );
    map.colorSpace = THREE.SRGBColorSpace;
    groundMaterial.map = map;
    groundMaterial.needsUpdate = true;

} );

// water

const waterGeometry = new THREE.PlaneGeometry( 20, 20 );
const flowMap = textureLoader.load( '../../sumber/three.js/examples/textures/water/Water_1_M_Flow.jpg' );

water = new Water( waterGeometry, {
    scale: 2,
    textureWidth: 1024,
    textureHeight: 1024,
    flowMap: flowMap
} );

water.position.y = 1;
water.rotation.x = Math.PI * - 0.5;
scene.add( water );

// flow map helper

const helper = new THREE.Mesh(
    new THREE.PlaneGeometry( 20, 20 ),
    new THREE.MeshBasicMaterial( { map: flowMap } )
);
helper.position.y = 1.01;
helper.rotation.x = - Math.PI * 0.5;
helper.visible = false;
scene.add( helper );

//

renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
document.body.appendChild( renderer.domElement );

//

controls = new OrbitControls( camera, renderer.domElement );
controls.minDistance = 0.1;
controls.maxDistance = 500;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.5 - 0.1;
controls.update();

//

stats = new Stats();
document.body.appendChild( stats.domElement );

//

const gui = new GUI();
gui.add( helper, 'visible' ).name( 'Show Flow Map' );
gui.open();

//

window.addEventListener( 'resize', function () {

    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

} );

function animate() {

    requestAnimationFrame( animate );

    renderer.render( scene, camera );
    controls.update();
    stats.update();

}
animate();