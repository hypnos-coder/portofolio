import * as THREE from '../three.module.js';

export function setupLighting(scene, renderer) {
    const haze = 0xa6b5a7;
    scene.background = new THREE.Color(haze);
    scene.fog = new THREE.FogExp2(haze, 0.009);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    scene.add(new THREE.HemisphereLight(0xe0efdb, 0x556459, 2.2));
    const sun = new THREE.DirectionalLight(0xffeed2, 2.6);
    sun.position.set(-30, 55, 25);
    sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 150 });
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.normalBias = 0.04;
    sun.shadow.bias = -0.0001;
    scene.add(sun);
}
