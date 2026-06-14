import confetti from 'canvas-confetti';

// A short celebratory confetti burst, fired when an exercise is answered
// correctly. Two angled bursts from the lower corners toward the centre.
export function celebrate() {
    const defaults = { startVelocity: 45, spread: 60, ticks: 200, zIndex: 9999 };
    confetti({ ...defaults, particleCount: 90, angle: 60, origin: { x: 0, y: 0.9 } });
    confetti({ ...defaults, particleCount: 90, angle: 120, origin: { x: 1, y: 0.9 } });
}
