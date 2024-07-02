import * as THREE from '../../../sumber/three.js/build/three.module.js';
import { OrbitControls } from '../../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import Stats from '../../../sumber/three.js/examples/jsm/libs/stats.module.js';

import { EffectComposer } from '../../../sumber/three.js/examples/jsm/postprocessing/EffectComposer.js';
import { SSRPass } from '../../../sumber/three.js/examples/jsm/postprocessing/SSRPass.js';
import { OutputPass } from '../../../sumber/three.js/examples/jsm/postprocessing/OutputPass.js';
import { ReflectorForSSRPass } from '../../../sumber/three.js/examples/jsm/objects/ReflectorForSSRPass.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x443333 );

const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 15 );
camera.position.set( 0, 0.3, 0.5 );

const stats = new Stats();
document.body.appendChild( stats.domElement );

//

// const light = new THREE.Group();
// scene.add( light );

// const pointLight = new THREE.PointLight( 'white', 100, 0, 2.8 );
// pointLight.position.set( 3, 3, 3 );
// pointLight.castShadow = true;
// light.add( pointLight );

// const ambientLight = new THREE.AmbientLight( 0xffffff, 0.3 );
// scene.add( ambientLight );

const hemisphereLight = new THREE.HemisphereLight( 0x8d7c7c, 0x494966, 3 );
scene.add( hemisphereLight );

const spotLight = new THREE.SpotLight();
spotLight.intensity = 8;
spotLight.angle = Math.PI / 16;
spotLight.penumbra = 0.5;
// spotLight.castShadow = true;
spotLight.position.set( - 1, 1, 1 );
scene.add( spotLight );

//

const selects = [];

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry( 3, 3 ),
    new THREE.MeshPhongMaterial( { color: 0xcbcbcb } )
);
plane.rotation.x = - Math.PI / 2;
plane.position.y = - 0.0001;
scene.add( plane );

const y = 0.4;
const cube = new THREE.Mesh(
    new THREE.BoxGeometry( 0.1, y, 0.1 ),
    new THREE.MeshPhongMaterial( { color: 0x0000ff } )
);
cube.position.y = y / 2;
cube.castShadow = true;
cube.receiveShadow = true;
scene.add( cube );
selects.push( cube );

//

// const reflector = new THREE.Mesh(
//     new THREE.PlaneGeometry( 50, 50, 50, 50 ),
//     new THREE.MeshLambertMaterial( { color: 0x00ff00, side: THREE.DoubleSide } )
// );
// reflector.position.y = - .5;
// reflector.rotation.x = - Math.PI / 2;
// reflector.receiveShadow = true;
// scene.add( reflector );

const groundReflector = new ReflectorForSSRPass( new THREE.PlaneGeometry( 1, 1 ), {
    // clipBias: 0.0003,
    clipBias: 1,
    textureWidth: window.innerWidth,
    textureHeight: window.innerHeight,
    color: 0x888888,
    useDepthTexture: true,
} );
groundReflector.material.depthWrite = false;
groundReflector.rotation.x = - Math.PI / 2;
groundReflector.visible = false;
scene.add( groundReflector );

const renderer = new THREE.WebGLRenderer( { antialias: false } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.update();

//

const composer = new EffectComposer( renderer );
const ssrPass = new SSRPass( {
    renderer,
    scene,
    camera,
    width: innerWidth,
    height: innerHeight,
    groundReflector: groundReflector,
    selects: selects
} );

// ssrPass.thickness = 0.018;
// ssrPass._infiniteThick = false;
// ssrPass.maxDistance = groundReflector.maxDistance;
// ssrPass._fresnel = groundReflector._fresnel = true;
// ssrPass._distanceAttenuation = groundReflector._distanceAttenuation = true;
// ssrPass.opacity = groundReflector.opacity = 1;

composer.addPass( ssrPass );
composer.addPass( new OutputPass() );

//

window.addEventListener( 'resize', () => {
    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    composer.setSize( window.innerWidth, window.innerHeight );
    groundReflector.getRenderTarget().setSize( window.innerWidth, window.innerHeight );
    groundReflector.resolution.set( window.innerWidth, window.innerHeight );
} );

function animate() {
    // renderer.render( scene, camera );
    composer.render();
    controls.update();
    stats.update();

    // light.rotation.y += 0.03;
}