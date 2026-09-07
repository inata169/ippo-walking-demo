import {DEFAULT,normalize,fromPreset} from './patterns.js';
export function createState() {return {config:normalize(DEFAULT),cycles:0,running:false,slow:false,a:null,b:null,viewingA:false,stepTarget:null};}
export function changeConfig(s,patch) {
  s.running=false;s.stepTarget=null;
  if(s.viewingA){s.config={...s.b};s.viewingA=false;}
  s.config=normalize({...s.config,...patch});
}
export function saveA(s){s.a={...s.config};s.viewingA=false;s.b=null;}
export function toggleA(s){
  if(!s.a)return;
  s.running=false;s.stepTarget=null;
  if(s.viewingA){s.config={...s.b};s.viewingA=false;}
  else{s.b={...s.config};s.config={...s.a};s.viewingA=true;}
}
export function enterDetail(s){
  const c=s.config;
  changeConfig(s,{...c,mode:'detail',detail:c.mode==='detail'?c.detail:fromPreset(c)});
}
export function changeDetail(s,id,value){
  changeConfig(s,{mode:'detail',detail:{...s.config.detail,[id]:value}});
}
