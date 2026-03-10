export const playDropSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const audioCtx = new AudioContext();
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = audioCtx.currentTime;
      playTone(987.77, now, 0.1); // B5
      playTone(1318.51, now + 0.1, 0.4); // E6
    }
  } catch (e) {
    console.error('Audio play failed', e);
  }
};

export const playSyncSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const audioCtx = new AudioContext();
      const playTone = (freq: number, type: OscillatorType, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = audioCtx.currentTime;
      // Zelda "Secret Discovered" jingle (G5, F#5, D#5, A4, G#4, E5, G#5, C6)
      const notes = [783.99, 739.99, 622.25, 440.00, 415.30, 659.25, 830.61, 1046.50];
      const noteDuration = 0.12;
      
      notes.forEach((freq, i) => {
        const duration = i === notes.length - 1 ? 0.6 : noteDuration;
        playTone(freq, 'square', now + i * noteDuration, duration);
      });
    }
  } catch (e) {
    console.error('Failed to play audio:', e);
  }
};
