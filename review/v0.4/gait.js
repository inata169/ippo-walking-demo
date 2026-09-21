import {PARAMETERS as P, normalize,strideFor} from './patterns.js?v=0.4.2-smooth';
import {supportFor} from './support.js?v=0.4.2-smooth';
export const groundAt=()=>0;
const smooth=t=>t*t*t*(10+t*(-15+6*t));
const frac=n=>n-Math.floor(n);
const envelope=t=>Math.sin(Math.PI*t)**2;
const rad=degrees=>degrees*Math.PI/180;
const blend=(a,b,t)=>a+(b-a)*smooth(Math.max(0,Math.min(1,t)));
export function timingFor(input) {
  const c=normalize(input),q=c.mode==='detail'?c.detail.reducedSupport/100:(c.feature==='reducedSupport'?c.level/3:0);
  return {affected:P.stance-P.supportReduction*q,opposite:P.stance+P.supportReduction*q,oppositeOffset:0.5+P.supportReduction*q};
}
function curve(u,points) {
  for(let i=1;i<points.length;i++)if(u<=points[i][0])return blend(points[i-1][1],points[i][1],(u-points[i-1][0])/(points[i][0]-points[i-1][0]));
  return points.at(-1)[1];
}
// Conservative bounds enclosing the shoe, toe and sole used by scene.js.
// Smooth, conservative absolute value: avoids an ankle-velocity cusp at flat foot.
const softAbs=x=>Math.sqrt(x*x+0.0004);
export const soleDepth=(pitch,roll)=>0.063+0.203*softAbs(Math.sin(pitch))+0.075*softAbs(Math.sin(roll));
export function samplePose(input,cycles) {
  const c=normalize(input),amount=c.level/3,value=id=>c.mode==='detail'?c.detail[id]/100:(c.feature===id?amount:0);
  // Facing +Z: anatomical right is -X.
  const stride=strideFor(c),distance=cycles*stride,sign=c.side==='right'?-1:1,timing=timingFor(c);
  const legs={};
  for (const side of ['left','right']) {
    const affected=side===c.side,sgn=side==='right'?-1:1,offset=affected?0:timing.oppositeOffset;
    const t=cycles+offset,phase=frac(t),stance=affected?timing.affected:timing.opposite;
    const contact=phase<stance,u=contact?phase/stance:(phase-stance)/(1-stance);
    const z=stride*(Math.floor(t)-offset+stance/2+(contact?0:smooth(u)));
    const e=contact?0:envelope(u),difficulty=affected?value('toeClearance'):0;
    // Foot rollover is stylized about the ankle; not a pressure/rocker solver.
    const basePitch=contact?curve(u,[[0,-0.16],[0.16,0],[0.72,0],[1,0.28]]):curve(u,[[0,0.28],[0.35,-0.06],[0.70,-0.06],[1,-0.16]]);
    const pitch=basePitch+difficulty*P.toeDrop*e;
    const lift=(0.065-difficulty*0.057)*e;
    const x=sgn*0.12+(affected?value('circumduction')*P.lateralSwing*e*sgn:0);
    const roll=affected&&c.mode==='detail'?-sgn*c.detail.footRoll/100*0.22:0;
    const floorHeight=soleDepth(pitch,roll)+0.007+lift;
    // In swing, the ankle follows a single arch, rather than dipping whenever
    // the rotating shoe passes through horizontal. Blend conservatively above
    // the shoe-clearance bound without a hard max or a touchdown discontinuity.
    const archHeight=blend(soleDepth(0.28,roll),soleDepth(-0.16,roll),u)+0.007+lift-difficulty*0.055*e;
    const y=contact?floorHeight:(archHeight+floorHeight+Math.hypot(archHeight-floorHeight,0.004*e))/2;
    const baseline=rad(curve(u,[[0,10],[0.16,18],[0.5,3],[0.72,5],[1,35]]));
    const singleStart=timing.opposite-timing.oppositeOffset,singleEnd=1-timing.oppositeOffset;
    const hyperWindow=affected&&phase>singleStart&&phase<singleEnd?envelope((phase-singleStart)/(singleEnd-singleStart)):0;
    const targetKnee=baseline-(affected?value('kneeHyperextension')*(rad(3)+P.hyperextension)*hyperWindow:0);
    legs[side]={side,affected,contact,phase,stance,u,x,y,z,pitch,roll,lift,targetKnee};
  }
  const a=legs[c.side],e=a.contact?0:envelope(a.u);
  const pelvicYaw=sign*rad(4)*Math.cos(cycles*Math.PI*2);
  const pelvicRoll=sign*(rad(1)*Math.sin(cycles*Math.PI*2)+P.pelvicRoll*value('hipHiking')*e);
  const pelvicPitch=rad(6)+rad(1)*Math.cos(cycles*Math.PI*4);
  const forwardLean=rad(4)+rad(1.5)*Math.cos(cycles*Math.PI*4);
  const support=supportFor(legs);
  // Pelvic sway is continuous; support bars are not a physical position solver.
  const hip={x:sign*0.025*Math.cos(2*Math.PI*(cycles-timing.affected/2)),y:0,z:distance};
  const hipOffset=side=>{const s=side==='right'?-1:1;return [s*0.105*Math.cos(pelvicRoll)*Math.cos(pelvicYaw),s*0.105*Math.sin(pelvicRoll),-s*0.105*Math.sin(pelvicYaw)];};
  const heightFor=(l,length)=>{
    const o=hipOffset(l.side),dx=hip.x+o[0]-l.x,dz=hip.z+o[2]-l.z;
    return l.y+Math.sqrt(Math.max(0,length*length-dx*dx-dz*dz))-o[1];
  };
  // A smooth pelvis path spans both support phases. Do not average two
  // incompatible leg heights using the rapidly changing support display.
  hip.y=0.978+0.010*Math.cos(4*Math.PI*(cycles-0.31));
  const singleStart=timing.opposite-timing.oppositeOffset,singleEnd=1-timing.oppositeOffset;
  const hyperWindow=a.phase>singleStart&&a.phase<singleEnd?envelope((a.phase-singleStart)/(singleEnd-singleStart)):0;
  if(a.contact&&hyperWindow>0){
    const o=hipOffset(c.side),length=Math.hypot(hip.x+o[0]-a.x,hip.y+o[1]-a.y,hip.z+o[2]-a.z);
    const baselineAngle=2*Math.acos(Math.min(1,length/(2*P.legLength)));
    a.targetKnee=baselineAngle-(baselineAngle+P.hyperextension)*value('kneeHyperextension')*hyperWindow;
    hip.y=heightFor(a,2*P.legLength*Math.cos(a.targetKnee/2));
  }
  // Lift a swinging ankle only when needed to keep the support-leg target reachable.
  // This geometric compensation is reported, not interpreted as muscle behavior.
  const reachLength=l=>2*P.legLength*(l.contact?1:Math.cos(rad(8)/2));
  const reachCap=Math.min(...Object.values(legs).map(l=>heightFor(l,reachLength(l))+(l.contact?0:0.20*envelope(l.u))));
  const reachLimited=hip.y>reachCap+1e-8;
  hip.y=Math.min(hip.y,reachCap);
  let swingCompensated=false;
  for(const l of Object.values(legs))if(!l.contact){
    const required=hip.y-heightFor(l,reachLength(l));
    if(required>0){l.y+=required;l.lift+=required;swingCompensated=true;}
  }
  const cap=Math.min(...Object.values(legs).map(l=>heightFor(l,2*P.legLength)));
  const constrained=reachLimited||swingCompensated||hip.y>cap+1e-8;
  hip.y=Math.min(hip.y,cap);
  for(const side of ['left','right']) {
    const l=legs[side],o=hipOffset(side);
    l.hip=[hip.x+o[0],hip.y+o[1],hip.z+o[2]];
    const bendSign=l.affected&&l.contact&&l.targetKnee<0?-1:1;
    l.knee=kneeBetween(l.hip,[l.x,l.y,l.z],P.legLength,P.legLength,bendSign);
    const length=Math.hypot(l.hip[0]-l.x,l.hip[1]-l.y,l.hip[2]-l.z);
    l.kneeAngle=bendSign*2*Math.acos(Math.min(1,length/(2*P.legLength)));
    l.soleClearance=l.y-soleDepth(l.pitch,l.roll);
  }
  const leanActive=(c.timing==='stance')===a.contact;
  const lean=sign*(c.direction==='affected'?1:-1)*P.trunkLean*value('trunkLean')*(leanActive?envelope(a.u):0);
  const caneSide=c.side==='right'?'left':'right';
  return {distance,hip,left:legs.left,right:legs.right,phase:cycles*Math.PI*2,pelvicRoll,pelvicYaw,pelvicPitch,forwardLean,lean,constrained,support,
    cane:{x:-sign*0.38,y:a.contact?0:a.lift*0.75,z:a.z+0.09,contact:c.cane&&a.contact,side:caneSide}};
}
export function kneeBetween(hip,ankle,l1=0.46,l2=0.46,bendSign=1) {
  const d=ankle.map((v,i)=>v-hip[i]),dist=Math.hypot(...d),safe=Math.max(0.0001,Math.min(dist,l1+l2));
  const dir=d.map(v=>v/Math.max(dist,0.0001)),along=(l1*l1-l2*l2+safe*safe)/(2*safe);
  const h=Math.sqrt(Math.max(0,l1*l1-along*along));
  let bend=[-dir[0]*dir[2],-dir[1]*dir[2],1-dir[2]*dir[2]],bn=Math.hypot(...bend);
  if(bn<0.001){bend=[0,1,0];bn=1;}
  return hip.map((v,i)=>v+dir[i]*along+bend[i]/bn*h*bendSign);
}

export function caneElbowBetween(shoulder,hand) {
  // A cane-holding elbow flexes posteriorly (-Z) instead of using the knee's
  // forward-bending solution.
  return kneeBetween(shoulder,hand,0.29,0.28,-1);
}
