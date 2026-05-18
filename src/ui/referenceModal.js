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
          <p>YIN (de Cheveigné &amp; Kawahara 2002) needs no model file to download, runs in under a millisecond, and yields a cents-offset reading for free, exactly what a tuner needle needs. Polyphonic ML detectors (Basic Pitch, CREPE) would add 20 MB of weight and latency for a task that is inherently monophonic: the user plays one note at a time.</p>
        </div>
        <div class="modal-section">
          <h3>Why first position only?</h3>
          <p>Frets 0 through 4 cover the foundational note set of classical pedagogy and eliminate the guitar's notorious fretboard redundancy, the same pitch appearing in multiple positions. Restricting the range gives beginners a reliable one-to-one mapping between staff and fretboard (mostly), so mental energy goes toward reading rather than hand navigation. Expanding to higher positions or full-neck random selection is a future option once the core reading habit is established.</p>
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
          <h3>How is the notation rendered?</h3>
          <p>The staff is a lightweight custom SVG renderer — no third-party notation library. Each target note maps to a precomputed staff position (guitar treble clef is written one octave above concert pitch) and renders synchronously as inline SVG. Glyphs (treble clef, accidentals) come from the <a href="https://github.com/steinbergmedia/bravura" target="_blank" rel="noopener">Bravura</a> SMuFL font, which ships with the app under the SIL Open Font Licence.</p>
        </div>
        <div class="modal-section">
          <h3>What comes next?</h3>
          <p>I'm considering adding support for phrases and short musical sequences in the future, intersperced witht he drills because playing pieces is more satisfying (for me anyway). I'm open to any other suggestions or feedback that you may have!</p>
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
