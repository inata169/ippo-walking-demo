import {DEFAULT,PRESETS,strideFor,speedFor} from './gait.js';
const $=id=>document.getElementById(id),all=s=>Array.from(document.querySelectorAll(s));
let config={...DEFAULT},distance=0,running=false,ready=false,slow=false,stepTarget=null,savedA=null,currentB=null,viewingA=false,currentView='angle',scene,lastTime=0,lastUI=0;
const playIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4 21 12 7 20Z" fill="currentColor"/></svg>';
const pauseIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM15 4h4v16h-4z" fill="currentColor"/></svg>';
function announce(text){$('announcement').textContent=text;}
function setRunning(v){running=v&&ready;$('play').innerHTML=(running?pauseIcon:playIcon)+`<span>${running?'止まる':'歩く'}</span>`;$('play').setAttribute('aria-pressed',String(running));}
function reset(){setRunning(false);distance=0;stepTarget=null;$('distance').textContent='0.0';$('finish').hidden=true;if(scene){scene.render(config,0);scene.view(currentView,config,0);}}
function mark(group,key){all(`[data-${group}]`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[group]===key)));}
function sync(){for(const key of ['power','stiffness','sensation']){$(key).value=config[key];$(`${key}-value`).value=config[key];}
 $('cane').checked=config.cane;for(const k of ['side','ground','speed'])mark(k,config[k]);
 const preset=Object.keys(PRESETS).find(k=>['power','stiffness','sensation'].every(p=>config[p]===PRESETS[k][p]));mark('preset',preset);
 $('side-name').textContent=config.side==='right'?'右側':'左側';$('ground-name').textContent=config.ground==='flat'?'平らな道':'ゆるい上り坂';
 ['left','right'].forEach(s=>$(`foot-${s}`).classList.toggle('affected',s===config.side));
 $('compare-label').textContent=viewingA?'保存した条件Aを表示中':'同じ道で、見比べる';$('toggle-a').textContent=viewingA?'変更した条件Bへ':'Aと見比べる';$('toggle-a').disabled=!savedA;
 $('compare-description').textContent=viewingA?'条件Bに戻すと、変更後の歩き方を見られます。':savedA?'条件を変えてから「Aと見比べる」を押してください。':'条件を残してから、杖などを変えてみましょう。';
 updateHint();
}
function change(patch){if(viewingA){currentB=null;viewingA=false;}config={...config,...patch};reset();sync();}
function updateHint(){let text='つま先の高さと、杖をつくタイミングを見比べてみましょう。';
 if(config.ground==='slope')text='横から見て、坂に合わせた足の接地を観察しましょう。このデモでは傾斜に合わせて足の位置を調整しています。';
 else if(config.sensation<45)text='「感じ取り方のイメージ」をオンにすると、接地情報が曖昧になる表現を見られます。筋力は変わりません。';
 else if(config.stiffness>=60)text='「横」と「前」を切り替えて、膝の曲がり方と脚を外へ回す動きを見てみましょう。動きは説明用の近似です。';
 else if(!config.cane)text='今の条件をAに保存して、杖をオンにしてみましょう。手と杖、足のタイミングを同じ場所で見比べられます。';
 else if(config.power<=45)text='足元のカメラとスロー再生で、振り出す足のつま先が地面に近づく場面を見てみましょう。';
 else if(config.speed==='slow')text='ゆっくり歩く動きを観察しています。「スロー再生」は動きの観察用で、身体の設定を変えません。';
 $('hint').textContent=text;
}
function updateFeet(p){const perceived=$('sense-view').checked;for(const side of ['left','right']){const s=p[side],svg=$(`foot-${side}`),phase=perceived?s.sensePhase:s.phase,contact=phase<s.stance,amount=perceived&&s.affected?config.sensation/100:1;const u=phase/s.stance;
 const fore=contact?(u<.22?.38:1):.10,heel=contact?(u>.82?.38:1):.10;
 svg.querySelector('.forefoot').style.opacity=String(.1+fore*.85*amount);svg.querySelector('.heel').style.opacity=String(.1+heel*.85*amount);
 const caption=perceived&&s.affected&&config.sensation<45?'情報が曖昧':contact?'接地':'振り出し';$(`contact-${side}`).textContent=caption;svg.setAttribute('aria-label',`${side==='left'?'左':'右'}足：${caption}`);
 }$('cane-status').textContent=config.cane?`杖：${p.cane.contact?'接地':'移動中'}`:'杖：なし';}
