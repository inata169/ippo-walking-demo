// Relative support by the FEET only. Not a force, body-weight percentage or CoP.
const smooth = t => t*t*(3-2*t);
export function supportFor(legs) {
  const raw = side => {
    const l=legs[side];
    if (!l.contact) return 0;
    return smooth(Math.min(1,l.u/0.17,(1-l.u)/0.17));
  };
  const left=raw('left'),right=raw('right'),sum=left+right;
  return {left:sum?left/sum:0,right:sum?right/sum:0,
    label:legs.left.contact&&legs.right.contact?'両足で支える':legs.left.contact?'左足で支える':'右足で支える'};
}
