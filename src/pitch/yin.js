/**
 * YIN pitch detection algorithm (de Cheveigné & Kawahara 2002).
 * Returns { frequency, clarity, rms } or null if no pitch found.
 */
export function detectPitch(buffer, sampleRate, config = {}) {
  const {
    threshold = 0.15,
    minFreq = 75,
    maxFreq = 450,
  } = config;

  const minLag = Math.floor(sampleRate / maxFreq);
  const maxLag = Math.ceil(sampleRate / minFreq);
  const bufLen = buffer.length;

  if (maxLag >= bufLen) return null;

  // RMS
  let sum = 0;
  for (let i = 0; i < bufLen; i++) sum += buffer[i] * buffer[i];
  const rms = Math.sqrt(sum / bufLen);

  // Step 1+2: difference function + cumulative mean normalized
  const yinBuf = new Float32Array(maxLag + 1);
  yinBuf[0] = 1;
  let runningSum = 0;

  for (let tau = 1; tau <= maxLag; tau++) {
    let diff = 0;
    for (let i = 0; i < bufLen - maxLag; i++) {
      const delta = buffer[i] - buffer[i + tau];
      diff += delta * delta;
    }
    runningSum += diff;
    yinBuf[tau] = runningSum === 0 ? 0 : diff * tau / runningSum;
  }

  // Step 3: absolute threshold — find first dip below threshold
  let tau = minLag;
  let found = false;
  while (tau <= maxLag) {
    if (yinBuf[tau] < threshold) {
      // Walk down to the local minimum
      while (tau + 1 <= maxLag && yinBuf[tau + 1] < yinBuf[tau]) tau++;
      found = true;
      break;
    }
    tau++;
  }

  if (!found) return null;

  // Step 4: parabolic interpolation for sub-sample accuracy
  const x0 = tau > 1 ? tau - 1 : tau;
  const x2 = tau < maxLag ? tau + 1 : tau;
  let refinedTau;
  if (x0 === tau) {
    refinedTau = yinBuf[tau] <= yinBuf[x2] ? tau : x2;
  } else if (x2 === tau) {
    refinedTau = yinBuf[tau] <= yinBuf[x0] ? tau : x0;
  } else {
    const denom = 2 * (2 * yinBuf[tau] - yinBuf[x0] - yinBuf[x2]);
    refinedTau = denom === 0 ? tau : tau + (yinBuf[x2] - yinBuf[x0]) / denom;
  }

  const frequency = sampleRate / refinedTau;
  const clarity = 1 - yinBuf[tau];

  return { frequency, clarity, rms };
}
