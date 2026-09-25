import * as THREE from '../three.module.js';
import { GLTFLoader } from '../GLTFLoader.js';
import { clone } from '../SkeletonUtils.js';
import { createNavigation } from './navigation.js';
import { loadProtagonists } from './protagonists.js';

const modelDirectory = new URL('../../assets/kenney_blocky-characters_20/Models/GLB format/', import.meta.url);
const characterNames = ['a', 'b', 'c', 'e', 'f', 'i', 'j', 'k', 'l', 'p', 'q'];

class Person {
    constructor(template, scene, environment, config, navigation, others) {
        // Clone skeletons as well as meshes so FBX characters animate independently.
        const model = clone(template.scene);
        this.environment = environment;
        this.navigation = navigation;
        this.others = others;
        this.mesh = new THREE.Group();
        this.mesh.add(model);
        const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
        model.scale.multiplyScalar(THREE.MathUtils.randFloat(1.7, 2.0) / size.y);
        model.position.y -= new THREE.Box3().setFromObject(model).min.y;
        model.traverse(object => {
            if (object.isMesh) object.castShadow = true;
        });
        for (let attempt = 0; attempt < 2000; attempt++) {
            const spawn = environment.randomPosition();
            if (navigation.clear(spawn.x, spawn.z) && others.every(p => Math.hypot(p.mesh.position.x - spawn.x, p.mesh.position.z - spawn.z) > 1.1)) {
                this.mesh.position.copy(spawn);
                break;
            }
            if (attempt === 1999) throw new Error('No clear crowd spawn found.');
        }
        this.heading = Math.random() * Math.PI * 2;
        this.routine = ['wander', 'bench', 'entrance'][others.length % 3];
        this.freeze = 0;
        this.path = this.planRoute();
        this.pause = 0;
        this.stalled = 0;
        this.velocity = new THREE.Vector3();
        this.travelSpeed = 0;
        this.speed = config.speed * THREE.MathUtils.randFloat(0.8, 1.2);
        this.mesh.rotation.y = this.heading;
        this.mixer = new THREE.AnimationMixer(model);
        const clip = template.clip;
        const action = this.mixer.clipAction(clip);
        action.time = Math.random() * clip.duration;
        action.timeScale = (template.animationSpeed ?? 1) * this.speed / config.speed;
        action.play();
        this.walk = action;
        this.baseAnimationSpeed = (template.animationSpeed ?? 1) / config.speed;
        this.idle = template.idle ? this.mixer.clipAction(template.idle).play() : null;
        this.idle?.setEffectiveWeight(0);
        scene.add(this.mesh);
    }

    planRoute() {
        let destination;
        if (this.routine === 'bench' && Math.random() < 0.6) {
            destination = { x: Math.random() < 0.5 ? -7 : 7, z: Math.random() < 0.5 ? -3.5 : 3.5 };
        } else if (this.routine === 'entrance' && Math.random() < 0.6) {
            destination = { x: Math.random() < 0.5 ? -30 : 30, z: Math.random() < 0.5 ? -9.5 : 9.5 };
        }
        return this.navigation.route(this.mesh.position, destination);
    }

