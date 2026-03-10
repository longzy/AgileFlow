import confetti from 'canvas-confetti';

export const triggerSuccessConfetti = () => {
  const end = Date.now() + 1.5 * 1000;
  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors: colors
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors: colors
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
};

export const triggerSyncConfetti = () => {
  const duration = 3 * 1000;
  const end = Date.now() + duration;
  const colors = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors: colors,
      zIndex: 100
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors: colors,
      zIndex: 100
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
};
