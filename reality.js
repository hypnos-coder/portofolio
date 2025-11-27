import * as THREE from 'three';

// === Configuration ===
const CONFIG = {
    entityCount: 300,
    fogColor: 0xd4d4d4, // Grey fog
    groundColor: 0x888888,
    entityColor: 0x333333,
    speed: 0.05,
    bounds: 80
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
}

// === Crowd Simulation ===
const entities = [];
const entityGeo = new THREE.CapsuleGeometry(0.3, 1, 4, 8);
const entityMat = new THREE.MeshStandardMaterial({ color: CONFIG.entityColor });

class Entity {
    constructor() {
        this.mesh = new THREE.Mesh(entityGeo, entityMat);
        this.mesh.castShadow = true;
        this.mesh.position.y = 0.8; // Half height + radius

        // Random start position
        this.mesh.position.x = (Math.random() - 0.5) * CONFIG.bounds * 2;
        this.mesh.position.z = (Math.random() - 0.5) * CONFIG.bounds * 2;

        // Random direction
        this.direction = new THREE.Vector3(
            Math.random() - 0.5,
            0,
            Math.random() - 0.5
        ).normalize();

        this.speed = CONFIG.speed * (0.8 + Math.random() * 0.4); // Vary speed slightly

        scene.add(this.mesh);
    }

    update() {
        // Move
        this.mesh.position.add(this.direction.clone().multiplyScalar(this.speed));

        // Rotate to face direction
        const target = this.mesh.position.clone().add(this.direction);
        this.mesh.lookAt(target);

        // Boundary check (wrap around)
        if (this.mesh.position.x > CONFIG.bounds) this.mesh.position.x = -CONFIG.bounds;
        if (this.mesh.position.x < -CONFIG.bounds) this.mesh.position.x = CONFIG.bounds;
        if (this.mesh.position.z > CONFIG.bounds) this.mesh.position.z = -CONFIG.bounds;
        if (this.mesh.position.z < -CONFIG.bounds) this.mesh.position.z = CONFIG.bounds;

        // Simple "senseless" random turn
        if (Math.random() < 0.01) {
            this.direction.x += (Math.random() - 0.5) * 0.5;
            this.direction.z += (Math.random() - 0.5) * 0.5;
            this.direction.normalize();
        }
    }
}

// Create Crowd
for (let i = 0; i < CONFIG.entityCount; i++) {
    entities.push(new Entity());
}

// === Animation Loop ===
function animate() {
    requestAnimationFrame(animate);

    // Update entities
    entities.forEach(entity => entity.update());

    // Slowly rotate camera around center
    const time = Date.now() * 0.0001;
    camera.position.x = Math.sin(time) * 40;
    camera.position.z = Math.cos(time) * 40;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
}

// === Init ===
document.getElementById('loading').style.display = 'none';
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
