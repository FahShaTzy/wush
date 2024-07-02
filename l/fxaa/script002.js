import * as THREE from '../../../sumber/three.js/build/three.module.js';
import Stats from '../../../sumber/three.js/examples/jsm/libs/stats.module.js';

import { EffectComposer } from '../../../sumber/three.js/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../../../sumber/three.js/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from '../../../sumber/three.js/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from '../../../sumber/three.js/examples/jsm/postprocessing/OutputPass.js';
import { FXAAShader } from '../../../sumber/three.js/examples/jsm/shaders/FXAAShader.js';

//

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xffffff );

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
camera.position.z = 500;

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setAnimationLoop( animate );
renderer.autoClear = false;
document.body.appendChild( renderer.domElement );

const stats = new Stats();
document.body.appendChild( stats.domElement );

const clock = new THREE.Clock();

//

const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d );
hemiLight.position.set( 0, 1000, 0 );
scene.add( hemiLight );

const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
dirLight.position.set( - 3000, 1000, - 1000 );
scene.add( dirLight );

//

const group = new THREE.Group();

const geometry = new THREE.TetrahedronGeometry( 10 );
const material = new THREE.MeshStandardMaterial( { color: 0xf73232, flatShading: false } );

for ( let i = 0; i < 100; i ++ ) {

    const mesh = new THREE.Mesh( geometry, material );

    mesh.position.x = Math.random() * 500 - 250;
    mesh.position.y = Math.random() * 500 - 250;
    mesh.position.z = Math.random() * 500 - 250;

    mesh.scale.setScalar( Math.random() * 2 + 1 );

    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;
    mesh.rotation.z = Math.random() * Math.PI;

    group.add( mesh );

}

scene.add( group );

const cube = new THREE.Mesh(
    new THREE.BoxGeometry( 20, 20, 20 ),
    new THREE.MeshStandardMaterial( { color: 0xf73232, flatShading: true } )
);
cube.position.z = 300;
scene.add( cube );

//

const renderPass = new RenderPass( scene, camera );
renderPass.clearAlpha = 0;

//

const fxaaPass = new ShaderPass( FXAAShader );

const outputPass = new OutputPass();

const composer1 = new EffectComposer( renderer );
composer1.addPass( renderPass );
composer1.addPass( outputPass );

//

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

    stats.update();

    const delta = clock.getDelta();

    group.rotation.y += delta * 0.1;
    cube.rotation.x += delta * 0.5;
    cube.rotation.y += delta * 0.5;
    
    const halfWidth = window.innerWidth / 2;

    renderer.setScissorTest( true );

    renderer.setScissor( 0, 0, halfWidth - 1, window.innerHeight );
    composer1.render();

    renderer.setScissor( halfWidth, 0, halfWidth, window.innerHeight );
    composer2.render();

    renderer.setScissorTest( false );

}