    update(delta) {
        if (this.freeze > 0) { this.freeze -= delta; return; }
        const position = this.mesh.position;
        this.pause = Math.max(0, this.pause - delta);
        if (this.path.length && position.distanceTo(this.path[0]) < 0.35) {
            this.path.shift();
            if (!this.path.length) this.pause = this.routine === 'wander' ? THREE.MathUtils.randFloat(0.8, 3) : THREE.MathUtils.randFloat(3, 7);
        }
        if (!this.path.length && this.pause === 0) this.path = this.planRoute();
        const desired = new THREE.Vector3();
        const target = this.path[0];
        if (target && this.pause === 0) {
            desired.subVectors(target, position).setY(0).normalize().multiplyScalar(this.speed);
            // Steer away from nearby pedestrians before they collide.
            for (const other of this.others) {
                if (other === this) continue;
                const offset = new THREE.Vector3().subVectors(position, other.mesh.position).setY(0);
                const distance = offset.length();
                if (distance > 0.001 && distance < 1.8) {
                    desired.addScaledVector(offset.normalize(), (1.8 - distance) * this.speed);
                }
            }
            desired.clampLength(0, this.speed);
            const clearanceSpeed = desired.length() / this.speed;
            const angle = Math.atan2(desired.x, desired.z);
            const difference = Math.atan2(Math.sin(angle - this.heading), Math.cos(angle - this.heading));
            this.heading += THREE.MathUtils.clamp(difference, -2.5 * delta, 2.5 * delta);
            // Slow for sharp turns and approach destinations gently.
            const approach = this.path.length === 1 ? Math.min(1, position.distanceTo(target) / 1.2) : 1;
            desired.set(Math.sin(this.heading), 0, Math.cos(this.heading))
                .multiplyScalar(this.speed * Math.max(0, Math.cos(difference)) * approach * clearanceSpeed);
        }
        this.velocity.lerp(desired, 1 - Math.exp(-5 * delta));
        const next = position.clone().addScaledVector(this.velocity, delta);
        const safe = this.navigation.segment(position, next) && this.others.every(other => {
            if (other === this) return true;
            const distance = Math.hypot(position.x - other.mesh.position.x, position.z - other.mesh.position.z);
            return Math.hypot(next.x - other.mesh.position.x, next.z - other.mesh.position.z) >= Math.min(0.8, distance);
        });
        const moved = safe ? Math.hypot(next.x - position.x, next.z - position.z) : 0;
        if (safe) position.set(next.x, this.environment.heightAt(next.x, next.z), next.z);
        else this.velocity.set(0, 0, 0);
        this.stalled = target && moved < 0.001 ? this.stalled + delta : 0;
        if (this.stalled > 1.2) {
            this.path = this.planRoute();
            this.pause = THREE.MathUtils.randFloat(0.2, 0.7);
            this.stalled = 0;
        }
        this.mesh.rotation.y = this.heading;
        const actualSpeed = moved / Math.max(delta, 0.001);
        this.travelSpeed = THREE.MathUtils.lerp(this.travelSpeed, actualSpeed, 1 - Math.exp(-10 * delta));
        const weight = THREE.MathUtils.clamp(this.travelSpeed / 0.5, 0, 1);
        this.walk.setEffectiveWeight(this.idle ? weight : 1);
        this.walk.timeScale = this.baseAnimationSpeed * actualSpeed;
        this.idle?.setEffectiveWeight(1 - weight);
        this.mixer.update(delta);
    }

}

export async function createCrowd(scene, environment, config, loading) {
    const entities = [];
    const navigation = createNavigation(environment);
    const loader = new GLTFLoader();
    let loaded = 0;
    try {
        const total = characterNames.length + 4;
        const reportProgress = count => {
            loaded += count;
            loading.textContent = `Loading people... ${loaded}/${total}`;
        };
        const [blocky, protagonists] = await Promise.all([
            Promise.all(characterNames.map(async name => {
                const model = await loader.loadAsync(new URL(`character-${name}.glb`, modelDirectory).href);
                const clip = THREE.AnimationClip.findByName(model.animations, 'walk');
                if (!clip) {
                    throw new Error(`Character ${name} has no walking animation.`);
                }
                reportProgress(1);
                return { scene: model.scene, clip, idle: THREE.AnimationClip.findByName(model.animations, 'idle') };
            })),
            loadProtagonists().then(models => {
                reportProgress(models.length);
                return models;
            })
        ]);
        const templates = [...blocky, ...protagonists];
        for (let i = 0; i < config.entityCount; i++) {
            entities.push(new Person(templates[i % templates.length], scene, environment, config, navigation, entities));
        }
        loading.style.display = 'none';
        let glitchIn = THREE.MathUtils.randFloat(22, 38);
        let glitches = !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        return {
            setGlitches(enabled) { glitches = enabled; if (!enabled) entities.forEach(p => { p.freeze = 0; }); },
            update(delta) {
                if (glitches && (glitchIn -= delta) <= 0) {
                    // A rare, short freeze in a few pedestrians; no flashing or teleporting.
                    const candidates = entities.filter(p => p.travelSpeed > 0.6);
                    candidates.slice(0, 3).forEach(p => { p.freeze = 0.65; });
                    glitchIn = THREE.MathUtils.randFloat(25, 45);
                }
                entities.forEach(person => person.update(delta));
            }
        };
    } catch (error) {
        console.error('Unable to load crowd:', error);
        loading.textContent = 'Unable to load people. Please reload to try again.';
        return { update() {} };
    }
}

