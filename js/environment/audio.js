// Quiet synthesized city ambience; audio starts only after an explicit click.
export function setupAmbientAudio(button) {
    let context, volume, enabled = false;
    button.addEventListener('click', async () => {
        button.disabled = true;
        try {
            if (!context) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                context = new AudioContext();
                volume = context.createGain(); volume.gain.value = 0;
                volume.connect(context.destination);
                const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
                const noise = context.createBufferSource(); noise.buffer = buffer; noise.loop = true;
                const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 380;
                noise.connect(filter); filter.connect(volume); noise.start();
                const hum = context.createOscillator(), humGain = context.createGain();
                hum.frequency.value = 65; humGain.gain.value = 0.025;
                hum.connect(humGain); humGain.connect(volume); hum.start();
            }
            await context.resume();
            enabled = !enabled;
            volume.gain.setTargetAtTime(enabled ? 0.12 : 0, context.currentTime, 0.3);
            button.textContent = enabled ? 'SOUND ON' : 'SOUND OFF';
            button.setAttribute('aria-pressed', String(enabled));
        } catch (error) {
            console.error('Audio unavailable:', error);
            button.textContent = 'SOUND UNAVAILABLE';
        } finally { button.disabled = false; }
    });
    document.addEventListener('visibilitychange', () => {
        if (!context) return;
        if (document.hidden) context.suspend();
        else if (enabled) context.resume();
    });
}
