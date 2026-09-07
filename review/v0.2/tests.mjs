import assert from 'node:assert/strict';
import {FEATURES,DEFAULT,PARAMETERS as P} from './patterns.js';
import {samplePose} from './gait.js';
import {createState,changeConfig,saveA,toggleA} from './state.js';
let count=0;
for(const f of FEATURES)for(const level of [0,3])for(const side of ['left','right']) {
  const config={...DEFAULT,feature:f.id,level,side};
  let prev=null;
  for(let i=0;i<=100;i++){
    const p=samplePose(config,i/100);
    assert.ok(Math.abs(p.support.left+p.support.right-1)<1e-10);
    for(const s of ['left','right']){
      const l=p[s];assert.ok(l.contact||p.support[s]===0);
      assert.ok([l.x,l.y,l.z,...l.knee,...l.hip].every(Number.isFinite));
      assert.ok(Math.abs(Math.hypot(...l.knee.map((v,j)=>v-l.hip[j]))-P.legLength)<1e-5);
      assert.ok(Math.abs(Math.hypot(...l.knee.map((v,j)=>v-[l.x,l.y,l.z][j]))-P.legLength)<1e-5);
      // Conservative lower bound for sole and toe geometry.
      assert.ok(l.y-(0.063*Math.cos(l.pitch)+0.195*Math.sin(l.pitch))>=-1e-5);
      if(prev&&l.contact&&prev[s].contact&&l.phase>prev[s].phase)assert.ok(Math.abs(l.z-prev[s].z)<1e-10);
    }
    prev=p;count++;
  }
}
const s=createState();s.cycles=0.37;saveA(s);changeConfig(s,{feature:'hipHiking'});toggleA(s);assert.equal(s.config.feature,'circumduction');assert.equal(s.cycles,0.37);toggleA(s);assert.equal(s.config.feature,'hipHiking');
console.log(`PASS: ${count} poses; support, fixed leg lengths, foot clearance, planted feet, A/B phase preservation`);
