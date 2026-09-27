/** Game history — newest first, capped to keep storage small. */
export const HISTORY_LIMIT = 100;

let seq = 0;
export const makeEntryId = (ts) => `${ts.toString(36)}-${(seq++).toString(36)}`;

/**
 * @param {Array} history
 * @param {{ timestamp:number, mode:'solo'|'duo', difficulty?:string, opponent:string, outcome:'win'|'loss'|'draw', winnerName?:string|null, points:number, durationMs:number }} entry
 */
export function addEntry(history, entry) {
  return [{ id: makeEntryId(entry.timestamp), ...entry }, ...history].slice(0, HISTORY_LIMIT);
}