$('play').addEventListener('click',()=>{if(distance>=20)reset();stepTarget=null;setRunning(!running);});
$('reset').addEventListener('click',()=>{reset();announce('出発点に戻りました。');});
$('finish-reset').addEventListener('click',()=>{reset();setRunning(true);});
$('step').addEventListener('click',()=>{if(!ready)return;if(distance>=20)reset();stepTarget=Math.min(20,distance+strideFor(config)/2);setRunning(true);});
$('slow').addEventListener('change',e=>{slow=e.target.checked;});
for(const key of ['power','stiffness','sensation'])$(key).addEventListener('input',e=>change({[key]:Number(e.target.value)}));
$('cane').addEventListener('change',e=>change({cane:e.target.checked}));
for(const key of ['side','ground','speed'])all(`[data-${key}]`).forEach(b=>b.addEventListener('click',()=>change({[key]:b.dataset[key]})));
all('[data-preset]').forEach(b=>b.addEventListener('click',()=>{change(PRESETS[b.dataset.preset]);announce(`${b.textContent}の架空設定に変えました。`);}));
all('[data-view]').forEach(b=>b.addEventListener('click',()=>{currentView=b.dataset.view;mark('view',currentView);scene?.view(currentView,config,distance);}));
$('zoom-in').addEventListener('click',()=>scene?.zoom(.84));$('zoom-out').addEventListener('click',()=>scene?.zoom(1.19));
$('sense-view').addEventListener('change',e=>{$('sense-caption').textContent=e.target.checked?'接地情報の曖昧さ・遅れを色で表現します。実際の感じ方には個人差があります。':'色の濃い部分が接地の目安です。足底圧の実測ではありません。';});
$('save-a').addEventListener('click',()=>{savedA={...config};viewingA=false;currentB=null;sync();announce('今の身体設定、杖、地面、速さを条件Aに保存しました。');});
$('toggle-a').addEventListener('click',()=>{if(!savedA)return;if(viewingA){config={...currentB};viewingA=false;}else{currentB={...config};config={...savedA};viewingA=true;}reset();sync();announce(viewingA?'条件Aを表示しています。':'条件Bに戻りました。');});
$('hand-layout').addEventListener('click',e=>{const left=$('workspace').classList.toggle('left-controls');e.currentTarget.textContent=left?'操作を右側へ':'操作を左側へ';e.currentTarget.setAttribute('aria-pressed',String(left));});
$('world').addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();$('play').click();}if(e.code==='Escape'){setRunning(false);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)setRunning(false);});
sync();
try{const {createScene}=await import('./scene.js');scene=createScene($('world'),config);scene.render(config,0);ready=true;$('load-message').hidden=true;$('play').disabled=false;scene.controls.addEventListener('start',()=>{mark('view',null);});
 function frame(time){const delta=lastTime?Math.min((time-lastTime)/1000,.05):0;lastTime=time;if(running){distance=Math.min(20,distance+delta*speedFor(config)*(slow?.35:1));if(stepTarget!==null&&distance>=stepTarget){distance=stepTarget;stepTarget=null;setRunning(false);}if(distance>=20){setRunning(false);$('finish').hidden=false;announce('20メートル、到着しました。');}}
  const pose=scene.render(config,distance);if(time-lastUI>90){$('distance').textContent=distance.toFixed(1);updateFeet(pose);lastUI=time;}requestAnimationFrame(frame);}
 requestAnimationFrame(frame);
}catch(error){ready=false;setRunning(false);$('play').disabled=true;$('step').disabled=true;$('load-message').textContent='3Dを開始できませんでした。ページを再読み込みしてください。改善しない場合は、WebGL 2対応のブラウザで開いてください。';console.error('3D initialization failed',error);}
