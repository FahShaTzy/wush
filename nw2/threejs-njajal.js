import * as THREE from '../../sumber/three.js/build/three.module.js';
import { OrbitControls } from '../../sumber/three.js/examples/jsm/controls/OrbitControls.js';
import Stats from '../../sumber/three.js/examples/jsm/libs/stats.module.js';
import { Water } from '../../sumber/three.js/examples/jsm/objects/Water.js';
import { Sky } from '../../sumber/three.js/examples/jsm/objects/Sky.js';

document.getElementById( 'count' ).style.display = 'none';

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x87ceeb );

const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 500 );
camera.position.set( 0, 10, 20 );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
controls.listenToKeyEvents( window );
controls.target.set( 0, 0, 0 );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.01;
controls.update();

const stats = new Stats();
document.body.appendChild( stats.domElement );

//

const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
const water = new Water(
    waterGeometry, {
        textureWidth: 1024,
        textureHeight: 1024,
        waterNormals: new THREE.TextureLoader().load( '../../sumber/three.js/examples/textures/waternormals.jpg', function ( texture ) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        } ),
        sunDirection: new THREE.Vector3(),
        sunColor: new THREE.Color( 0xffffff ),
        waterColor: 0x001e0f,
        distortionScale: 37
    }
);
water.rotation.x = - Math.PI / 2;
scene.add( water );

//

const sun = new THREE.Vector3();

const sky = new Sky();
sky.scale.setScalar( 10000 );
scene.add( sky );

const skyUniforms = sky.material.uniforms;
skyUniforms[ 'turbidity' ].value = 10;
skyUniforms[ 'rayleigh' ].value = 2;
skyUniforms[ 'mieCoefficient' ].value = 0.005;
skyUniforms[ 'mieDirectionalG' ].value = 0.8;

const pmremGenerator = new THREE.PMREMGenerator( renderer );
let renderTarget;

function updateSun() {
    const phi = THREE.MathUtils.degToRad( 90 - 180 ); // parameters.elevation ( 2 )
    const theta = THREE.MathUtils.degToRad( 100 ); // parameters.azimuth ( 100 )
    sun.setFromSphericalCoords( 1, phi, theta );
    sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
    water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();
    if ( renderTarget !== undefined ) renderTarget.dispose();
    renderTarget = pmremGenerator.fromScene( sky );
    scene.environment = renderTarget.texture;
}

updateSun();

//

const cube = new THREE.Mesh(
    new THREE.BoxGeometry( 3, 3, 3 ),
    new THREE.MeshPhongMaterial( {
        color: 'green',
        transparent: true,
        opacity: 0.8
    } )
);
cube.position.set( 0, 1.5, 1 );
cube.castShadow = true;
cube.receiveShadow = true;
scene.add( cube );

//

function animate() {
    requestAnimationFrame( animate );

    renderer.render( scene, camera );
    stats.update();
    controls.update();

    water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
}
animate();

window.addEventListener( 'resize', function () {

    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

} )

/*
    __     __
 __/ __\  / __\__   ____   _____   _____
/ __/  /\/ /  /___\/ ____\/ _____\/ _____\
\/_   __/ /   _   / /  __/ / __  / / __  /_   __   _____
/ /  / / /  / /  / /  / / /  ___/ /  ___/\ _\/ __\/ _____\
\/__/  \/__/\/__/\/__/  \/_____/\/_____/\/__/ /  / /  ___/
                                         / __/  /  \__  \
                                         \/____/\/_____/
*/