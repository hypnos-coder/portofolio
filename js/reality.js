import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';

// === Configuration ===
const CONFIG = {
    entityCount: 50,
    fogColor: 0xd4d4d4, // Grey fog
    groundColor: 0x888888,
    speed: 1.4, // World units per second
    bounds: 40
};

// === Scene Setup ===
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.fogColor);
scene.fog = new THREE.FogExp2(CONFIG.fogColor, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 30);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// === Lighting ===
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// === Environment ===
// Ground
const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.MeshStandardMaterial({ color: CONFIG.groundColor, roughness: 0.8 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Buildings (Simple blocks)
const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
const buildingMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
const obstacles = [];

for (let i = 0; i < 50; i++) {
    const height = Math.random() * 20 + 5;
    const width = Math.random() * 5 + 2;
    const depth = Math.random() * 5 + 2;

    const building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.set(
        (Math.random() - 0.5) * 150,
        height / 2,
        (Math.random() - 0.5) * 150
    );
    building.scale.set(width, height, depth);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    obstacles.push(new THREE.Box3().setFromObject(building).expandByScalar(0.6));
}

// === Crowd Simulation ===
const entities = [];
const modelDirectory = new URL('../assets/kenney_blocky-characters_20/Models/GLB format/', import.meta.url);
// Ordinary people, including the suited character; omit robots and monsters.
const characterNames = ['a', 'b', 'c', 'e', 'f', 'i', 'j', 'k', 'l', 'p', 'q'];
const isBlocked = (x, z) => obstacles.some(box =>
    x >= box.min.x && x <= box.max.x && z >= box.min.z && z <= box.max.z);

function randomPosition() {
    for (let attempt = 0; attempt < 1000; attempt++) {
        const x = THREE.MathUtils.randFloatSpread(CONFIG.bounds * 2);
        const z = THREE.MathUtils.randFloatSpread(CONFIG.bounds * 2);
        if (!isBlocked(x, z)) return new THREE.Vector3(x, 0, z);
    }
    throw new Error('Could not find a clear spawn position.');
}

class Entity {
    constructor(template) {
        // These models animate rigid parts, so a regular deep clone is sufficient.
        const model = template.scene.clone(true);
        this.mesh = new THREE.Group();
        this.mesh.add(model);
        const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
        model.scale.multiplyScalar(THREE.MathUtils.randFloat(1.7, 2.0) / size.y);
        model.position.y -= new THREE.Box3().setFromObject(model).min.y;
        model.traverse(object => {
            if (object.isMesh) object.castShadow = true;
        });
        this.mesh.position.copy(randomPosition());
        this.heading = Math.random() * Math.PI * 2;
        this.targetHeading = this.heading;
        this.turnIn = Math.random() * 3;
        this.speed = CONFIG.speed * THREE.MathUtils.randFloat(0.8, 1.2);
        this.mesh.rotation.y = this.heading;
        this.mixer = new THREE.AnimationMixer(model);
        const clip = THREE.AnimationClip.findByName(template.animations, 'walk');
        const action = this.mixer.clipAction(clip);
        action.time = Math.random() * clip.duration;
        action.timeScale = this.speed / CONFIG.speed;
        action.play();
        scene.add(this.mesh);
    }

    update(delta) {
        this.turnIn -= delta;
        if (this.turnIn <= 0) {
            this.targetHeading += THREE.MathUtils.randFloat(-1.2, 1.2);
            this.turnIn = THREE.MathUtils.randFloat(1, 4);
        }
        const difference = Math.atan2(Math.sin(this.targetHeading - this.heading),
            Math.cos(this.targetHeading - this.heading));
        this.heading += difference * Math.min(1, delta * 3);
        const x = this.mesh.position.x + Math.sin(this.heading) * this.speed * delta;
        const z = this.mesh.position.z + Math.cos(this.heading) * this.speed * delta;
        const blocked = Math.abs(x) > CONFIG.bounds || Math.abs(z) > CONFIG.bounds || isBlocked(x, z);
        if (blocked) {
            this.targetHeading = this.heading + Math.PI / 2;
            this.turnIn = 1;
        } else {
            this.mesh.position.set(x, 0, z);
        }
        this.mesh.rotation.y = this.heading;
        this.mixer.update(blocked ? 0 : delta);
    }
}

async function loadCrowd() {
    const loading = document.getElementById('loading');
    const loader = new GLTFLoader();
    let loaded = 0;
    try {
        const templates = await Promise.all(characterNames.map(async name => {
            const model = await loader.loadAsync(new URL(`character-${name}.glb`, modelDirectory).href);
            if (!THREE.AnimationClip.findByName(model.animations, 'walk')) {
                throw new Error(`Character ${name} has no walking animation.`);
            }
            loading.textContent = `Loading people... ${++loaded}/${characterNames.length}`;
            return model;
        }));
        for (let i = 0; i < CONFIG.entityCount; i++) {
            entities.push(new Entity(templates[i % templates.length]));
        }
        loading.style.display = 'none';
    } catch (error) {
        console.error('Unable to load crowd:', error);
        loading.textContent = 'Unable to load people. Please reload to try again.';
    }
}

// === Animation Loop ===
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);

    // Update entities
    entities.forEach(entity => entity.update(delta));

    // Slowly rotate camera around center
    const time = Date.now() * 0.0001;
    camera.position.x = Math.sin(time) * 40;
    camera.position.z = Math.cos(time) * 40;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

// === Init ===
loadCrowd();
animate();

// === Resize Handler ===
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// === Wake Up Logic ===
document.getElementById('logout-btn').addEventListener('click', () => {
    window.location.href = 'index.html';
});
