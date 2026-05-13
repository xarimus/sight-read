/**
 * Cents-offset needle canvas.
 * Call update(cents) with a value in [-50, 50] to move the needle.
 * Call update(null) to show the needle at center (no detection).
 */
export function createCentsDisplay(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  function draw(cents) {
    ctx.clearRect(0, 0, W, H);

    // Background track
    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 0, W, H);

    // Center line
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();

    // Tick marks at ±25 and ±50
    [-50, -25, 25, 50].forEach((c) => {
      const x = W / 2 + (c / 50) * (W / 2 - 4);
      ctx.strokeStyle = '#555';
      ctx.beginPath();
      ctx.moveTo(x, H * 0.35);
      ctx.lineTo(x, H * 0.65);
      ctx.stroke();
    });

    // Label
    ctx.fillStyle = '#888';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('cents', W / 2, H - 2);

    if (cents === null) return;

    // Needle
    const x = W / 2 + (Math.max(-50, Math.min(50, cents)) / 50) * (W / 2 - 6);
    const inTune = Math.abs(cents) <= 10;
    ctx.fillStyle = inTune ? '#22c55e' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(x, H / 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  draw(null);

  return {
    update(cents) { draw(cents); },
  };
}
