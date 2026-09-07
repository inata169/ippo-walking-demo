import {FEATURES,LEVELS,DETAIL_FIELDS,normalizeDetail,strideFor,periodFor,featureOf} from './patterns.js';
import {createState,changeConfig,saveA,toggleA,enterDetail,changeDetail} from './state.js';
import {encodeSettings,decodeSettings} from './settings.js';
const $=id=>document.getElementById(id),state=createState();
let scene,ready=false,frameId=null,lastTime=0,lastUI=0,stage='preset',detailInitialized=false;
const fields=new Map();
function announce(text){$('status').textContent=text;}
function pause(){state.running=false;state.stepTarget=null;playback();}
function playback(){$('play').textContent=state.running?'止まる':'歩く';$('play').setAttribute('aria-pressed',String(state.running));}
function updateUI(p){
  const n=Math.round((state.cycles%1)*100);
  $('phase').value=n;$('phase-value').textContent=n+'%';
  $('phase-label').textContent=p.support.label;$('distance').textContent=p.distance.toFixed(1)+' / 20 m';
  $('constraint-note').hidden=!p.constrained;
  for(const side of ['left','right']){
    $(side+'-bar').style.transform='scaleX('+p.support[side]+')';
    $(side+'-contact').textContent=p[side].contact?'接地中':'振り出し';
  }
  $('cane-contact').textContent=state.config.cane?'杖：'+(p.cane.contact?'接地中':'移動中')+'（'+(p.cane.side==='left'?'左':'右')+'手）':'杖：なし';
}
function draw(){if(scene)updateUI(scene.render(state.config,state.cycles));}
function sync(){
  const c=state.config,detail=stage==='detail';
  document.querySelectorAll('[data-feature]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.feature===c.feature)));
  document.querySelectorAll('[data-side]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.side===c.side)));
  $('preset-panel').hidden=detail;$('detail-panel').hidden=!detail;
  $('settings-title').textContent=detail?'② 自分に近づける':'① 大まかに選ぶ';
  $('mode-description').textContent=detail?'見た目を少しずつ調整します。複数の特徴を組み合わせられます。':'近い動きを選んでください。②から戻った場合、動きと詳細設定は保持されます。';
  $('level').value=c.level;$('level-value').textContent=LEVELS[c.level];
  for(const f of DETAIL_FIELDS){const el=fields.get(f.id);el.input.value=c.detail[f.id];el.output.textContent=c.detail[f.id]+f.unit;}
  $('cane').checked=c.cane;$('direction').value=c.direction;$('timing').value=c.timing;
  $('trunk-options').hidden=c.mode==='detail'?c.detail.trunkLean===0:c.feature!=='trunkLean';
  $('hint').textContent=c.mode==='detail'?'ひとつずつ調整し、同じ瞬間・同じ向きでA/Bを見比べてください。似ていない点は専門職との相談に役立ちます。':featureOf(c).hint;
  $('side-label').textContent=(c.side==='right'?'右':'左')+'側をオレンジで表示';
  for(const side of ['left','right']){
    $(side+'-bar').classList.toggle('affected',side===c.side);
    $(side+'-label').textContent=(side==='left'?'左':'右')+'足'+(side===c.side?' ●':'');
  }
  $('toggle-a').disabled=!state.a;$('toggle-a').textContent=state.viewingA?'条件Bへ戻る':'Aと見比べる';
  $('compare-label').textContent=state.viewingA?'保存した条件Aを表示中です。':state.a?'条件Aを保存済み。現在の条件Bと比較できます。':'条件Aは未保存です。';
  playback();draw();
}
function change(patch){changeConfig(state,patch);sync();}
function choosePreset(patch){
  if(detailInitialized&&!window.confirm('詳細調整を初期化して、選び直しますか？'))return;
  detailInitialized=false;
  change({...patch,mode:'preset',detail:normalizeDetail({})});
}
function setPhase(n){pause();state.cycles=Math.floor(state.cycles)+Math.max(0,Math.min(99.999999,n))/100;draw();}
function reset(){pause();state.cycles=0;draw();announce('出発点へ戻りました。');}
function view(name){
  scene?.view(name,state.config,state.cycles*strideFor(state.config));
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));
}
function buildControls(){
  for(const f of FEATURES){
    const b=document.createElement('button');b.textContent=f.label;b.dataset.feature=f.id;
    b.onclick=()=>choosePreset({feature:f.id});$('features').append(b);
  }
  for(const f of DETAIL_FIELDS){
    const box=document.createElement('div');box.className='detail-field';
    const label=document.createElement('label');label.htmlFor='detail-'+f.id;label.textContent=f.label;
    const output=document.createElement('output');label.append(output);
    const row=document.createElement('div');row.className='slider';
    const input=document.createElement('input');input.type='range';input.id=label.htmlFor;
    Object.assign(input,{min:f.min,max:f.max,step:f.step});
    const edit=n=>{changeDetail(state,f.id,n);detailInitialized=true;sync();};
    input.oninput=()=>edit(Number(input.value));
    for(const sign of [-1,1]){
      const button=document.createElement('button');button.textContent=sign<0?'−':'＋';
      button.setAttribute('aria-label',f.label+(sign<0?'を減らす':'を増やす'));
      button.onclick=()=>edit(state.config.detail[f.id]+sign*f.step);
      row.append(button);if(sign<0)row.append(input);
    }
    const hint=document.createElement('p');hint.className='meta';hint.id='hint-'+f.id;hint.textContent=f.hint;
    input.setAttribute('aria-describedby',hint.id);box.append(label,row,hint);$('detail-fields').append(box);
    fields.set(f.id,{input,output});
  }
}
function bind(){
  $('enter-detail').onclick=()=>{
    if(detailInitialized)changeConfig(state,{mode:'detail'});else enterDetail(state);
    detailInitialized=true;stage='detail';sync();$('settings-title').focus();
  };
  $('back-preset').onclick=()=>{pause();stage='preset';sync();$('settings-title').focus();};
  $('play').onclick=()=>{if(!ready)return;if(state.cycles*strideFor(state.config)>=20)reset();state.running=!state.running;state.stepTarget=null;playback();};
  $('step').onclick=()=>{if(!ready)return;if(state.cycles*strideFor(state.config)>=20)reset();state.stepTarget=state.cycles+0.5;state.running=true;playback();};
  $('reset').onclick=reset;$('slow').onchange=e=>{state.slow=e.target.checked;};
  $('phase').oninput=e=>setPhase(Number(e.target.value));
  $('phase-minus').onclick=()=>setPhase(Number($('phase').value)-5);$('phase-plus').onclick=()=>setPhase(Number($('phase').value)+5);
  $('level').oninput=e=>choosePreset({level:Number(e.target.value)});
  $('level-minus').onclick=()=>choosePreset({level:state.config.level-1});$('level-plus').onclick=()=>choosePreset({level:state.config.level+1});
  $('cane').onchange=e=>change({cane:e.target.checked});
  $('direction').onchange=e=>change({direction:e.target.value});$('timing').onchange=e=>change({timing:e.target.value});
  document.querySelectorAll('[data-side]').forEach(b=>b.onclick=()=>change({side:b.dataset.side}));
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
  $('recommended-view').onclick=()=>view(featureOf(state.config).view);
  $('zoom-in').onclick=()=>scene?.zoom(0.84);$('zoom-out').onclick=()=>scene?.zoom(1.19);
  $('show-support').onchange=e=>{$('support').hidden=!e.target.checked;};
  $('save-a').onclick=()=>{pause();saveA(state);sync();};
  $('toggle-a').onclick=()=>{toggleA(state);stage=state.config.mode;detailInitialized=stage==='detail';sync();};
  $('world').onkeydown=e=>{if(e.code==='Space'){e.preventDefault();$('play').click();}if(e.code==='Escape')pause();};
  $('export-settings').onclick=()=>{
    pause();const blob=new Blob([encodeSettings(state.config,state.cycles)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ippo-v03-settings.json';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    $('file-status').textContent='設定ファイルの保存を開始しました。ダウンロード先を確認してください。';
  };
  $('import-settings').onclick=()=>{pause();$('settings-file').click();};
  $('settings-file').onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    try{
      if(file.size>20000)throw Error('設定ファイルが大きすぎます（上限20 KB）。');
      const data=decodeSettings(await file.text());
      if(!window.confirm('現在の設定とA/B比較を置き換えます。読み込みますか？'))return;
      pause();state.config=data.config;state.cycles=data.cycles;state.a=null;state.b=null;state.viewingA=false;
      stage=state.config.mode;detailInitialized=stage==='detail';sync();
      $('file-status').textContent='設定を読み込みました。停止した状態で表示しています。';
    }catch(error){$('file-status').textContent='読み込めませんでした。'+error.message;}
    finally{e.target.value='';}
  };
  document.addEventListener('visibilitychange',()=>{
    pause();if(document.hidden){cancelAnimationFrame(frameId);frameId=null;}
    else{lastTime=0;if(ready&&frameId===null)frameId=requestAnimationFrame(frame);}
  });
}
function frame(t){
  frameId=null;if(document.hidden||!ready)return;
  const dt=lastTime?Math.min((t-lastTime)/1000,0.05):0;lastTime=t;
  if(state.running){
    state.cycles+=dt/periodFor(state.config)*(state.slow?0.3:1);
    if(state.stepTarget!==null&&state.cycles>=state.stepTarget){state.cycles=state.stepTarget;pause();}
    if(state.cycles*strideFor(state.config)>=20){state.cycles=20/strideFor(state.config);pause();announce('20 mに到着しました。');}
    playback();
  }
  const p=scene.render(state.config,state.cycles);if(t-lastUI>80){updateUI(p);lastUI=t;}
  frameId=requestAnimationFrame(frame);
}
export async function start(){
  buildControls();bind();sync();
  const {createScene}=await import('./scene.js');scene=createScene($('world'),state.config);draw();
  ready=true;$('play').disabled=false;$('step').disabled=false;
  scene.controls.addEventListener('start',()=>document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false')));
  frameId=requestAnimationFrame(frame);
}
