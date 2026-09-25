import * as THREE from '../three.module.js';
import { FBXLoader } from '../FBXLoader.js';
import { clone } from '../SkeletonUtils.js';
import { createWalkCycle } from './walk-cycle.js';

const directory = new URL('../../assets/kenney_animated-characters-protagonists/', import.meta.url);
const skins = ['skaterMaleA', 'skaterFemaleA', 'criminalMaleA', 'cyborgFemaleA'];

export async function loadProtagonists() {
    const loader = new FBXLoader();
    const textureLoader = new THREE.TextureLoader();
    const [model, idleAnimation, textures] = await Promise.all([
        loader.loadAsync(new URL('Model/characterMedium.fbx', directory).href),
        loader.loadAsync(new URL('Animations/idle.fbx', directory).href),
        Promise.all(skins.map(name => textureLoader.loadAsync(new URL(`Skins/${name}.png`, directory).href)))
    ]);
    const idle = idleAnimation.animations.find(candidate => candidate.name.endsWith('|Idle'));
    if (!idle) throw new Error('Protagonists pack has no idle pose.');
    const clip = createWalkCycle(idle);
    return textures.map(texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.magFilter = THREE.NearestFilter;
        const scene = clone(model);
        const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 });
        scene.traverse(object => {
            if (object.isMesh) object.material = material;
        });
        return { scene, clip, idle, animationSpeed: 1 };
    });
}
