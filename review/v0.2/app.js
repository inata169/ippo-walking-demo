import {FEATURES,LEVELS,PARAMETERS,featureOf} from './patterns.js';
import {samplePose} from './gait.js';
import {createState,changeConfig,saveA,toggleA} from './state.js';
window.__ippoStarted=true;
const $=id=>document.getElementById(id),state=createState();
let scene,ready=false,frameId=null,lastTime=0,lastUI=0;
for(const f of FEATURES){const b=document.createElement('button');b.textContent=f.label;b.dataset.feature=f.id;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>change({feature:f.id}));$('features').append(b);}
function announce(t){$('status').textContent=t;}
function sync(){
  document.querySelectorAll('[data-feature]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.feature===state.config.feature)));
  document.querySelectorAll('[data-side]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.side===state.config.side)));
  $('level').value=state.config.level;$('level-value').textContent=LEVELS[state.config.level];$('cane').checked=state.config.cane;
  $('direction').value=state.config.direction;$('timing').value=state.config.timing;
  $('trunk-options').hidden=state.config.feature!=='trunkLean';$('hint').textContent=featureOf(state.config).hint;
  $('side-label').textContent=`${state.config.side==='right'?'右':'左'}側をオレンジで表示`;
  for(const side of ['left','right']){$(`${side}-bar`).classList.toggle('affected',side===state.config.side);$(`${side}-label`).textContent=`${side==='left'?'左':'右'}足${side===state.config.side?' ●':''}`;}
  $('toggle-a').disabled=!state.a;$('toggle-a').textContent=state.viewingA?'条件Bへ戻る':'Aと見比べる';
  $('compare-label').textContent=state.viewingA?`条件A：${featureOf(state.a).label}（${LEVELS[state.a.level]}）`:state.a?'条件Aを保存済み。現在の条件Bと比較できます。':'条件Aは未保存です。';
  syncPlayback();draw();
}
function syncPlayback(){$('play').textContent=state.running?'止まる':'歩く';$('play').setAttribute('aria-pressed',String(state.running));}
function draw(){const pose=scene?scene.render(state.config,state.cycles):samplePose(state.config,state.cycles);updateUI(pose);}
function updateUI(p){
  const fraction=state.cycles-Math.floor(state.cycles);$('phase').value=Math.round(fraction*100);$('phase-value').textContent=`${Math.round(fraction*100)}%`;
  $('phase-label').textContent=p.support.label;$('distance').textContent=`${p.distance.toFixed(1)} / 20 m`;
  for(const side of ['left','right']){$(`${side}-bar`).style.transform=`scaleX(${p.support[side]})`;$(`${side}-contact`).textContent=p[side].contact?'接地中':'振り出し';}
  $('cane-contact').textContent=state.config.cane?`杖：${p.cane.contact?'接地中':'移動中'}（${p.cane.side==='left'?'左':'右'}手）`:'杖：なし';
}
function change(patch){changeConfig(state,patch);sync();}
function setPhase(percent){state.running=false;state.stepTarget=null;state.cycles=Math.floor(state.cycles)+Math.max(0,Math.min(100,percent))/100;syncPlayback();draw();}
function reset(){state.cycles=0;state.running=false;state.stepTarget=null;syncPlayback();draw();announce('出発点へ戻りました。');}
$('play').onclick=()=>{if(!ready)return;if(state.cycles*PARAMETERS.stride>=20)reset();state.running=!state.running;state.stepTarget=null;syncPlayback();};
$('step').onclick=()=>{if(!ready)return;if(state.cycles*PARAMETERS.stride>=20)reset();state.stepTarget=state.cycles+0.5;state.running=true;syncPlayback();};
$('reset').onclick=reset;$('slow').onchange=e=>{state.slow=e.target.checked;};
$('phase').oninput=e=>setPhase(Number(e.target.value));
$('phase-minus').onclick=()=>setPhase(Number($('phase').value)-5);$('phase-plus').onclick=()=>setPhase(Number($('phase').value)+5);
$('level').oninput=e=>change({level:Number(e.target.value)});$('level-minus').onclick=()=>change({level:state.config.level-1});$('level-plus').onclick=()=>change({level:state.config.level+1});
$('cane').onchange=e=>change({cane:e.target.checked});$('direction').onchange=e=>change({direction:e.target.value});$('timing').onchange=e=>change({timing:e.target.value});
document.querySelectorAll('[data-side]').forEach(b=>b.onclick=()=>change({side:b.dataset.side}));
function view(name){scene?.view(name,state.config,state.cycles*PARAMETERS.stride);document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));$('recommended-view').onclick=()=>view(featureOf(state.config).view);
$('zoom-in').onclick=()=>scene?.zoom(0.84);$('zoom-out').onclick=()=>scene?.zoom(1.19);
$('show-support').onchange=e=>{$('support').hidden=!e.target.checked;};
$('save-a').onclick=()=>{saveA(state);sync();};$('toggle-a').onclick=()=>{toggleA(state);sync();};
$('world').onkeydown=e=>{if(e.code==='Space'){e.preventDefault();$('play').click();}if(e.code==='Escape'){state.running=false;syncPlayback();}};
function frame(t){
  frameId=null;if(document.hidden||!ready)return;
  const dt=lastTime?Math.min((t-lastTime)/1000,0.05):0;lastTime=t;
  if(state.running){state.cycles+=dt/PARAMETERS.period*(state.slow?0.3:1);if(state.stepTarget!==null&&state.cycles>=state.stepTarget){state.cycles=state.stepTarget;state.stepTarget=null;state.running=false;}if(state.cycles*PARAMETERS.stride>=20){state.cycles=20/PARAMETERS.stride;state.running=false;announce('20 mに到着しました。');}syncPlayback();}
  const p=scene.render(state.config,state.cycles);if(t-lastUI>80){updateUI(p);lastUI=t;}
  frameId=requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{state.running=false;syncPlayback();if(document.hidden){cancelAnimationFrame(frameId);frameId=null;}else{lastTime=0;if(ready&&frameId===null)frameId=requestAnimationFrame(frame);}});
sync();
try{const {createScene}=await import('./scene.js');scene=createScene($('world'),state.config);ready=true;$('loading').hidden=true;$('play').disabled=false;$('step').disabled=false;scene.controls.addEventListener('start',()=>document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false')));draw();frameId=requestAnimationFrame(frame);}
catch(error){$('loading').textContent='3Dを開始できませんでした。EdgeまたはChromeで再読み込みしてください。';$('loading').classList.add('error');console.error(error);}
