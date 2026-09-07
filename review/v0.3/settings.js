import {normalize,DETAIL_FIELDS,FEATURES} from './patterns.js';
const FORMAT='ippo-walking-settings';
const fail=()=>{throw new Error('Ver.0.3で保存した設定JSONを選んでください。');};
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function encodeSettings(config,cycles){
  return JSON.stringify({format:FORMAT,version:1,config:normalize(config),phase:((cycles%1)+1)%1},null,2);
}
export function decodeSettings(text){
  if(typeof text!=='string'||text.length>20000)fail();
  let data;try{data=JSON.parse(text);}catch{fail();}
  if(!object(data)||data.format!==FORMAT||data.version!==1||!object(data.config))fail();
  const c=data.config;
  if(!['preset','detail'].includes(c.mode)||!FEATURES.some(f=>f.id===c.feature)||
    !Number.isInteger(c.level)||c.level<0||c.level>3||!['left','right'].includes(c.side)||
    typeof c.cane!=='boolean'||!['affected','opposite'].includes(c.direction)||
    !['stance','swing'].includes(c.timing)||!object(c.detail))fail();
  for(const f of DETAIL_FIELDS){const n=c.detail[f.id];if(typeof n!=='number'||!Number.isFinite(n)||n<f.min||n>f.max)fail();}
  if(typeof data.phase!=='number'||!Number.isFinite(data.phase)||data.phase<0||data.phase>=1)fail();
  // Whitelist fields; never execute file contents or carry names/free text.
  return {config:normalize(c),cycles:data.phase};
}
