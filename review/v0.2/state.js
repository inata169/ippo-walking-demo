import {DEFAULT,normalize} from './patterns.js';
export function createState() {return {config:{...DEFAULT},cycles:0,running:false,slow:false,a:null,b:null,viewingA:false,stepTarget:null};}
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
