/**
 * Waveform trace canvas. Reads from an AnalyserNode each animation frame.
 * Also paints an RMS bar to make noise-gate tuning easier.
 */
export function createWaveformTrace(canvas, analyser) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const dataArray = new Float32Array(analyser.fftSize);
  let animId = null;
  let noiseGateRef = { value: 0.01 };

  function draw() {
    analyser.getFloatTimeDomainData(dataArray);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 0, W, H);

    // Waveform
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const sliceW = W / dataArray.length;
    for (let i = 0; i < dataArray.length; i++) {
      const x = i * sliceW;
      const y = (1 - (dataArray[i] + 1) / 2) * H;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // RMS bar (right edge)
    let rmsSum = 0;
    for (let i = 0; i < dataArray.length; i++) rmsSum += dataArray[i] * dataArray[i];
    const rms = Math.sqrt(rmsSum / dataArray.length);
    const rmsH = Math.min(H, rms * H * 8);
    const gateH = Math.min(H, noiseGateRef.value * H * 8);

    ctx.fillStyle = rms >= noiseGateRef.value ? '#22c55e' : '#ef4444';
    ctx.fillRect(W - 8, H - rmsH, 6, rmsH);

    // Gate line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W - 10, H - gateH);
    ctx.lineTo(W, H - gateH);
    ctx.stroke();

    animId = requestAnimationFrame(draw);
  }

  draw();

  return {
    setNoiseGate(val) { noiseGateRef.value = val; },
    stop() { if (animId) cancelAnimationFrame(animId); },
  };
}
