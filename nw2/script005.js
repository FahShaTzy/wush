import * as THREE from '../../sumber/three.js/build/three.module.js';
import Stats from '../../sumber/three.js/examples/jsm/libs/stats.module.js';
import { OrbitControls } from '../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import { TGALoader } from '../../sumber/three.js/examples/jsm/loaders/TGALoader.js';

let camera, scene, renderer, stats, controls;
let object = {};

init();
animate();

function init() {

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.set( 0, 50, 250 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 'darkBlue' );

    const loader = new TGALoader();
    const geometry = new THREE.BoxGeometry( 50, 50, 50 );

    //

    object.texture1 = loader.load( '../../sumber/loader/dinding/wall-1-square.tga' );
    object.texture1.colorSpace = THREE.SRGBColorSpace;
    object.material1 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: object.texture1 } );

    const mesh1 = new THREE.Mesh( geometry, object.material1 );
    mesh1.position.x = - 50;

    scene.add( mesh1 );

    //

    object.texture2 = loader.load( '../../sumber/loader/dinding/brick_sml_grn1b.tga' );
    object.texture2.colorSpace = THREE.SRGBColorSpace;
    object.material2 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: object.texture2 } );

    const mesh2 = new THREE.Mesh( geometry, object.material2 );
    mesh2.position.x = 50;

    scene.add( mesh2 );

    //

    object.texture3 = loader.load( '../../sumber/loader/dinding/brick2-2.tga' );
    object.texture3.colorSpace = THREE.SRGBColorSpace;
    object.material3 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: object.texture3 } );

    const mesh3 = new THREE.Mesh( geometry, object.material3 );
    mesh3.position.set( - 50, 0, 100 );

    scene.add( mesh3 );

    //

    object.texture4 = loader.load( '../../sumber/loader/dinding/brick3.tga' );
    object.texture4.colorSpace = THREE.SRGBColorSpace;
    object.material4 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: object.texture4 } );

    const mesh4 = new THREE.Mesh( geometry, object.material4 );
    mesh4.position.set( 50, 0, 100 );

    scene.add( mesh4 );

    //

    object.texture5 = loader.load( '../../sumber/loader/dinding/brick3b.tga' );
    object.texture5.colorSpace = THREE.SRGBColorSpace;
    object.material5 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: object.texture5 } );

    const mesh5 = new THREE.Mesh( geometry, object.material5 );
    mesh5.position.set( 50, 0, -100 );

    scene.add( mesh5 );

    //

    object.texture6 = loader.load( '../../sumber/loader/dinding/brick5b3a.tga' );
    object.texture6.colorSpace = THREE.SRGBColorSpace;
    object.material6 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: object.texture6 } );

    const mesh6 = new THREE.Mesh( geometry, object.material6 );
    mesh6.position.set( - 50, 0, -100 );

    scene.add( mesh6 );

    //

    const ambientLight = new THREE.AmbientLight( 0xffffff, 0.4 );
    scene.add( ambientLight );

    const light = new THREE.DirectionalLight( 0xffffff, 1 );
    light.position.set( 1, 1, 1 );
    scene.add( light );

    //

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.05
    controls.target.set( 0, 0, 0 );
    controls.maxDistance = 500;
    controls.minDistance = 10;
    controls.update();

    stats = new Stats();
    document.body.appendChild( stats.domElement );

    window.addEventListener( 'resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    } );

}

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
    stats.update();
    controls.update();
}