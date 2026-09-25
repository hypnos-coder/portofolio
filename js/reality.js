import * as THREE from './three.module.js';
import { createCity } from './environment/city.js';
import { setupLighting } from './environment/lighting.js';
import { createCrowd } from './people/crowd.js';
import { createCameraControls } from './environment/camera.js';
import { setupAmbientAudio } from './environment/audio.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 250);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);
setupLighting(scene, renderer);
const environment = createCity(scene);
const controls = createCameraControls(camera, renderer.domElement, environment);
setupAmbientAudio(document.getElementById('sound-toggle'));
const glitchButton = document.getElementById('glitch-toggle');
let glitchesEnabled = !matchMedia('(prefers-reduced-motion: reduce)').matches;
function updateGlitchButton() {
    glitchButton.textContent = glitchesEnabled ? 'GLITCHES ON' : 'GLITCHES OFF';
    glitchButton.setAttribute('aria-pressed', String(glitchesEnabled));
}
updateGlitchButton();
glitchButton.addEventListener('click', () => {
    glitchesEnabled = !glitchesEnabled;
    crowd?.setGlitches?.(glitchesEnabled);
    updateGlitchButton();
});
let crowd;
createCrowd(scene, environment, { entityCount: 50, speed: 1.4 }, document.getElementById('loading'))
    .then(result => { crowd = result; crowd.setGlitches?.(glitchesEnabled); });

const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    crowd?.update(delta);
    controls.update(delta);
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
document.getElementById('logout-btn').addEventListener('click', () => {
    window.location.href = 'index.html';
});
