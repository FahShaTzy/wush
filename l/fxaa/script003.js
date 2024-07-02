import * as THREE from '../../../sumber/three.js/build/three.module.js';
import { OrbitControls } from '../../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import Stats from '../../../sumber/three.js/examples/jsm/libs/stats.module.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
camera.position.set( 0, 5, 5 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.autoClear = false;
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
controls.target.set( 0, 0, 0 );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();

const stats = new Stats();
document.body.appendChild( stats.domElement );

//

const spotLight = new THREE.SpotLight( 0xffffff, 30, 0, Math.PI / 8, 0.5 );
spotLight.position.set( 5, 5, 5 );
spotLight.castShadow = true;
scene.add( spotLight );

//

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry( 10, 10 ),
    new THREE.MeshPhongMaterial( { color: 0x00ff00, side: THREE.DoubleSide } )
);
plane.rotation.x = - Math.PI / 2;
plane.receiveShadow = true;
scene.add( plane );

const cube = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshPhongMaterial( { color: 0xff0000, flatShading: true } )
)
cube.position.set( 0, 0.5, 0 );
cube.castShadow = true;
scene.add( cube );

//

const renderPass = new RenderPass( scene, camera );
renderPass.clearAlpha = 0;

const fxaaPass = new ShaderPass( FXAAShader );

const outputPass = new OutputPass();

const composer1 = new EffectComposer( renderer );
composer1.addPass( renderPass );
composer1.addPass( outputPass );

const pixelRatio = renderer.getPixelRatio();

fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth * pixelRatio );
fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * pixelRatio );

const composer2 = new EffectComposer( renderer );
composer2.addPass( renderPass );
composer2.addPass( outputPass );
composer2.addPass( fxaaPass );

//

window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

    composer1.setSize( window.innerWidth, window.innerHeight );
    composer2.setSize( window.innerWidth, window.innerHeight );

    const pixelRatio = renderer.getPixelRatio();

    fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth * pixelRatio );
    fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * pixelRatio );
}

function animate() {
    renderer.render( scene, camera );
    controls.update();
    stats.update();

    renderer.setScissorTest( true );

    renderer.setScissor( 0, 0, window.innerWidth - 1, window.innerHeight );
    composer1.render();

    renderer.setScissor( window.innerWidth, 0, window.innerWidth, window.innerHeight );
    composer2.render()

    renderer.setScissorTest( false );
}