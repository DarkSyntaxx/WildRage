/**
 * Procedural Audio Synthesizer relying strictly on Web Audio API oscillators.
 * Eliminates payload dependencies on external sound files and synthesizes 
 * native retro 8-bit chips internally using mathematically defined frequencies.
 */
export class AudioManager {
    constructor() {
        this.initialized = false;
        this.bgm = false; // Background music playing status
    }

    /**
     * Instantiates the AudioContext bound to global window inputs.
     * Prevents browser autoplay blocking mechanisms.
     */
    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = this.ctx.createGain();
        this.masterVolume.connect(this.ctx.destination);
        this.masterVolume.gain.value = 0.5; // Starts balanced
        this.initialized = true;
    }

    /**
     * Maps fractional range slider properties directly to the Global Gain.
     */
    setVolume(val) {
        if (this.masterVolume) this.masterVolume.gain.value = val;
    }

    /**
     * Helper routine injecting defined pitch envelopes to global channels.
     */
    playTone(freq, type, duration, volEnv) {
        if (!this.initialized) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        // Attack-Decay envelope
        gain.gain.setValueAtTime(volEnv, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.masterVolume);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    /**
     * Synthesizes randomized noise buffers representing gritty impacts.
     * Passed through a biquad lowpass filter to produce heavy bass impact.
     */
    playNoise(duration) {
        if (!this.initialized) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; 
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        // Lowpass crunch filter mitigates high frequencies, simulating heavy boxing impacts
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800; 
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterVolume);
        
        noise.start();
    }

    // --- High-Level Game Audio Triggers ---
    punch() { this.playTone(180, 'square', 0.1, 0.4); }
    hit() { this.playNoise(0.25); }
    block() { this.playTone(400, 'sine', 0.1, 0.3); }

    kick() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        
        // Pitch drop effect mapping a heavier sweeping impact sound
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.15); 
        
        gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.masterVolume);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    special() { 
        this.playTone(500, 'sawtooth', 0.4, 0.8); 
        setTimeout(() => this.playNoise(0.5), 100); 
    }

    /**
     * Recursive procedural routine driving a competitive battle soundtrack.
     */
    playBGM() {
        if (!this.initialized || this.bgm) return;
        this.bgm = true;
        
        // Simple 8-bit harmonic sequences mapped in frequency bounds (A minor)
        const notes = [110, 110, 130, 146, 130, 110, 98, 110];
        let idx = 0;
        
        const nextNote = () => {
            if(!this.bgm) return;
            this.playTone(notes[idx], 'square', 0.25, 0.15);
            
            // Counter-resonance harmonic doubling
            this.playTone(notes[idx] * 1.5, 'pulse', 0.25, 0.05); 
            
            idx = (idx + 1) % notes.length;
            
            // Fast 240BPM sixteenth bounds mapping driving action loops
            setTimeout(nextNote, 250); 
        };
        nextNote();
    }

    stopBGM() {
        this.bgm = false; // Breaks recursive timing loop cleanly
    }
}

// Instantiate external reference singleton
export const audio = new AudioManager();
