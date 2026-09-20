// Illustrative observation positions within the affected-side gait cycle.
// These are not detected clinical gait events or measured timings.
export const OBSERVATION_PHASES = Object.freeze([
  {id:'footContact',label:'足を着く',position:0.00},
  {id:'acceptWeight',label:'身体を支え始める',position:0.10},
  {id:'midSupport',label:'足で支える',position:0.31},
  {id:'footOff',label:'足が床から離れる',position:0.62},
  {id:'midSwing',label:'足を前へ出す',position:0.81},
  {id:'nextContact',label:'次の一歩を着く',position:0.99},
]);

export function phaseById(id) {
  return OBSERVATION_PHASES.find(phase=>phase.id===id)??null;
}

export function cycleAtPhase(cycles,id) {
  const phase=phaseById(id);
  if(!phase)throw new Error('未対応の観察場面です。');
  return Math.floor(cycles)+phase.position;
}
