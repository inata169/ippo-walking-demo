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
    cane:input.cane!==false, direction:input.direction==='opposite'?'opposite':'affected', timing:input.timing==='swing'?'swing':'stance',
    mode:input.mode==='detail'?'detail':'preset',detail:normalizeDetail(input.detail)};
}
export const featureOf = c => FEATURES.find(f=>f.id===c.feature);

// One registry drives detail UI, normalization and saved-file validation.
export const DETAIL_FIELDS = [
  ...FEATURES.map(f=>({id:f.id,label:f.label,min:0,max:100,step:5,default:0,unit:'',hint:'0：強調なし ／ 100：強調大（重症度ではありません）'})),
  {id:'footRoll',label:'足首の内外への傾き',min:-100,max:100,step:5,default:0,unit:'',hint:'−：外反方向 ／ 0：傾きなし ／ ＋：内反方向'},
  {id:'stepLength',label:'歩幅（モデル設定）',min:24,max:40,step:1,default:32,unit:' cm',hint:'片足から反対の足まで。練習の推奨値ではありません。'},
  {id:'cadence',label:'歩調（モデル設定）',min:30,max:80,step:5,default:50,unit:' 歩/分',hint:'歩幅とは別に調整できます。スロー再生は観察用です。'},
];
export const normalizeDetail = input => Object.fromEntries(DETAIL_FIELDS.map(f=>{
  const n=input?.[f.id];
  const v=typeof n==='number'&&Number.isFinite(n)?n:f.default;
  return [f.id,Math.max(f.min,Math.min(f.max,Math.round(v/f.step)*f.step))];
}));
export function fromPreset(config) {return normalizeDetail({[config.feature]:config.level/3*100});}
export const strideFor=c=>c.mode==='detail'?normalizeDetail(c.detail).stepLength/50:PARAMETERS.stride;
export const periodFor=c=>c.mode==='detail'?120/normalizeDetail(c.detail).cadence:PARAMETERS.period;
