import * as THREE from '../three.module.js';

// Author a relaxed walk from the rig's standing pose, with opposing arm/leg swings.
// Keeping the idle track bindings also preserves this FBX rig's scale and orientation.
export function createWalkCycle(idle) {
    const duration = 1.05, frames = 32;
    const times = Array.from({ length: frames + 1 }, (_, i) => i * duration / frames);
    const swing = { LeftUpLeg: 0.32, RightUpLeg: -0.32, LeftArm: -0.18, RightArm: 0.18 };
    const axis = new THREE.Vector3(1, 0, 0);
    const tracks = idle.tracks.map(track => {
        const base = Array.from(track.createInterpolant().evaluate(0));
        const [bone, property] = track.name.split('.');
        const values = [];
        for (let i = 0; i <= frames; i++) {
            const phase = i / frames * Math.PI * 2;
            const value = [...base];
            if (property === 'quaternion') {
                let angle = (swing[bone] ?? 0) * Math.sin(phase);
                if (bone === 'LeftLeg') angle = -0.38 * Math.max(0, -Math.sin(phase));
                if (bone === 'RightLeg') angle = -0.38 * Math.max(0, Math.sin(phase));
                const q = new THREE.Quaternion().fromArray(base);
                q.multiply(new THREE.Quaternion().setFromAxisAngle(axis, angle));
                q.toArray(value);
            }
            values.push(...value);
        }
        return new track.constructor(track.name, times, values);
    });
    return new THREE.AnimationClip('Procedural walk', duration, tracks);
}
