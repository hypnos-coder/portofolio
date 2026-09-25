import * as THREE from '../three.module.js';

// Shared geometry and instanced details keep the city inexpensive to render.
export function createCity(scene) {
    const group = new THREE.Group();
    group.name = 'Procedural city';
    scene.add(group);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = {
        asphalt: { color: 0x333e3d, roughness: 1 },
        paving: { color: 0x9da99f, roughness: 0.95 },
        seam: { color: 0x818e85, roughness: 1 },
        stone: { color: 0x798980, roughness: 0.9 },
        concrete: { color: 0xb5bbb0, roughness: 0.85 },
        dark: { color: 0x455b54, roughness: 0.75 },
        glass: { color: 0x284b49, metalness: 0.45, roughness: 0.25 },
        lit: { color: 0xa3c3ad, emissive: 0x4c725a, emissiveIntensity: 0.25 },
        metal: { color: 0x263c35, metalness: 0.6, roughness: 0.4 },
        wood: { color: 0x6a6950, roughness: 0.95 },
        leaf: { color: 0x425e48, roughness: 1 },
        stripe: { color: 0xc6c9aa, roughness: 1 },
        lamp: { color: 0xe2efcb, emissive: 0xc1db9e, emissiveIntensity: 0.8 }
    };
    const batches = new Map();
    const obstacles = [];
    function box(material, x, y, z, w, h, d) {
        if (!batches.has(material)) batches.set(material, []);
        batches.get(material).push([x, y, z, w, h, d]);
    }
    function obstacle(x, z, w, d) {
        obstacles.push({ minX: x - w / 2 - 0.45, maxX: x + w / 2 + 0.45,
            minZ: z - d / 2 - 0.45, maxZ: z + d / 2 + 0.45 });
    }

    box('asphalt', 0, -0.18, 0, 180, 0.3, 180);
    // Nine blocks with a civic square in the middle, separated by two avenues.
    for (const x of [-30, 0, 30]) for (const z of [-30, 0, 30]) {
        box('concrete', x, 0.06, z, 23, 0.18, 23);
        box('paving', x, 0.16, z, 22.6, 0.04, 22.6);
        for (let offset = -10; offset <= 10; offset += 2) {
            box('seam', x + offset, 0.183, z, 0.025, 0.006, 22.5);
            box('seam', x, 0.183, z + offset, 22.5, 0.006, 0.025);
        }
        if (x === 0 && z === 0) continue;
        const height = 12 + ((x / 30 + 1) * 7 + (z / 30 + 1) * 11) % 15;
        const facade = (x + z) % 60 === 0 ? 'concrete' : 'stone';
        const width = 16, depth = 16;
        obstacle(x, z, width + 0.6, depth + 0.6);
        box(facade, x, height / 2 + 0.18, z, width, height, depth);
        box('dark', x, 1.7, z, 16.2, 3, 16.2);
        // Ground-floor glazing, recessed doors, and projecting entrance canopies.
        for (const side of [-1, 1]) {
            for (const offset of [-6, -3, 3, 6]) {
                box('glass', x + offset, 1.65, z + side * 8.12, 2.2, 2.3, 0.04);
                box('glass', x + side * 8.12, 1.65, z + offset, 0.04, 2.3, 2.2);
            }
            box('glass', x, 1.55, z + side * 8.14, 1.8, 2.6, 0.05);
            box('metal', x, 1.55, z + side * 8.18, 0.07, 2.6, 0.06);
            box('metal', x, 3.08, z + side * 8.5, 3.4, 0.15, 1.4);
        }
        for (let floor = 4.4; floor < height - 0.8; floor += 2.8) {
            box('concrete', x, floor - 1.13, z, 16.35, 0.16, 16.35);
            for (let col = -6; col <= 6; col += 2.4) {
                for (const side of [-1, 1]) {
                    const pane = Math.sin(col * 17 + floor * 31 + x + z) > 0.5 ? 'lit' : 'glass';
                    box(pane, x + col, floor, z + side * 8.025, 1.45, 1.8, 0.06);
                    box(pane, x + side * 8.025, floor, z + col, 0.06, 1.8, 1.45);
                }
            }
        }
        // Roof parapets and mechanical housings break up the silhouettes.
        for (const side of [-1, 1]) {
            box('concrete', x + side * 8, height + 0.45, z, 0.3, 0.7, 16.3);
            box('concrete', x, height + 0.45, z + side * 8, 16.3, 0.7, 0.3);
        }
        box('dark', x - 2, height + 0.8, z, 4, 1.4, 3);
        box('metal', x + 3, height + 0.5, z + 2, 2.4, 0.8, 2.4);
    }

    // Dashed road lines and zebra crossings connect all nine sidewalks.
    for (const road of [-15, 15]) {
        for (let p = -44; p <= 44; p += 4) {
            if (Math.abs(Math.abs(p) - 15) < 5 || Math.abs(p % 30) < 3) continue;
            box('stripe', road, -0.018, p, 0.1, 0.02, 1.8);
            box('stripe', p, -0.018, road, 1.8, 0.02, 0.1);
        }
        for (const crossing of [-30, 0, 30]) for (let offset = -2.8; offset <= 2.8; offset += 0.8) {
            box('stripe', road + offset, -0.018, crossing, 0.42, 0.02, 2.8);
            box('stripe', crossing, -0.018, road + offset, 2.8, 0.02, 0.42);
        }
    }

    // Plaza planters, geometric trees, and benches leave the centre open.
    const foliage = new THREE.IcosahedronGeometry(1, 1);
    const leafMaterial = new THREE.MeshStandardMaterial(materials.leaf);
    for (const x of [-7, 7]) for (const z of [-7, 7]) {
        box('concrete', x, 0.5, z, 3.2, 0.64, 3.2);
        box('dark', x, 0.84, z, 2.9, 0.06, 2.9);
        box('wood', x, 2, z, 0.28, 2.4, 0.28);
        const crown = new THREE.Mesh(foliage, leafMaterial);
        crown.position.set(x, 4.1, z);
        crown.scale.set(1.6, 2, 1.6);
        crown.castShadow = true;
        group.add(crown);
        obstacle(x, z, 3.2, 3.2);
        const benchZ = z + (z > 0 ? -2.5 : 2.5);
        for (const dx of [-0.85, 0.85]) box('metal', x + dx, 0.44, benchZ, 0.12, 0.52, 0.6);
        for (const dz of [-0.22, 0, 0.22]) box('wood', x, 0.73, benchZ + dz, 2.4, 0.12, 0.17);
        box('wood', x, 1.08, benchZ + Math.sign(z) * 0.3, 2.4, 0.42, 0.1);
        obstacle(x, benchZ, 2.4, 0.75);
    }
    for (const x of [-10, 10]) for (const z of [-30, -10, 10, 30]) {
        box('metal', x, 2.5, z, 0.12, 4.7, 0.12);
        box('metal', x, 4.8, z, 0.8, 0.13, 0.8);
        box('lamp', x, 4.7, z, 0.65, 0.07, 0.65);
        obstacle(x, z, 0.2, 0.2);
    }
    // A distant skyline fills the horizon without crowding the playable blocks.
    for (let i = -3; i <= 3; i++) for (const side of [-1, 1]) {
        const h = 17 + (i + 3) * 3;
        box('stone', i * 20, h / 2, side * 66, 13, h, 14);
        box('dark', side * 66, h / 2, i * 20, 14, h, 13);
    }
    const matrix = new THREE.Matrix4();
    for (const [name, transforms] of batches) {
        const mesh = new THREE.InstancedMesh(geometry,
            new THREE.MeshStandardMaterial(materials[name]), transforms.length);
        mesh.name = name;
        transforms.forEach(([x, y, z, w, h, d], index) => {
            matrix.makeScale(w, h, d).setPosition(x, y, z);
            mesh.setMatrixAt(index, matrix);
        });
        mesh.receiveShadow = true;
        mesh.castShadow = !['asphalt', 'paving', 'seam', 'stripe', 'glass', 'lit'].includes(name);
        group.add(mesh);
    }
    function onRoad(value) { return Math.abs(Math.abs(value) - 15) < 3.5; }
    function atCrossing(value) { return [-30, 0, 30].some(center => Math.abs(value - center) < 1.15); }
    const heightAt = (x, z) => onRoad(x) || onRoad(z) ? -0.02 : 0.18;
    function isWalkable(x, z) {
        if (Math.abs(x) > 41 || Math.abs(z) > 41) return false;
        if (onRoad(x) && !atCrossing(z) || onRoad(z) && !atCrossing(x)) return false;
        return !obstacles.some(o => x >= o.minX && x <= o.maxX && z >= o.minZ && z <= o.maxZ);
    }
    function randomPosition() {
        for (let attempt = 0; attempt < 2000; attempt++) {
            // Most pedestrians start in the plaza, with others on surrounding sidewalks.
            const radius = Math.random() < 0.7 ? 11 : 41;
            const x = THREE.MathUtils.randFloatSpread(radius * 2);
            const z = THREE.MathUtils.randFloatSpread(radius * 2);
            if (isWalkable(x, z)) return new THREE.Vector3(x, heightAt(x, z), z);
        }
        throw new Error('Could not find a clear pedestrian position.');
    }
    return { group, isWalkable, heightAt, randomPosition };
}
