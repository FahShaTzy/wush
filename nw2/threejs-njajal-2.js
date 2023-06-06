import * as THREE from '../../sumber/three.js/build/three.module.js';
import { OrbitControls } from '../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import Stats from '../../sumber/three.js/examples/jsm/libs/stats.module.js';

const vector3 = new THREE.Vector3( 0, 0, 1 );

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x012345 );

const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 300 );
camera.position.set( 0, 5, 10 );

if ( localStorage.getItem( 'cameraPositionX' ) ) {
    camera.position.set(
        localStorage.getItem( 'cameraPositionX' ),
        localStorage.getItem( 'cameraPositionY' ),
        localStorage.getItem( 'cameraPositionZ' )
    )
} else camera.position.set( 0, 10, 20 );

document.addEventListener( 'keydown', () => {
    localStorage.setItem( 'cameraPositionX', Math.round( camera.position.x ) );
    localStorage.setItem( 'cameraPositionY', Math.round( camera.position.y ) );
    localStorage.setItem( 'cameraPositionZ', Math.round( camera.position.z ) );
} );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.01;
controls.update();

const stats = new Stats();
document.body.appendChild( stats.domElement );

scene
.add( new THREE.AxesHelper( 100, 100, 100 ).setColors( 'red', 'green', 'blue' ) )
.add( new THREE.AxesHelper( - 100, - 100, - 100 ).setColors( 'red', 'green', 'blue' ) );

const light = new THREE.PointLight( 0xffffff );
light.position.set( - 10, 30, 30 );
light.castShadow = true;
light.shadow.mapSize.x = 256;
light.shadow.mapSize.y = 256;
scene.add( light );

//

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry( 100, 100 ),
    new THREE.MeshPhongMaterial( { side: THREE.DoubleSide } )
);
plane.rotation.x = - Math.PI / 2;
plane.receiveShadow = true;
scene.add( plane );

const shape = new THREE.Shape();
shape.moveTo( 0,0 );
shape.lineTo( 5, 0 );
shape.lineTo( 8, 6 );
shape.lineTo( 2.5, 10 );
shape.lineTo( -3, 6 );
shape.lineTo( 0, 0 );

const extrudeSettings = {
	steps: 2,
	depth: 16,
	bevelEnabled: true,
	bevelThickness: 1,
	bevelSize: 1,
	bevelOffset: 0,
	bevelSegments: 1
};

const geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
const material = new THREE.MeshPhongMaterial( { color: 0x00ff00 } );
const mesh = new THREE.Mesh( geometry, material ) ;
mesh.position.set( 0, 1, 0 );
mesh.castShadow = true;
mesh.receiveShadow = true;
scene.add( mesh );

//

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
    controls.update();
    stats.update();
}
animate();

window.addEventListener( 'resize', function () {
    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
} )