import assert from 'node:assert/strict';
import {DEFAULT,DETAIL_FIELDS,normalize,periodFor,strideFor,PARAMETERS as P} from './patterns.js';
import {createState,enterDetail,changeDetail,saveA,toggleA} from './state.js';
import {samplePose,caneElbowBetween} from './gait.js';
import {encodeSettings,decodeSettings} from './settings.js';
import {OBSERVATION_PHASES,cycleAtPhase,phaseById} from './phases.js';

assert.equal(OBSERVATION_PHASES.length,6);
assert.equal(new Set(OBSERVATION_PHASES.map(p=>p.id)).size,6);
assert.ok(OBSERVATION_PHASES.every((p,i,a)=>p.position>=0&&p.position<1&&(!i||p.position>a[i-1].position)));
for(const p of OBSERVATION_PHASES){
  assert.equal(phaseById(p.id),p);
  assert.ok(Math.abs(cycleAtPhase(2.47,p.id)-(2+p.position))<1e-10);
  for(const side of ['left','right']){
    const pose=samplePose(normalize({...DEFAULT,side}),p.position);
    assert.ok(Math.abs(pose[side].phase-p.position)<1e-10);
  }
}
assert.throws(()=>cycleAtPhase(0,'unknown'));

for(const affectedSide of ['left','right']){
  const pose=samplePose(normalize({...DEFAULT,side:affectedSide,cane:true}),0.31);
  assert.ok(pose.right.x<0&&pose.left.x>0,'anatomical right must be -X and left +X');
  assert.ok(pose.right.hip[0]<pose.left.hip[0]);
  assert.equal(pose.cane.side,affectedSide==='right'?'left':'right');
  assert.equal(Math.sign(pose.cane.x),affectedSide==='right'?1:-1);
}
const shoulder=[-0.205,1.255,0],caneHand=[-0.38,0.77,0.08];
const caneElbow=caneElbowBetween(shoulder,caneHand);
assert.ok(caneElbow[2]<(shoulder[2]+caneHand[2])/2,'cane elbow must flex posteriorly');
assert.ok(Math.abs(Math.hypot(...caneElbow.map((v,i)=>v-shoulder[i]))-0.29)<1e-10);
assert.ok(Math.abs(Math.hypot(...caneElbow.map((v,i)=>v-caneHand[i]))-0.28)<1e-10);

const s=createState();s.cycles=0.37;enterDetail(s);
assert.equal(s.config.mode,'detail');
assert.equal(s.config.detail.circumduction,65);
assert.equal(s.config.detail.hipHiking,0);
saveA(s);changeDetail(s,'hipHiking',50);
assert.equal(s.a.detail.hipHiking,0);
toggleA(s);assert.equal(s.config.detail.hipHiking,0);
toggleA(s);assert.equal(s.config.detail.hipHiking,50);assert.equal(s.cycles,0.37);
s.observationPhase='midSwing';toggleA(s);assert.equal(s.observationPhase,'midSwing');toggleA(s);
const decoded=decodeSettings(encodeSettings(s.config,s.cycles));
assert.deepEqual(decoded.config,s.config);assert.ok(Math.abs(decoded.cycles-s.cycles)<1e-10);
assert.throws(()=>decodeSettings('not json'));
assert.throws(()=>decodeSettings(encodeSettings(s.config,0).replace('"version": 1','"version": 99')));
const invalid=JSON.parse(encodeSettings(s.config,0));invalid.config.detail.cadence=999;
assert.throws(()=>decodeSettings(JSON.stringify(invalid)));
const extra=JSON.parse(encodeSettings(s.config,0));extra.config.patientName='not retained';
assert.equal(decodeSettings(JSON.stringify(extra)).config.patientName,undefined);

const all=Object.fromEntries(DETAIL_FIELDS.map(f=>[f.id,f.max]));
const configurations=[normalize(DEFAULT),s.config,...['left','right'].map(side=>normalize({...DEFAULT,mode:'detail',side,detail:all}))];
let poses=0;
for(const config of configurations)for(let i=0;i<16;i++){
  const p=samplePose(config,i/16);poses++;
  assert.ok(Math.abs(p.support.left+p.support.right-1)<1e-10);
  for(const side of ['left','right']){
    const l=p[side];assert.ok(l.contact||p.support[side]===0);
    assert.ok([l.x,l.y,l.z,l.roll,...l.hip,...l.knee].every(Number.isFinite));
    assert.ok(Math.abs(Math.hypot(...l.knee.map((v,j)=>v-l.hip[j]))-P.legLength)<1e-5);
    assert.ok(Math.abs(Math.hypot(...l.knee.map((v,j)=>v-[l.x,l.y,l.z][j]))-P.legLength)<1e-5);
    assert.ok(l.y-(0.063+0.203*Math.abs(Math.sin(l.pitch))+0.075*Math.abs(Math.sin(l.roll)))>=-1e-8);
  }
}
const faster=normalize({...s.config,detail:{...s.config.detail,cadence:80}});
assert.equal(strideFor(faster),strideFor(s.config));assert.ok(periodFor(faster)<periodFor(s.config));
console.log('PASS: preset -> detail, A/B independence, JSON round-trip/rejection, independent cadence, anatomical laterality, cane-elbow flexion, '+poses+' representative poses.');

