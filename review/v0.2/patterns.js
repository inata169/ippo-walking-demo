// Add a feature here, then implement its pose contribution in gait.js.
// Coefficients are illustrative engineering values, not clinical measurements.
export const FEATURES = [
  {id:'toeClearance', label:'つま先が上がりにくい', view:'side', hint:'横・足元から、振り出す足のつま先の高さを見てみましょう。'},
  {id:'circumduction', label:'脚を外へ回す', view:'front', hint:'前から、振り出す足が外側へ描く軌道を見てみましょう。'},
  {id:'hipHiking', label:'骨盤を持ち上げる', view:'back', hint:'後ろから、左右の骨盤の高さを見比べてみましょう。'},
  {id:'kneeHyperextension', label:'膝が反り返る', view:'side', hint:'横から、足で支える時の膝の向きを観察しましょう。'},
  {id:'reducedSupport', label:'動かしにくい側で支える時間が短い', view:'front', hint:'周期を進めて、左右それぞれで支える時間を見比べましょう。'},
  {id:'trunkLean', label:'上体を横へ傾ける', view:'front', hint:'前から、骨盤に対する上体の傾きを見てみましょう。'},
];
export const LEVELS = ['なし','小','中','大'];
export const PARAMETERS = Object.freeze({stride:0.64, period:2.4, stance:0.62, footHeight:0.07, legLength:0.46,
  toeDrop:0.22, lateralSwing:0.12, pelvicRoll:0.14, hyperextension:0.12, trunkLean:0.16, supportReduction:0.10});
export const DEFAULT = Object.freeze({feature:'circumduction', level:2, side:'right', cane:true, ground:'flat', direction:'affected', timing:'stance'});
export function normalize(input) {
  return {...DEFAULT, feature:FEATURES.some(f=>f.id===input.feature)?input.feature:DEFAULT.feature,
    level:Math.max(0,Math.min(3,Math.round(Number(input.level)||0))), side:input.side==='left'?'left':'right',
    cane:input.cane!==false, direction:input.direction==='opposite'?'opposite':'affected', timing:input.timing==='swing'?'swing':'stance'};
}
export const featureOf = c => FEATURES.find(f=>f.id===c.feature);
