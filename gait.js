// Deterministic illustrative kinematics, not a validated biomechanical model.
export const PRESETS={light:{power:85,stiffness:15,sensation:85},medium:{power:55,stiffness:45,sensation:60},heavy:{power:30,stiffness:75,sensation:35}};
export const DEFAULT={...PRESETS.medium,side:'right',cane:true,ground:'flat',speed:'normal'};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const smooth=t=>t*t*(3-2*t);
export const groundAt=(z,ground)=>ground==='slope'?z*.045:0;
export const strideFor=c=>.88*(.65+.35*c.power/100);
export const speedFor=c=>(.30+.45*c.power/100)*(c.speed==='slow'?.68:1)*(c.ground==='slope'?.9:1);
export function legSample(config,distance,side){
 const affected=side===config.side,sign=side==='right'?1:-1;
 const strength=affected?config.power/100:1,stiff=affected?config.stiffness/100:0;
 const length=strideFor(config),cycle=distance/length+.12+(side==='left'?.5:0),phase=((cycle%1)+1)%1,stance=.62;
 const contact=phase<stance,u=contact?phase/stance:(phase-stance)/(1-stance),swing=Math.sin(Math.PI*u);
 const localZ=contact?length*(stance/2-phase):length*stance*(smooth(u)-.5);
 const uncertainty=affected?(1-config.sensation/100)*.027:0;
 const index=Math.floor(cycle),n0=Math.sin(index*2.399+1.2),n1=Math.sin((index+1)*2.399+1.2);
 const placement=uncertainty*(contact?n0:n0+(n1-n0)*smooth(u));
 const circumduction=!contact?sign*stiff*.12*swing:0;
 const x=sign*.12+placement+circumduction,z=distance+localZ;
 const pitch=contact?0:((1-strength)*.20+stiff*.13)*swing;
 const lift=contact?0:(.048+.070*strength)*(1-.42*stiff)*swing;
 const soleFloor=.063*Math.cos(pitch)+.195*Math.sin(pitch);
 const y=groundAt(z,config.ground)+Math.max(.070+lift,soleFloor+.007);
 const sensePhase=((phase-(affected?(1-config.sensation/100)*.12:0))+1)%1;
 return {side,affected,contact,phase,u,pitch,x,y,z,placement,lift,sensePhase,stance,clearance:y-groundAt(z,config.ground)-soleFloor};
}
export function samplePose(config,distance){
 const right=legSample(config,distance,'right'),left=legSample(config,distance,'left');
 const weak=1-config.power/100,phase=distance/strideFor(config)*Math.PI*2;
 const caneFoot=config.side==='right'?left:right;
 // Cane moves with affected leg; opposite hand is on the handle.
 const affected=config.side==='right'?right:left,caneContact=affected.contact;
 const sway=Math.sin(phase)*(.012+.018*weak)*(config.cane&&caneContact?.75:1);
 const hipY=.885+groundAt(distance,config.ground)+.009*Math.cos(phase*2);
 const caneSign=config.side==='right'?-1:1;
 const caneZ=affected.z+.09;
 const caneY=groundAt(caneZ,config.ground)+(caneContact?0:affected.lift*.75);
 return {distance,hip:{x:sway,y:hipY,z:distance},right,left,cane:{x:caneSign*.38,y:caneY,z:caneZ,contact:caneContact,side:caneFoot.side},lean:weak*.055*(config.side==='right'?1:-1),phase};
}
export function kneeBetween(hip,ankle,l1=.45,l2=.45){
 const d=ankle.map((v,i)=>v-hip[i]),dist=Math.hypot(...d),safe=clamp(dist,.001,l1+l2-.0001),dir=d.map(v=>v/dist);
 const along=(l1*l1-l2*l2+safe*safe)/(2*safe),height=Math.sqrt(Math.max(0,l1*l1-along*along));
 // Bend toward the walking direction (+Z) in the leg's sagittal plane.
 let bend=[-dir[0]*dir[2],-dir[1]*dir[2],1-dir[2]*dir[2]],bn=Math.hypot(...bend);
 if(bn<.001){bend=[0,1,0];bn=1;}
 return hip.map((v,i)=>v+dir[i]*along+bend[i]/bn*height);
}