// Regressions for the reported controls: measure rendered joint geometry,
// not only the intended coefficients.
for(const side of ['left','right']){
  let previousAngle=Infinity,previousClearance=Infinity,previousPitch=-Infinity,previousStance=Infinity;
  for(const amount of [0,10,20,50,100]){
    const detail=normalize({...DEFAULT,side,mode:'detail',detail:{kneeHyperextension:amount}});
    const knee=samplePose(detail,.31)[side];
    assert.ok(knee.kneeAngle<previousAngle-0.001,'knee must change across the full slider');previousAngle=knee.kneeAngle;
    if(amount===10)assert.ok(knee.kneeAngle>0,'10 must not suddenly hyperextend');
    const toe=samplePose({...detail,detail:{toeClearance:amount}},.81)[side];
    assert.ok(toe.pitch>previousPitch,'toe angle must increase');previousPitch=toe.pitch;
    assert.ok(toe.soleClearance<previousClearance,'sole clearance must decrease');previousClearance=toe.soleClearance;
    const config={...detail,detail:{reducedSupport:amount}};
    const pose=samplePose(config,.2);
    assert.ok(pose[side].stance<previousStance);previousStance=pose[side].stance;
    const off=cycleAtPhase(0,'footOff',config);
    assert.ok(!samplePose(config,off)[side].contact,'foot off must follow configured stance');
    assert.ok(samplePose(config,off-1e-6)[side].contact);
  }
}
let geometrySamples=0,maxKneeStep=0;
for(const side of ['left','right'])for(const amount of [0,10,20,50,100]){
  const config=normalize({...DEFAULT,side,mode:'detail',detail:{kneeHyperextension:amount,toeClearance:amount,reducedSupport:amount,hipHiking:amount,footRoll:amount,stepLength:40}});
  let previous=samplePose(config,-.001);
  for(let i=0;i<=1000;i++){
    const pose=samplePose(config,i/1000);geometrySamples++;
    assert.ok(pose.left.contact||pose.right.contact,'walking must not develop a flight phase');
    for(const s of ['left','right']){
      const l=pose[s],before=previous[s];
      for(const point of [l.hip,[l.x,l.y,l.z]])assert.ok(Math.abs(Math.hypot(...l.knee.map((v,j)=>v-point[j]))-P.legLength)<1e-6);
      assert.ok(l.soleClearance>=-1e-8,'shoe must stay above ground');
      const jump=Math.hypot(...l.knee.map((v,j)=>v-before.knee[j]));maxKneeStep=Math.max(maxKneeStep,jump);
      assert.ok(jump<.035,'no discontinuous knee flip');
      if(l.contact&&before.contact&&l.phase>before.phase){assert.ok(Math.abs(l.x-before.x)<1e-10);assert.ok(Math.abs(l.z-before.z)<1e-10);}
    }
    previous=pose;
  }
}
console.log(`PASS: graded controls, adaptive phases, ${geometrySamples} geometry samples; maximum knee movement per 0.1% cycle: ${(maxKneeStep*1000).toFixed(1)} mm.`);

// Neutral walking must not jerk at load acceptance (10% / 60%), or when
// the swinging foot crosses horizontal. Finite differences are per cycle,
// not clinical acceleration thresholds. Test finer steps to catch IK cusps.
const neutral={mode:'detail',detail:{}};
let peakHipSpeed=0,peakHipAcceleration=0,peakKneeAcceleration=0;
for(const dt of [0.0002,0.0001])for(let i=0;i<2000;i++){
  const t=i/2000,a=samplePose(neutral,t-dt),p=samplePose(neutral,t),b=samplePose(neutral,t+dt);
  for(const side of ['left','right']){
    const acceleration=Math.hypot(...p[side].knee.map((v,j)=>(a[side].knee[j]-2*v+b[side].knee[j])/(dt*dt)));
    peakKneeAcceleration=Math.max(peakKneeAcceleration,acceleration);
    assert.ok(acceleration<100,'neutral knee trajectory must not develop a velocity cusp');
  }
  if((t>=.05&&t<=.15)||(t>=.55&&t<=.65)){
    const speed=Math.abs((b.hip.y-a.hip.y)/(2*dt));
    const acceleration=Math.abs((b.hip.y-2*p.hip.y+a.hip.y)/(dt*dt));
    peakHipSpeed=Math.max(peakHipSpeed,speed);peakHipAcceleration=Math.max(peakHipAcceleration,acceleration);
    assert.ok(speed<.15,'load acceptance must not abruptly drop the pelvis');
    assert.ok(acceleration<3,'load acceptance pelvis acceleration must remain gradual');
  }
}
console.log('PASS: neutral gait continuity at two step sizes', {peakHipSpeed,peakHipAcceleration,peakKneeAcceleration});
