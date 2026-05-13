/**
 * Pure stop-condition tracker.
 *
 * spec: { type: 'time', seconds }
 *     | { type: 'count', count }
 *     | { type: 'endless' }
 */
export function createStopCondition(spec) {
  const startMs = Date.now();
  let advances = 0;

  return {
    onTargetAdvance() {
      advances++;
    },

    shouldStop() {
      if (spec.type === 'endless') return false;
      if (spec.type === 'time') return (Date.now() - startMs) / 1000 >= spec.seconds;
      if (spec.type === 'count') return advances >= spec.count;
      return false;
    },

    /** Returns progress info for the stats display, or null if endless. */
    progress() {
      if (spec.type === 'endless') return null;
      if (spec.type === 'time') {
        const elapsed = (Date.now() - startMs) / 1000;
        return { current: Math.min(elapsed, spec.seconds), total: spec.seconds, unit: 'time' };
      }
      if (spec.type === 'count') {
        return { current: advances, total: spec.count, unit: 'count' };
      }
      return null;
    },
  };
}
