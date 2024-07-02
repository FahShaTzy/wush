import * as THREE from '../../../sumber/three.js/build/three.module.js';
import { OrbitControls } from '../../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import Stats from '../../../sumber/three.js/examples/jsm/libs/stats.module.js';

import { EffectComposer } from '../../../sumber/three.js/examples/jsm/postprocessing/EffectComposer.js';
import { SSRPass } from '../../../sumber/three.js/examples/jsm/postprocessing/SSRPass.js';
import { OutputPass } from '../../../sumber/three.js/examples/jsm/postprocessing/OutputPass.js';
import { ReflectorForSSRPass } from '../../../sumber/three.js/examples/jsm/objects/ReflectorForSSRPass.js';

//

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x443333 );

const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 15 );
camera.position.set( 0.8, 0.8, 0.8 );

const stats = new Stats();
document.body.appendChild( stats.domElement );

//

const light = new THREE.Group();
scene.add( light );

const x = 1.3, z = 1.3;

const spotLight = new THREE.SpotLight( 0xffffff, 8, 0, Math.PI / 8, 0.5);
spotLight.castShadow = true;
spotLight.position.set( - x, 1, z );
light.add( spotLight );

// const spotLight1 = new THREE.SpotLight( 0xff0000, 8, 0, Math.PI / 8, 0.5);
// spotLight1.castShadow = true;
// spotLight1.position.set( - x, 1, z );
// light.add( spotLight1 );

// const spotLight2 = new THREE.SpotLight( 0xffff00, 8, 0, Math.PI / 8, 0.5 );
// spotLight2.castShadow = true;
// spotLight2.position.set( x, 1, z );
// light.add( spotLight2 );

// const spotLight3 = new THREE.SpotLight( 0x00ff00, 8, 0, Math.PI / 8, 0.5);
// spotLight3.castShadow = true;
// spotLight3.position.set( x, 1, - z );
// light.add( spotLight3 );

// const spotLight4 = new THREE.SpotLight( 0x0000ff, 8, 0, Math.PI / 8, 0.5 );
// spotLight4.castShadow = true;
// spotLight4.position.set( - x, 1, - z );
// light.add( spotLight4 );

//

const selects = [];

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry( 3, 3 ),
    new THREE.MeshPhongMaterial( { color: 0xcbcbcb } )
);
plane.rotation.x = - Math.PI / 2;
plane.position.y = - 0.0001;
plane.receiveShadow = true;
scene.add( plane );

const y = 0.4;
const cube = new THREE.Mesh(
    new THREE.BoxGeometry( 0.1, y, 0.1 ),
    new THREE.MeshPhongMaterial( { color: 0x0000ff } )
);
cube.position.y = y / 2;
cube.castShadow = true;
scene.add( cube );
selects.push( cube );

//

const groundReflector = new ReflectorForSSRPass( new THREE.PlaneGeometry( 1, 1 ), {
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
// renderer.setPixelRatio( window.devicePixelRatio );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.update();

const composer = new EffectComposer( renderer );
const ssrPass = new SSRPass( {
    renderer,
    scene,
    camera,
    width: innerWidth,
    height: innerHeight,
    groundReflector: groundReflector,
    selects: selects,
} );
ssrPass.maxDistance = groundReflector.maxDistance = .3;
ssrPass.opacity = groundReflector.opacity = 1;

composer.addPass( ssrPass );
composer.addPass( new OutputPass() );

//

window.onresize = () => {
    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

function animate() {
    // renderer.render( scene, camera );
    composer.render();
    controls.update();
    stats.update();

    light.rotation.y += 0.01;
}