import * as THREE from '../../../sumber/three.js/build/three.module.js';
import { OrbitControls } from '../../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import Stats from '../../../sumber/three.js/examples/jsm/libs/stats.module.js';

import { EffectComposer } from '../../../sumber/three.js/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../../../sumber/three.js/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from '../../../sumber/three.js/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from '../../../sumber/three.js/examples/jsm/postprocessing/OutputPass.js';
import { FXAAShader } from '../../../sumber/three.js/examples/jsm/shaders/FXAAShader.js';

//

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
camera.position.set( 0, 2, 2 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setAnimationLoop( animate );
renderer.autoClear = false;
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.update();

const stats = new Stats();
document.body.appendChild( stats.domElement );

//

const cube = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshNormalMaterial()
);
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

composer1.addPass( fxaaPass );

//

window.onresize = () => {
    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    composer1.setSize( container.offsetWidth, container.offsetHeight );
    composer2.setSize( container.offsetWidth, container.offsetHeight );

    const pixelRatio = renderer.getPixelRatio();

    fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( container.offsetWidth * pixelRatio );
    fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( container.offsetHeight * pixelRatio );
}

let a = true;
function animate() {

    controls.update();
    stats.update();

    if (a) {

    renderer.setScissorTest( true );

    renderer.setScissor( 0, 0, window.innerWidth - 1, window.innerHeight );
    composer1.render();

    renderer.setScissor( 0, 0, window.innerWidth, window.innerHeight );
    composer2.render();

    renderer.setScissorTest( false );
    } else renderer.render( scene, camera );

}