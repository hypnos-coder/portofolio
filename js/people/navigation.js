import * as THREE from '../three.module.js';

// A shared sidewalk grid plans complete routes before a pedestrian starts moving.
export function createNavigation(environment) {
    const nodes = new Map();
    const key = (x, z) => `${x},${z}`;
    const clear = (x, z) => [[0, 0], [0.16, 0], [-0.16, 0], [0, 0.16], [0, -0.16]]
        .every(([dx, dz]) => environment.isWalkable(x + dx, z + dz));
    function segment(a, b) {
        const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.15));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            if (!clear(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
        }
        return true;
    }
    for (let x = -40; x <= 40; x++) for (let z = -40; z <= 40; z++) {
        if (clear(x, z)) nodes.set(key(x, z), { x, z, neighbors: [] });
    }
    for (const node of nodes.values()) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const other = nodes.get(key(node.x + dx, node.z + dz));
        if (other && segment(node, other)) node.neighbors.push(other);
    }
    function route(position, destination = null) {
        const start = [...nodes.values()].filter(n => Math.hypot(n.x - position.x, n.z - position.z) < 2 && segment(position, n))
            .sort((a, b) => Math.hypot(a.x - position.x, a.z - position.z) - Math.hypot(b.x - position.x, b.z - position.z))[0];
        if (!start) return [];
        const parents = new Map([[start, null]]), queue = [start];
        for (let i = 0; i < queue.length; i++) for (const next of queue[i].neighbors) {
            if (!parents.has(next)) { parents.set(next, queue[i]); queue.push(next); }
        }
        const destinations = queue.filter(n => {
            const distance = Math.hypot(n.x - position.x, n.z - position.z);
            return distance > 7 && distance < 28;
        });
        if (!destinations.length) return [];
        let goal = destination
            ? queue.reduce((best, node) => Math.hypot(node.x - destination.x, node.z - destination.z) < Math.hypot(best.x - destination.x, best.z - destination.z) ? node : best, start)
            : destinations[Math.floor(Math.random() * destinations.length)];
        const path = [];
        while (goal) { path.unshift(goal); goal = parents.get(goal); }
        // Visibility-based simplification removes the grid's right-angle zigzags.
        const result = [];
        let anchor = position, index = 0;
        while (index < path.length) {
            let last = index;
            while (last + 1 < path.length && segment(anchor, path[last + 1])) last++;
            const n = path[last];
            result.push(new THREE.Vector3(n.x, environment.heightAt(n.x, n.z), n.z));
            anchor = n; index = last + 1;
        }
        return result;
    }
    return { clear, segment, route };
}
