import assert from 'node:assert/strict';
import {DEFAULT,DETAIL_FIELDS,normalize,periodFor,strideFor,PARAMETERS as P} from './patterns.js';
import {createState,enterDetail,changeDetail,saveA,toggleA} from './state.js';
import {samplePose} from './gait.js';
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
console.log('PASS: preset -> detail, A/B independence, JSON round-trip/rejection, independent cadence, '+poses+' representative poses.');
