/**
 * Design-rationale reference modal.
 * Returns { show(), hide() }.
 */
export function createReferenceModal() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-label', 'Design Rationale');
  backdrop.style.display = 'none';

  backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>Design Rationale</h2>
        <button class="modal-close" title="Close">&#x2715;</button>
      </div>
      <div class="modal-body">
        <div class="modal-section">
          <h3>Why YIN pitch detection?</h3>
          <p>YIN (de Cheveigné &amp; Kawahara 2002) needs no model file to download, runs in under a millisecond, and yields a cents-offset reading for free — exactly what a tuner needle needs. Polyphonic ML detectors (Basic Pitch, CREPE) would add 20 MB of weight and latency for a task that is inherently monophonic: the student plays one note at a time.</p>
        </div>
        <div class="modal-section">
          <h3>Why is B3 only on the open 2nd string?</h3>
          <p>The same MIDI pitch (59 = B3) also lives at fret 4, string 3. Putting both positions in the pool means the drill could present B3 twice in a row, which the no-repeat logic intentionally prevents — leaving the student stuck. The open 2nd string is the standard pedagogical primary for classical guitar, so that position is the canonical target. A dedicated "B3 Redundancy Drill" is planned for Block 5 once dual-position rendering is supported.</p>
        </div>
        <div class="modal-section">
          <h3>Why the Match-Lock-Release state machine?</h3>
          <p>Raw frame-by-frame comparison fires too fast: the pitch transient between two notes can briefly register as the correct MIDI value, advancing the drill before the student has consciously played the note. The MLR machine <em>locks</em> on a confirmed match, ignores everything until silence is detected, then <em>releases</em> to advance the target. One deliberate note = one advance.</p>
        </div>
        <div class="modal-section">
          <h3>Why the RMS noise gate?</h3>
          <p>Silence detection needs a threshold to tell genuine silence apart from ambient noise, string buzz, or AC hum. The default gate (0.005 RMS) is tuned to ignore a quiet room while still recognising a softly played open string. It is exposed as a knob in the Debug page for environments that need adjustment.</p>
        </div>
        <div class="modal-section">
          <h3>Why AlphaTab for notation?</h3>
          <p>AlphaTab renders standard musical notation (no tablature, per the drill goal of forcing staff reading) via WebAssembly-accelerated SVG, fully in the browser with no server round-trips. AlphaTex strings encode each target note in a few characters and can be hot-swapped on every advance, giving instant visual feedback.</p>
        </div>
        <div class="modal-section">
          <h3>What comes next?</h3>
          <p>Two architectural seams are already in place: <code>createTargetSource()</code> (currently random or constrained-random) will be extended for sequential phrase sources, and <code>PitchDetector</code> (currently wrapping YIN) can be swapped for a polyphonic backend (Basic Pitch, CREPE) when Phrase/Song mode arrives and chord detection becomes useful.</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  const closeBtn = backdrop.querySelector('.modal-close');
  const modal = backdrop.querySelector('.modal');

  closeBtn.addEventListener('click', hide);

  backdrop.addEventListener('click', e => {
    if (!modal.contains(e.target)) hide();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && backdrop.style.display !== 'none') hide();
  });

  function show() {
    backdrop.style.display = 'flex';
    closeBtn.focus();
  }

  function hide() {
    backdrop.style.display = 'none';
  }

  return { show, hide };
}
