import * as THREE from '../three.module.js';

export function createCameraControls(camera, canvas, environment) {
    const toggle = document.getElementById('camera-toggle');
    const hint = document.getElementById('camera-hint');
    const touch = document.getElementById('walk-controls');
    const keys = new Set();
    let street = false, orbit = Math.PI / 4, yaw = 0, pitch = 0, dragging = false;
    const position = new THREE.Vector3(0, 1.85, 8);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    toggle.addEventListener('click', () => {
        street = !street; keys.clear();
        toggle.textContent = street ? 'ORBIT VIEW' : 'ENTER THE CROWD';
        toggle.setAttribute('aria-pressed', String(street));
        hint.textContent = street ? 'WASD / arrows to walk · drag to look · Esc for orbit' : 'An ordinary day. Almost.';
        touch.hidden = !street;
    });
    window.addEventListener('keydown', e => {
        if (e.code === 'Escape' && street) toggle.click();
        if (!street || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
        if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
            e.preventDefault(); keys.add(e.code);
        }
    });
    window.addEventListener('keyup', e => keys.delete(e.code));
    window.addEventListener('blur', () => { keys.clear(); dragging = false; });
    canvas.addEventListener('pointerdown', e => {
        if (street) { dragging = true; canvas.setPointerCapture(e.pointerId); document.activeElement?.blur(); }
    });
    canvas.addEventListener('pointermove', e => {
        if (dragging) { yaw -= e.movementX * 0.004; pitch = THREE.MathUtils.clamp(pitch - e.movementY * 0.004, -0.9, 0.9); }
    });
    for (const event of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(event, () => { dragging = false; });
    touch.querySelectorAll('button').forEach(button => {
        button.addEventListener('pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); keys.add(button.dataset.key); });
        for (const event of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(event, () => keys.delete(button.dataset.key));
    });
    return { update(delta) {
        if (!street) {
            if (!reduced) orbit += delta * 0.035;
            camera.position.set(Math.sin(orbit) * 21, 20, Math.cos(orbit) * 21);
            camera.lookAt(0, 1.5, 0); return;
        }
        const forward = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'));
        const side = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
        const vector = new THREE.Vector3(-Math.sin(yaw) * forward + Math.cos(yaw) * side, 0, -Math.cos(yaw) * forward - Math.sin(yaw) * side);
        if (vector.lengthSq()) vector.normalize().multiplyScalar(delta * 2.5);
        const clear = (x, z) => [[0,0],[0.2,0],[-0.2,0],[0,0.2],[0,-0.2]].every(([dx,dz]) => environment.isWalkable(x+dx,z+dz));
        if (clear(position.x + vector.x, position.z)) position.x += vector.x;
        if (clear(position.x, position.z + vector.z)) position.z += vector.z;
        position.y = THREE.MathUtils.lerp(position.y, environment.heightAt(position.x, position.z) + 1.67, 1 - Math.exp(-12 * delta));
        camera.position.copy(position);
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
    }};
}
