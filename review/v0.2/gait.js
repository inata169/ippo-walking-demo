import {PARAMETERS as P, normalize} from './patterns.js';
import {supportFor} from './support.js';
export const groundAt=()=>0;
const smooth=t=>t*t*(3-2*t);
const frac=n=>n-Math.floor(n);
const envelope=t=>Math.sin(Math.PI*t)**2;
export function samplePose(input,cycles) {
  const c=normalize(input),amount=c.level/3,value=id=>c.feature===id?amount:0;
  const distance=cycles*P.stride,sign=c.side==='right'?1:-1;
  const legs={};
  for (const side of ['left','right']) {
    const affected=side===c.side,sgn=side==='right'?1:-1,offset=affected?0:0.5;
    const t=cycles+offset,phase=frac(t),stance=P.stance-(affected?P.supportReduction*value('reducedSupport'):0);
    const contact=phase<stance,u=contact?phase/stance:(phase-stance)/(1-stance);
    // Planted feet stay at a fixed WORLD position for the entire stance.
    const z=P.stride*(Math.floor(t)-offset+stance/2+(contact?0:smooth(u)));
    const e=contact?0:envelope(u),pitch=affected?value('toeClearance')*P.toeDrop*e:0;
    const lift=(0.10-(affected?value('toeClearance')*0.04:0))*e;
    const x=sgn*0.12+(affected?value('circumduction')*P.lateralSwing*e*sgn:0);
    legs[side]={side,affected,contact,phase,stance,u,x,y:P.footHeight+lift,z,pitch,lift};
  }
  const a=legs[c.side],e=a.contact?0:envelope(a.u),pelvicRoll=sign*P.pelvicRoll*value('hipHiking')*e;
  const hip={x:0,y:0.85+0.015*Math.cos(cycles*Math.PI*4),z:distance};
  const desiredBend=0.22-(0.22+P.hyperextension)*value('kneeHyperextension');
  const hyperBlend=a.contact?envelope(a.u)**3:0;
  const kneeAngle=0.22+(desiredBend-0.22)*hyperBlend;
  // Near mid stance extend the chain through zero into a signed bend.
  if (value('kneeHyperextension')&&a.contact) {
    const length=2*P.legLength*Math.cos(kneeAngle/2);
    const target=a.y+Math.sqrt(Math.max(0,length*length-(hip.z-a.z)**2-(hip.x+sign*0.105-a.x)**2));
    hip.y+=(target-hip.y)*Math.min(1,hyperBlend*4);
  }
  // Keep both fixed-length leg chains reachable; record the limitation.
  let cap=Infinity;
  for(const side of ['left','right']) {
    const s=side==='right'?1:-1,l=legs[side],dx=hip.x+s*0.105*Math.cos(pelvicRoll)-l.x,dz=hip.z-l.z;
    cap=Math.min(cap,l.y+Math.sqrt(Math.max(0,(2*P.legLength-0.00001)**2-dx*dx-dz*dz))-s*0.105*Math.sin(pelvicRoll));
  }
  const constrained=hip.y>cap;
  hip.y=Math.min(hip.y,cap);
  for(const side of ['left','right']) {
    const s=side==='right'?1:-1,l=legs[side];
    l.hip=[hip.x+s*0.105*Math.cos(pelvicRoll),hip.y+s*0.105*Math.sin(pelvicRoll),hip.z];
    const bendSign=l.affected&&l.contact&&kneeAngle<0?-1:1;
    l.knee=kneeBetween(l.hip,[l.x,l.y,l.z],P.legLength,P.legLength,bendSign);
  }
  const leanActive=(c.timing==='stance')===a.contact;
  const lean=sign*(c.direction==='affected'?1:-1)*P.trunkLean*value('trunkLean')*(leanActive?envelope(a.u):0);
  const caneSide=c.side==='right'?'left':'right';
  const p={distance,hip,left:legs.left,right:legs.right,phase:cycles*Math.PI*2,pelvicRoll,lean,constrained,
    cane:{x:-sign*0.38,y:a.contact?0:a.lift*0.75,z:a.z+0.09,contact:c.cane&&a.contact,side:caneSide}};
  return {...p,support:supportFor(legs)};
}
export function kneeBetween(hip,ankle,l1=0.46,l2=0.46,bendSign=1) {
  const d=ankle.map((v,i)=>v-hip[i]),dist=Math.hypot(...d),safe=Math.max(0.0001,Math.min(dist,l1+l2));
  const dir=d.map(v=>v/Math.max(dist,0.0001)),along=(l1*l1-l2*l2+safe*safe)/(2*safe);
  const h=Math.sqrt(Math.max(0,l1*l1-along*along));
  let bend=[-dir[0]*dir[2],-dir[1]*dir[2],1-dir[2]*dir[2]],bn=Math.hypot(...bend);
  if(bn<0.001){bend=[0,1,0];bn=1;}
  return hip.map((v,i)=>v+dir[i]*along+bend[i]/bn*h*bendSign);
}
