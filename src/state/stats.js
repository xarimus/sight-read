/**
 * Pure stats accumulator for a single drill session.
 *
 * firstTryAccuracy = targets completed on the first attempt (no WRONG before MATCH)
 *                   divided by total targets completed.
 */
export function createStats() {
  const startMs = Date.now();
  let targetsShown = 0;
  let targetsCompleted = 0;
  let notesPlayed = 0;
  let firstTryCount = 0;
  let wrongOnCurrent = false;
  let frozen = null;

  return {
    onTargetShown() {
      targetsShown++;
      wrongOnCurrent = false;
    },

    onMatch() {
      notesPlayed++;
      targetsCompleted++;
      if (!wrongOnCurrent) firstTryCount++;
    },

    onWrong() {
      notesPlayed++;
      wrongOnCurrent = true;
    },

    /** Freeze the final snapshot (call on drill stop). */
    freeze() {
      frozen = this.snapshot();
    },

    frozen() {
      return frozen;
    },

    snapshot() {
      const elapsedSec = (Date.now() - startMs) / 1000;
      const firstTryAccuracy = targetsCompleted > 0 ? firstTryCount / targetsCompleted : null;
      const targetsPerSecond = elapsedSec > 0 ? targetsCompleted / elapsedSec : 0;

      let stars = 0;
      if (targetsCompleted > 0) {
        stars = 1;
        if (targetsPerSecond >= 0.75) stars++;
        if (firstTryAccuracy !== null && firstTryAccuracy >= 0.8) stars++;
      }

      return {
        elapsedSec,
        targetsShown,
        targetsCompleted,
        notesPlayed,
        firstTryAccuracy,
        targetsPerSecond,
        stars,
      };
    },
  };
}
