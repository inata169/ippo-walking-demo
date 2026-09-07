import * as THREE from 'three';
import {OrbitControls} from '../../assets/OrbitControls.js';
import {samplePose,groundAt,kneeBetween} from './gait.js';
const V=(x,y,z)=>new THREE.Vector3(x,y,z),up=V(0,1,0);
const material=(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness});
export function buildAvatar(scene){
 const ivory=material('#e9e6df'),orange=material('#f58934'),navy=material('#243957'),jointMat=material('#b9b9b7'),shoeMat=material('#f6f7f6'),soleMat=material('#657586'),metal=material('#364853',.45);
 const meshes=[];
 function mesh(geometry,mat){const m=new THREE.Mesh(geometry,mat);m.castShadow=true;m.receiveShadow=true;scene.add(m);meshes.push(m);return m;}
 function sphere(radius,mat){return mesh(new THREE.SphereGeometry(radius,20,14),mat);}
 function link(radius1,radius2,mat){return mesh(new THREE.CylinderGeometry(radius1,radius2,1,18),mat);}
 function orient(m,a,b){const d=b.clone().sub(a);m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=d.length();m.quaternion.setFromUnitVectors(up,d.normalize());}
 const pelvis=mesh(new THREE.SphereGeometry(1,24,16),navy);pelvis.scale.set(.17,.13,.13);
 const torso=mesh(new THREE.CylinderGeometry(.185,.145,.40,24),ivory);torso.scale.z=.72;
 const neck=link(.051,.060,ivory),head=sphere(1,ivory);head.scale.set(.103,.145,.108);
 const nose=sphere(.025,ivory);nose.scale.set(.75,.8,1.2);
 const legs={},arms={};
 for(const side of ['right','left']){
   const thigh=link(.083,.065,navy),shin=link(.063,.045,ivory),knee=sphere(.064,jointMat),ankle=sphere(.043,ivory);
   const foot=new THREE.Group();scene.add(foot);meshes.push(foot);
   const shoe=new THREE.Mesh(new THREE.BoxGeometry(.139,.074,.26),shoeMat);shoe.position.set(0,-.018,.026);shoe.castShadow=true;shoe.receiveShadow=true;foot.add(shoe);
   const toe=new THREE.Mesh(new THREE.SphereGeometry(1,20,12),shoeMat);toe.scale.set(.070,.043,.078);toe.position.set(0,-.015,.125);toe.castShadow=true;foot.add(toe);
   const sole=new THREE.Mesh(new THREE.BoxGeometry(.145,.016,.28),soleMat);sole.position.set(0,-.055,.035);sole.castShadow=true;foot.add(sole);
   legs[side]={thigh,shin,knee,ankle,foot};
   arms[side]={upper:link(.059,.044,ivory),lower:link(.042,.032,ivory),elbow:sphere(.043,jointMat),hand:sphere(.044,ivory),shoulder:sphere(.06,ivory)};
 }
 const cane={shaft:link(.012,.014,metal),handle:link(.022,.022,metal),tip:sphere(.023,metal)};
 function update(p,c){
   const h=V(p.hip.x,p.hip.y,p.hip.z),lean=p.lean;
   pelvis.position.copy(h);pelvis.rotation.z=p.pelvicRoll;
   torso.position.copy(h).add(V(lean,.255,0));torso.rotation.z=-lean;
   head.position.copy(h).add(V(lean*2, .625, .016));head.rotation.z=-lean*.4;
   nose.position.copy(head.position).add(V(0,-.01,.103));
   orient(neck,h.clone().add(V(lean*1.5,.445,0)),h.clone().add(V(lean*1.8,.51,0)));
   for(const side of ['right','left']){
     const s=p[side],sign=side==='right'?1:-1,leg=legs[side],a=V(s.x,s.y,s.z),hip=V(...s.hip),k=V(...s.knee);
     orient(leg.thigh,hip,k);orient(leg.shin,k,a);leg.knee.position.copy(k);leg.ankle.position.copy(a);leg.foot.position.copy(a);leg.foot.rotation.set(s.pitch,0,s.roll);
     leg.shin.material=s.affected?orange:ivory;leg.knee.material=s.affected?orange:jointMat;leg.ankle.material=s.affected?orange:ivory;
     const arm=arms[side],shoulder=h.clone().add(V(sign*.205+lean*.8,.405,0));
     let elbow,hand;
     if(c.cane&&p.cane.side===side){
       hand=V(p.cane.x,p.cane.y+.77,p.cane.z-.01);
       const armKnee=kneeBetween(shoulder.toArray(),hand.toArray(),.29,.28);
       elbow=V(...armKnee);elbow.z+=.02;
     }else{
       const amp=s.affected?.035:.095,swing=Math.sin(p.phase+(side==='right'?Math.PI:0))*amp;
       elbow=shoulder.clone().add(V(sign*.012,-.265,swing));
       hand=elbow.clone().add(V(sign*.008,-.23,s.affected?.10:swing*.35));
     }
     orient(arm.upper,shoulder,elbow);orient(arm.lower,elbow,hand);arm.elbow.position.copy(elbow);arm.hand.position.copy(hand);arm.hand.scale.set(.78,1.25,.9);arm.shoulder.position.copy(shoulder);
     for(const part of ['upper','lower','hand','shoulder'])arm[part].material=s.affected?orange:ivory;
   }
   Object.values(cane).forEach(x=>x.visible=c.cane);
   const tip=V(p.cane.x,p.cane.y+.017,p.cane.z),handle=V(p.cane.x,p.cane.y+.77,p.cane.z);
   orient(cane.shaft,tip,handle);orient(cane.handle,handle.clone().add(V(0,0,-.067)),handle.clone().add(V(0,0,.050)));cane.tip.position.copy(tip);
 }
 return {update,meshes};
}
export function createScene(canvas,config){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#83bcf4');scene.fog=new THREE.Fog('#83bcf4',30,105);
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
 scene.add(new THREE.HemisphereLight('#e8f4ff','#74835b',2.2));
 const sun=new THREE.DirectionalLight('#fff5e6',2.8);sun.position.set(-4,7,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-4;sun.shadow.camera.right=4;sun.shadow.camera.top=4;sun.shadow.camera.bottom=-4;sun.shadow.camera.near=.1;sun.shadow.camera.far=20;sun.shadow.bias=-.0007;sun.shadow.normalBias=.015;scene.add(sun);scene.add(sun.target);
 const camera=new THREE.PerspectiveCamera(39,1,.05,180),controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.09;controls.enablePan=false;controls.minDistance=1.1;controls.maxDistance=9;controls.minPolarAngle=.06;controls.maxPolarAngle=Math.PI*.495;controls.target.set(0,.9,0);camera.position.set(2.8,2.1,4.2);controls.update();
 const world=new THREE.Group();scene.add(world);let ground=config.ground;
 function plane(width,length,z,color,yOffset=0){const g=new THREE.PlaneGeometry(width,length,1,60);g.rotateX(-Math.PI/2);const pos=g.attributes.position;for(let i=0;i<pos.count;i++){const zz=pos.getZ(i)+z;pos.setY(i,groundAt(zz,ground)+yOffset);pos.setZ(i,zz);}g.computeVertexNormals();const m=new THREE.Mesh(g,material(color));m.receiveShadow=true;world.add(m);return m;}
 function label(text,z){const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#ffffff';ctx.font='bold 60px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,64);const t=new THREE.CanvasTexture(c);const m=new THREE.Mesh(new THREE.PlaneGeometry(.55,.275),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(.95,groundAt(z,ground)+.009,z);world.add(m);}
 function buildGround(){
   while(world.children.length){const m=world.children[0];world.remove(m);m.geometry?.dispose();if(m.material){m.material.map?.dispose();m.material.dispose();}}
   plane(200,240,35,'#8aa46e',-.006);plane(3.2,46,15,'#6f7c85',.001);plane(.045,46,15,'#e0e6df',.006).position.x=-1.42;plane(.045,46,15,'#e0e6df',.006).position.x=1.42;
   for(let z=0;z<=20;z+=5){plane(2.8,.035,z,'#cfdad8',.008);label(z===20?'GOAL':`${z} m`,z+.35);}
   // Faint, regular surface detail supports depth perception; no photo-dependent art.
   const detailG=new THREE.BufferGeometry(),points=[];let seed=97;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
   for(let i=0;i<2400;i++){const x=(rand()-.5)*2.75,z=rand()*40-5;points.push(x,groundAt(z,ground)+.004,z);}
   detailG.setAttribute('position',new THREE.Float32BufferAttribute(points,3));const dot=new THREE.Points(detailG,new THREE.PointsMaterial({color:'#aab6bc',size:.013,transparent:true,opacity:.36}));world.add(dot);
 }
 buildGround();const avatar=buildAvatar(scene);let previousZ=0;
 const ro=new ResizeObserver(()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();});ro.observe(canvas);
 const w=canvas.clientWidth||800,h=canvas.clientHeight||500;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 function render(c,cycles){const p=samplePose(c,cycles),distance=p.distance;avatar.update(p,c);const dz=distance-previousZ;camera.position.z+=dz;controls.target.z+=dz;previousZ=distance;sun.position.set(-4,7,distance+4);sun.target.position.set(0,0,distance);controls.update();renderer.render(scene,camera);return p;}
 function view(name,c,distance){const base=groundAt(distance,c.ground),looks={angle:[2.8,2.1,4.2],side:[4.2,1.3,0],front:[0,1.5,4.7],back:[0,1.5,-4.7],feet:[1.05,.65,1.6]};const a=looks[name]||looks.angle;controls.target.set(0,base+(name==='feet'?.30:.90),distance);camera.position.set(a[0],base+a[1],distance+a[2]);controls.update();}
 function zoom(factor){const offset=camera.position.clone().sub(controls.target);offset.multiplyScalar(factor);offset.setLength(THREE.MathUtils.clamp(offset.length(),controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);controls.update();}
 return {render,view,zoom,controls,dispose(){ro.disconnect();controls.dispose();renderer.dispose();}};
}
