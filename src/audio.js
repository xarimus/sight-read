/**
 * Audio pipeline initialisation.
 * Returns { audioContext, analyser, onSamples(callback) }.
 * onSamples registers a listener that receives Float32Array chunks
 * from the AudioWorklet (or ScriptProcessorNode fallback).
 */
export async function initAudio() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: 22050,
  });

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });

  const source = audioContext.createMediaStreamSource(stream);

  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  let sampleCallback = null;

  const onSamples = (cb) => { sampleCallback = cb; };

  // Try AudioWorklet first, fall back to ScriptProcessorNode
  try {
    await audioContext.audioWorklet.addModule(
      new URL('./audio-worklet.js', import.meta.url)
    );
    const workletNode = new AudioWorkletNode(audioContext, 'sampler-processor');
    workletNode.port.onmessage = (e) => {
      if (sampleCallback) sampleCallback(e.data);
    };
    source.connect(workletNode);
  } catch {
    // ScriptProcessorNode fallback (deprecated but still works)
    const bufferSize = 2048;
    const scriptNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
    scriptNode.onaudioprocess = (e) => {
      if (sampleCallback) {
        sampleCallback(new Float32Array(e.inputBuffer.getChannelData(0)));
      }
    };
    source.connect(scriptNode);
    scriptNode.connect(audioContext.destination);
  }

  function stop() {
    stream.getTracks().forEach(t => t.stop());
    audioContext.close();
  }

  return { audioContext, analyser, onSamples, stop };
}
