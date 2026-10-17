// Soft feedback sounds made on the fly with the Web Audio API: no sound files to download, and
// nothing plays unless the learner switched sounds on in Settings.

let context: AudioContext | undefined;

function tone(frequencies: number[], duration = 0.12, gap = 0.08, volume = 0.06): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    context ??= new Ctx();
    const start = context.currentTime;
    frequencies.forEach((frequency, i) => {
      const osc = context!.createOscillator();
      const gain = context!.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      const at = start + i * gap;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(volume, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      osc.connect(gain).connect(context!.destination);
      osc.start(at);
      osc.stop(at + duration + 0.02);
    });
  } catch {
    // Audio is a nice-to-have; never let it break a quiz.
  }
}

/** A short rising two-note chime. */
export function playCorrect(): void {
  tone([660, 880]);
}

/** A soft low note - gentle, never alarming. */
export function playWrong(): void {
  tone([300], 0.18, 0, 0.05);
}

/** A three-note fanfare for a level-up or a reached goal. */
export function playCelebrate(): void {
  tone([523, 659, 784], 0.18, 0.1);
}
