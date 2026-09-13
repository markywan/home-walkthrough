import * as T from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';

export const H = 2.65;
export const LIVING_SILL = .9;
export const DETAILS={fridge:{width:.62,depth:.65,height:1.83,bay:.70,upperBottom:2.10},diningCounter:{height:.90,depth:.70,thickness:.03},diningTable:{height:.76,thickness:.03},kitchen:{hob:[8.25,.90,2.32],sink:[6.86,.88,1.685],hoodBottom:1.65}};
export const rooms = {
 living:{name:'客厅',point:[5.36,5.32],look:[7.38,1.2,3.38]},
 master:{name:'主卧',point:[2.86,3.98],look:[1.3,.95,5.65]},
 second:{name:'次卧',point:[2.9,2.57],look:[1.45,1.0,1.0]},
 dining:{name:'餐区',point:[5.69,2.65],look:[4.82,1.05,1.16]},
 kitchen:{name:'厨房',point:[7.22,2.52],look:[8.21,1.24,2.26]},
 bath:{name:'卫生间',point:[6.72,.98],look:[8.08,1.6,.47]}
};
let seed=217; function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function canvasTexture(type){
 const c=document.createElement('canvas');c.width=c.height=512;const p=c.getContext('2d');
 if(type==='wood'||type==='floor'){
  p.fillStyle=type==='floor'?'#c5a77b':'#c8af85';p.fillRect(0,0,512,512);
  const boards=type==='floor'?4:1;
  for(let b=0;b<boards;b++){
   const v=Math.floor(rnd()*15)-7;p.fillStyle='rgb('+(199+v)+','+(172+v)+','+(134+v)+')';p.fillRect(b*512/boards,0,512/boards,512);
   for(let j=0;j<270;j++){const x=b*512/boards+rnd()*512/boards;p.strokeStyle='rgba(85,61,30,'+(.025+rnd()*.065)+')';p.lineWidth=.3+rnd()*.7;p.beginPath();p.moveTo(x,0);p.bezierCurveTo(x+Math.sin(j)*3,160,x+Math.cos(j)*3,330,x+Math.sin(j*.3)*2,512);p.stroke();}
   if(boards>1){p.fillStyle='rgba(75,62,40,.21)';p.fillRect(b*128,0,1,512);const y=Math.floor(rnd()*460);p.fillRect(b*128,y,128,1);}
  }
 }else if(type==='linen'){
  p.fillStyle='#eee9dc';p.fillRect(0,0,512,512);
  for(let i=0;i<512;i+=2){p.strokeStyle='rgba(88,83,72,'+(.015+rnd()*.06)+')';p.beginPath();p.moveTo(i,0);p.lineTo(i,512);p.stroke();p.beginPath();p.moveTo(0,i);p.lineTo(512,i);p.stroke();}
 }else if(type==='stone'||type==='plaster'){
  p.fillStyle='#ddddda';p.fillRect(0,0,512,512);
  for(let i=0;i<26000;i++){const v=110+rnd()*105;p.fillStyle=`rgba(${v},${v},${v},${type==='stone'?.12:.045})`;const r=.3+rnd()*1.1;p.fillRect(rnd()*512,rnd()*512,r,r);}
  if(type==='stone'){p.fillStyle='rgba(99,99,93,.24)';p.fillRect(0,0,2,512);p.fillRect(0,0,512,2);}
 }else if(type==='tile'){
  p.fillStyle='#e2e4df';p.fillRect(0,0,512,512);for(let i=0;i<7000;i++){const v=150+rnd()*60;p.fillStyle='rgba('+v+','+v+','+v+',.065)';p.fillRect(rnd()*512,rnd()*512,2,2);}p.fillStyle='#c5ccc6';p.fillRect(0,0,2,512);p.fillRect(0,0,512,2);
 }
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;
}
export function buildHome(scene){
 const root=new T.Group();scene.add(root);const obstacles=[],floors=[],windows=[],cabinetAudit=[];
 const woodTex=canvasTexture('wood'),floorTex=canvasTexture('floor'),clothTex=canvasTexture('linen'),tileTex=canvasTexture('tile'),stoneTex=canvasTexture('stone'),plasterTex=canvasTexture('plaster');
 plasterTex.repeat.set(6,6);
 const mat=(color,roughness=.82,other={})=>new T.MeshStandardMaterial({color,roughness,...other});
 const m={
  wall:mat('#e6e1d7',.94,{bumpMap:plasterTex,bumpScale:.0012}),ceiling:mat('#eeebe3',.95),trim:mat('#d4d0c5'),wood:mat('#e8dac1',.66,{map:woodTex,bumpMap:woodTex,bumpScale:.0018}),
  white:mat('#dddcd3',.63),dark:mat('#293332',.64),frame:mat('#505c59',.46,{metalness:.35}),metal:mat('#a9b3b0',.24,{metalness:.85}),
  glass:new T.MeshPhysicalMaterial({color:'#d6e6df',roughness:.09,metalness:.02,transparent:true,opacity:.11,depthWrite:false,side:T.DoubleSide}),
  bedding:mat('#fffdfa',.97,{map:clothTex,bumpMap:clothTex,bumpScale:.007}),sofa:mat('#e7e4d8',.93,{map:clothTex,bumpMap:clothTex,bumpScale:.006}),sage:mat('#81917a',.99,{map:clothTex,bumpMap:clothTex,bumpScale:.006}),
  porcelain:mat('#f1f0e8',.18),counter:mat('#d6d1c3',.48,{bumpMap:stoneTex,bumpScale:.0007}),screen:mat('#142322',.19,{metalness:.26}),rug:mat('#d3c8ac',1,{map:clothTex}),
  bathFloor:mat('#a49e92',.91,{map:stoneTex,bumpMap:stoneTex,bumpScale:.0012}),bathUpper:mat('#d6cfc1',.86,{map:stoneTex,bumpMap:stoneTex,bumpScale:.0008}),bathGreen:mat('#7d978c',.70,{map:stoneTex,bumpMap:stoneTex,bumpScale:.0008}),bathFittings:mat('#4d5957',.29,{metalness:.65}),
  leaf:mat('#668047',.97),trunk:mat('#8a7756',.97),pot:mat('#c2b08f',.9),green:mat('#577248',.9),
 };
 const geo=new T.BoxGeometry(1,1,1);
 function ob(x,z,w,d,h=H){obstacles.push({x,z,w,d,h});}
 function mesh(g,ma,x,y,z){const a=new T.Mesh(g,ma);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;root.add(a);return a;}
 function b(x,z,w,d,h,y=0,ma=m.wood,r=0,solid=false){
  const a=r?mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w*.24,h*.24,d*.24)),ma,x+w/2,y+h/2,z+d/2):mesh(geo,ma,x+w/2,y+h/2,z+d/2);
  if(!r)a.scale.set(w,h,d);if(solid)ob(x,z,w,d,y+h);return a;
 }
 function cyl(x,z,rad,h,y,ma=m.wood,rt=rad){return mesh(new T.CylinderGeometry(rt,rad,h,20),ma,x,y+h/2,z);}
 function sphere(x,z,rx,ry,rz,y,ma){const a=mesh(new T.SphereGeometry(1,16,12),ma,x,y,z);a.scale.set(rx,ry,rz);return a;}
 function tube(points,r=.012,ma=m.metal){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),16,r,8,false),ma,0,0,0);}
 function contact(x,z,w,d){
  const c=document.createElement('canvas');c.width=c.height=64;const p=c.getContext('2d'),g=p.createRadialGradient(32,32,3,32,32,32);g.addColorStop(0,'rgba(37,31,20,.3)');g.addColorStop(.58,'rgba(37,31,20,.17)');g.addColorStop(1,'rgba(37,31,20,0)');p.fillStyle=g;p.fillRect(0,0,64,64);
  const a=mesh(new T.PlaneGeometry(w*1.38,d*1.4),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false}),x+w/2,.008,z+d/2);a.rotation.x=-Math.PI/2;a.castShadow=false;
 }
 function floor(x,z,w,d,tiled=false,finish=null){
  const tex=(tiled?tileTex:floorTex).clone();tex.repeat.set(w/(tiled?.6:1.1),d/(tiled?.6:2.2));tex.needsUpdate=true;
  const f=b(x,z,w,d,.08,-.08+(tiled?.004:0),finish||mat('#f7f4ed',.77,{map:tex,bumpMap:tex,bumpScale:.0015}),0,false);floors.push(f);f.castShadow=false;
 }
 floor(.55,0,3.35,3.23);floor(0,3.38,3.9,3.33);floor(4.05,0,2.28,6.71);floor(6.33,3.08,2.22,3.63);
 // Tile and substrate leave an actual recess under the squat pan.
 floor(6.33,0,1.545,1.22,true,m.bathFloor);floor(8.325,0,.225,1.22,true,m.bathFloor);floor(7.875,0,.45,.25,true,m.bathFloor);floor(7.875,.85,.45,.37,true,m.bathFloor);
 floor(6.33,1.37,2.22,1.56,true);floor(3.9,2.43,.15,.8);floor(3.9,3.48,.15,.8);floor(6.18,.55,.15,.67,true);floor(6.18,2.12,.15,.81,true);
 function wall(x,z,w,d){b(x,z,w,d,H,0,m.wall,0,true);if(w>d){b(x,z-.012,w,.024,.075,.005,m.trim);b(x,z+d-.012,w,.024,.075,.005,m.trim);}else{b(x-.012,z,.024,d,.075,.005,m.trim);b(x+w-.012,z,.024,d,.075,.005,m.trim);}}
 function windowZ(x,z,len,sill=.35,top=2.42,thick=.2){
  b(x,z,thick,len,sill,0,m.wall);b(x,z,thick,len,H-top,top,m.wall);ob(x,z,thick,len);
  b(x+.035,z,.13,len+.025,.032,sill-.017,m.counter);
  b(x+.08,z,.035,len,.035,sill,m.frame);b(x+.08,z,.035,len,.035,top-.035,m.frame);
  const n=Math.max(1,Math.ceil(len/.78));
  for(let i=0;i<=n;i++)b(x+.075,z+i*len/n-.016,.046,.032,top-sill,sill,m.frame);
  const a=b(x+.094,z,.008,len,top-sill,sill,m.glass);windows.push(a);a.castShadow=false;
 }
 function wallZWindows(x,z0,z1,wins){let p=z0;for(const q of wins){if(q.z>p)wall(x,p,.2,q.z-p);windowZ(x,q.z,q.l,q.s,q.t);p=q.z+q.l;}if(p<z1)wall(x,p,.2,z1-p);}
 wall(.35,-.2,8.4,.2);
 wallZWindows(.35,0,3.23,[{z:.75,l:1.7,s:.72,t:2.4}]);
 windowZ(-.2,3.38,3.33,.3,2.4);
 wall(0,3.23,3.9,.15);
 // This short glazed panel is illustrative, with no unverified external walk-through.
 b(0,3.225,.35,.016,1.9,.35,m.glass);b(0,3.22,.025,.035,2.1,.1,m.frame);
 wallZWindows(8.55,0,6.71,[{z:.18,l:.87,s:1.3,t:2.4},{z:1.81,l:.83,s:1.12,t:2.4},{z:3.54,l:2.33,s:LIVING_SILL,t:2.4}]);
 wall(-.2,6.71,4.8,.2);wall(5.5,6.71,3.25,.2);
 b(4.6,6.71,.9,.2,H-2.1,2.1,m.wall);b(4.6,6.76,.89,.055,2.09,0,mat('#7c7361'),.01);ob(4.6,6.71,.9,.2);
 wall(3.9,0,.15,2.43);wall(3.9,3.23,.15,.25);wall(3.9,4.28,.15,2.43);
 for(const z of [2.43,3.48]){
  b(3.9,z,.15,.8,H-2.1,2.1,m.wall);
  b(3.87,z-.025,.21,.035,2.13,0,m.white);b(3.87,z+.79,.21,.035,2.13,0,m.white);b(3.87,z-.025,.21,.85,.04,2.1,m.white);
  const masterDoor=z>3,leafZ=masterDoor?z+.005:z+.775;
  b(3.10,leafZ,.8,.035,2.06,.01,mat('#d6c6a7'),.008);ob(3.10,leafZ,.8,.035);
  b(3.17,leafZ+(masterDoor?.04:-.025),.115,.02,.014,.96,m.metal);
 }
 wall(6.18,0,.15,.55);wall(6.18,1.22,.15,.9);
 b(6.18,.55,.15,.67,H-2.1,2.1,m.wall);b(6.18,2.12,.15,.81,H-2.1,2.1,m.wall);
 wall(6.33,1.22,2.22,.15);wall(6.18,2.93,2.37,.15);
 b(.55,0,8,6.71,.075,H,m.ceiling);b(0,3.38,.55,3.33,.075,H,m.ceiling);
 // Diffuse ceiling fittings: downward light and cached shadows stay inside each room.
 function lamp(x,z,r=.21){
  cyl(x,z,r,.05,H-.055,m.white);const a=cyl(x,z,r*.92,.012,H-.068,new T.MeshStandardMaterial({color:'#fff6e2',emissive:'#ffe4bd',emissiveIntensity:1.6}));a.castShadow=false;
  const l=new T.SpotLight('#ffe7c7',22,5.2,Math.PI*.33,.8,2);l.position.set(x,H-.09,z);l.target.position.set(x,0,z);l.castShadow=true;l.shadow.mapSize.set(1024,1024);l.shadow.bias=-.0012;l.shadow.normalBias=.035;l.shadow.camera.near=.15;l.shadow.camera.far=5.2;root.add(l,l.target);
 }
 lamp(7.1,4.7,.28);lamp(2,5.02,.24);lamp(2.2,1.7,.22);lamp(5.2,2.7,.17);lamp(7.4,2.3,.15);lamp(7.2,.7,.15);
 function wardrobe(x,z,w,d,h=2.6,front='south',ma=m.wood,base=0,solid=true,openTop=false){
  cabinetAudit.push({x,z,w,d,h,base,front});
  if(openTop){b(x,z,.018,d,h,base,ma);b(x+w-.018,z,.018,d,h,base,ma);b(x,z,w,.018,h,base,ma);b(x,z+d-.018,w,.018,h,base,ma);b(x,z,w,d,.025,base,ma);if(solid)ob(x,z,w,d,base+h);}else b(x,z,w,d,h,base,ma,.009,solid);if(base===0)contact(x,z,w,d);if(base===0&&h>2.5)b(x,z,w,d,H-h,h,ma);
  const n=Math.max(1,Math.ceil((front==='south'||front==='north'?w:d)/.6));
  if(front==='south'||front==='north'){const fz=front==='south'?z+d:z;for(let i=0;i<n;i++){b(x+i*w/n+.004,fz-.01,w/n-.008,.025,h-.11,base+.07,ma,.006);b(x+(i+.88)*w/n,fz+(front==='south'?.018:-.028),.012,.015,.16,base+Math.min(1.03,h*.52),m.dark);}}
  else {const fx=front==='west'?x:x+w;for(let i=0;i<n;i++){b(fx-.009,z+i*d/n+.004,.024,d/n-.008,h-.11,base+.07,ma,.004);b(fx-.026,z+(i+.82)*d/n,.014,.012,.21,base+Math.min(1.03,h*.52),m.dark);}}
  if(base===0)b(x+.025,z+.025,w-.05,d-.05,.065,base,m.dark);
  else b(x+.018,z+.018,w-.036,d-.036,.018,base,ma);
 }
 function slidingCloset(z,length){
  const x=3.3,w=.6;ob(x,z,w,length,H);contact(x,z,w,length);
  b(x+.07,z+.018,w-.07,length-.036,2.035,.065,m.wood);b(x,z,w,length,.065,0,m.dark);
  for(const zz of [z,z+length-.018])b(x,zz,w,.018,2.1,0,m.wood);
  for(let i=0;i<2;i++){const xx=x+.010+i*.015;b(xx,z+i*(length/2-.018)+.012,.022,length/2+.005,2.02,.075,i?m.white:m.wood,.005);b(xx-.006,z+(i+.82)*length/2,.008,.035,.23,.94,m.dark,.003);}
  for(const y of [.07,2.065])b(x+.002,z+.02,.055,length-.04,.012,y,m.metal);
  wardrobe(x,z,w,length,.55,'west',m.wood,2.1,false);
  cabinetAudit.push({type:'sliding',x,z,w,d:length,h:2.1,base:0,front:'west'});
 }
 function taskStrip(x,z,length,height){
  const emitter=mat('#fff5db',.6,{emissive:'#ffddb3',emissiveIntensity:1.2});b(x,z,length,.016,.008,height,emitter,.003);
  const l=new T.SpotLight('#ffe5c5',2.0,1.65,Math.PI*.36,1,2);l.position.set(x+length/2,height-.015,z);l.target.position.set(x+length/2,.85,z+.17);root.add(l,l.target);
 }
 function bedside(x,z,w=.4,d=.4){b(x,z,w,d,.42,.07,m.wood,.015,true);b(x+.018,z-.009,w-.036,.02,.18,.26,m.wood,.007);b(x+w*.33,z-.025,w*.34,.015,.015,.35,m.dark);contact(x,z,w,d);}
 function bed(cx,cz,angle){
  const start=root.children.length;
  b(-.95,-1.05,1.9,2.1,.25,.08,mat('#c8b490'),.065);
  b(-.9,-1,1.8,2,.19,.33,m.bedding,.075);
  b(-.95,.96,1.9,.09,.95,.05,m.wood,.032);
  b(-.875,-.96,1.75,1.43,.10,.49,m.bedding,.035);
  b(-.885,-.7,1.77,.38,.022,.575,m.sage,.01);
  for(const x of [-.76,.08]){
   const g=new T.SphereGeometry(1,28,18),pos=g.attributes.position;
   for(let i=0;i<pos.count;i++){let px=pos.getX(i),py=pos.getY(i),pz=pos.getZ(i);px=Math.sign(px)*Math.pow(Math.abs(px),.48);pz=Math.sign(pz)*Math.pow(Math.abs(pz),.48);py*=1-.035*Math.sin(px*24)*Math.sin(pz*11);pos.setXYZ(i,px*.335,py*.073,pz*.18);}g.computeVertexNormals();
   const p=mesh(g,m.bedding,x+.335,.615,.75);p.rotation.z=x<0?.035:-.028;
  }
  const group=new T.Group();for(const a of root.children.slice(start))group.add(a);root.add(group);group.position.set(cx,0,cz);group.rotation.y=angle;
  const horizontal=Math.abs(Math.sin(angle))>.5;ob(cx-(horizontal?1.05:.95),cz-(horizontal?.95:1.05),horizontal?2.1:1.9,horizontal?1.9:2.1,.99);contact(cx-(horizontal?1.05:.95),cz-(horizontal?.95:1.05),horizontal?2.1:1.9,horizontal?1.9:2.1);
 }
 bed(1.55,5.66,0);bed(1.5,1.05,Math.PI);
 slidingCloset(4.38,2.33);bedside(.05,6.26,.5,.45);
 bedside(2.5,6.31);
 slidingCloset(0,2.2);
 wardrobe(.55,2.93,1.1,.3,.4,'north',m.white,1.70,false);wardrobe(.55,2.93,1.1,.3,.55,'north',m.wood,2.10,false);
 b(.55,2.93,1.1,.3,.025,1.45,m.wood);b(.55,2.93,.018,.3,.25,1.45,m.wood);b(1.632,2.93,.018,.3,.25,1.45,m.wood);
 taskStrip(.63,2.95,.91,1.442);
 b(.55,2.68,1.2,.55,.043,.73,m.wood,.012,true);for(const x of [.59,1.66])for(const z of [2.72,3.15])b(x,z,.045,.045,.73,0,m.wood);
 b(.57,2.72,.39,.5,.53,.16,m.white,.015);
 function chair(x,z,angle=0,withBack=false){
  const from=root.children.length;
  b(-.2,-.2,.4,.4,.08,.42,m.sofa,.045);for(const ax of [-.145,.145])for(const az of [-.145,.145])b(ax-.017,az-.017,.034,.034,.42,0,m.wood,.008);
  if(withBack)b(-.2,.155,.4,.045,.35,.49,m.wood,.025);
  const g=new T.Group();for(const a of root.children.slice(from))g.add(a);g.position.set(x,0,z);g.rotation.y=angle;root.add(g);ob(x-.2,z-.2,.4,.4,.9);
 }
 chair(1.34,2.50,Math.PI,true);
 // Fridge and washer fit within their 700 mm equipment bays.
 b(4.09,.035,.62,.65,1.83,0,m.white,.035,true);
 b(4.105,.679,.59,.024,1.1,.72,m.white,.019);b(4.105,.679,.59,.024,.66,.035,m.white,.019);
 b(4.145,.713,.023,.024,.33,1.2,m.metal,.006);b(4.145,.713,.023,.024,.22,.32,m.metal,.006);
 wardrobe(4.75,0,.68,.67,.87,'south',m.white);
 // One continuous 900 mm worktop: identical depth, material and 30 mm edge.
 b(4.75,0,1.38,.7,.03,.87,m.counter,.008);b(5.43,0,.025,.7,.87,0,m.white);b(6.105,0,.025,.7,.87,0,m.white);
 b(5.48,.05,.6,.6,.85,0,m.white,.018,true);
 const washRing=mesh(new T.TorusGeometry(.204,.033,12,36),m.metal,5.78,.43,.665);
 const washGlass=mesh(new T.CircleGeometry(.181,36),mat('#24332f',.16,{metalness:.15}),5.78,.43,.67);washGlass.castShadow=false;
 const knob=cyl(5.55,.655,.029,.018,.752,m.metal);knob.rotation.x=Math.PI/2;
 b(5.82,.656,.15,.012,.034,.754,m.dark,.004);
 b(4.05,1.45,1.2,.7,.03,.73,m.counter,.008,true);for(const x of [4.11,5.12])for(const z of [1.51,2.03])b(x,z,.055,.055,.73,0,m.wood,.009);
 chair(4.44,2.27);chair(4.98,2.27);
 // Entry: closed shoe storage, an open waist-height niche and overhead cupboards.
 wardrobe(4.05,4.38,.3,2.07,.8,'east',m.white,.15);
 wardrobe(4.05,4.38,.3,2.07,.65,'east',m.white,1.45,false);wardrobe(4.05,4.38,.3,2.07,.55,'east',m.wood,2.1,false);
 b(4.05,4.38,.025,2.07,.5,.95,m.wood);b(4.05,4.38,.3,.025,.5,.95,m.wood);b(4.05,6.425,.3,.025,.5,.95,m.wood);
 b(4.05,4.38,.3,2.07,.025,.95,m.wood);ob(4.05,4.38,.3,2.07);
 wardrobe(4.75,0,1.38,.3,.5,'south',m.white,1.60,false);
 wardrobe(4.75,0,1.38,.3,.55,'south',m.wood,2.10,false);
 // Shallow fridge top cupboards align with the other top fronts; 270 mm remains above the fridge.
 for(const x of [4.05,4.40])wardrobe(x,0,.35,.3,.55,'south',m.wood,2.10,false);
 taskStrip(4.82,.24,1.20,1.586);
 // Kitchen cabinets with a 600 mm worktop.
 wardrobe(6.33,1.37,.85,.6,.85,'south',m.white,0,true,true);wardrobe(7.18,1.37,.77,.6,.85,'south',m.white);b(7.95,1.37,.6,.6,.85,0,m.white,0,true);wardrobe(7.95,1.97,.6,.96,.85,'west',m.white);
 // North sink cutout; full east worktop carries the cooking zone under the window.
 b(6.33,1.37,.21,.6,.032,.85,m.counter,.005);b(7.18,1.37,1.37,.6,.032,.85,m.counter,.005);
 b(6.54,1.37,.64,.09,.032,.85,m.counter,.003);b(6.54,1.92,.64,.05,.032,.85,m.counter,.003);b(7.95,1.97,.6,.96,.032,.85,m.counter,.005);
 b(6.33,1.37,2.22,.025,.42,.885,m.counter);b(8.515,1.97,.03,.96,.20,.88,m.counter);
 b(8.035,2.01,.43,.62,.015,.884,m.dark,.016);
 for(const z of [2.18,2.48]){const ring=mesh(new T.TorusGeometry(.094,.003,6,32),m.metal,8.25,.901,z);ring.rotation.x=-Math.PI/2;}
 b(6.54,1.46,.025,.46,.018,.886,m.metal,.006);b(7.155,1.46,.025,.46,.018,.886,m.metal,.006);
 b(6.54,1.46,.64,.025,.018,.886,m.metal,.006);b(6.54,1.895,.64,.025,.018,.886,m.metal,.006);
 b(6.565,1.485,.59,.41,.014,.71,mat('#75817d',.33,{metalness:.65}),.028);
 for(const xx of [6.565,7.145])b(xx,1.485,.01,.41,.17,.72,m.metal,.004);
 for(const zz of [1.485,1.885])b(6.565,zz,.59,.01,.17,.72,m.metal,.004);
 cyl(6.86,1.685,.033,.003,.726,m.dark);
 tube([[6.86,.9,1.42],[6.86,1.18,1.42],[6.86,1.2,1.61],[6.86,1.13,1.66]],.015);
 // Ceiling-supported thin hood; its window/duct interface must be checked on site.
 b(8.045,1.955,.43,.75,.10,1.665,m.metal,.02);b(8.125,2.065,.25,.52,.014,1.65,m.dark,.006);
 b(8.255,2.215,.22,.22,H-1.765,1.765,m.white,.007);
 b(8.15,2.055,.025,.08,.008,1.651,mat('#fff5da',.7,{emissive:'#ffddb2',emissiveIntensity:1}));
 const wokMat=mat('#303936',.42,{metalness:.42});
 mesh(new T.LatheGeometry([[0,.915],[.08,.915],[.105,.925],[.157,.994],[.166,1.035],[.160,1.041],[.151,.997],[.098,.937],[0,.929]].map(p=>new T.Vector2(...p)),40),wokMat,8.25,-.010,2.18);
 tube([[8.09,1.015,2.18],[8.01,1.04,2.18],[7.93,1.066,2.18]],.015,wokMat);
 b(7.37,1.48,.42,.30,.016,.883,m.wood,.015);
 wardrobe(7.35,1.37,1.2,.32,.58,'south',m.white,1.52,false);
 wardrobe(7.35,1.37,1.2,.32,.55,'south',m.wood,2.1,false);
 taskStrip(7.40,1.63,1.08,1.506);
 // Sanitary fittings.
 // Warm-grey porcelain tiles, muted green wet-area walls and ordinary oak storage.
 function bathPanel(x,z,w,d,h,y,material){const mm=material.clone(),tex=stoneTex.clone();tex.repeat.set(Math.max(w,d)/.6,h/.6);tex.needsUpdate=true;mm.map=mm.bumpMap=tex;b(x,z,w,d,h,y,mm);}
 bathPanel(6.33,.001,1.32,.009,1.12,0,m.bathGreen);bathPanel(6.33,.001,1.32,.009,H-1.12,1.12,m.bathUpper);
 bathPanel(7.65,.001,.90,.009,H,0,m.bathGreen);bathPanel(6.33,1.210,2.22,.009,H,0,m.bathUpper);
 bathPanel(6.331,0,.009,.55,H,0,m.bathUpper);
 bathPanel(8.54,0,.009,1.22,1.30,0,m.bathGreen);bathPanel(8.54,0,.009,.18,H,0,m.bathGreen);bathPanel(8.54,1.05,.009,.17,H,0,m.bathGreen);bathPanel(8.54,.18,.009,.87,.25,2.4,m.bathGreen);
 wardrobe(6.45,.06,.6,.42,.75,'south',m.wood);b(6.45,.06,.6,.42,.035,.75,m.porcelain,.025);
 const basin=new T.LatheGeometry([[0,.799],[.05,.8],[.13,.811],[.21,.854],[.23,.86],[.24,.851],[.21,.815],[.10,.784],[0,.781]].map(p=>new T.Vector2(...p)),40);const basinMesh=mesh(basin,m.porcelain,6.75,0,.285);basinMesh.scale.z=.68;cyl(6.75,.285,.017,.002,.802,m.metal);
 tube([[6.75,.79,.12],[6.75,.98,.12],[6.75,.98,.23]],.012);
 wardrobe(6.425,.008,.65,.14,.82,'south',m.white,1.13,false);
 b(6.445,.154,.61,.009,.78,1.15,mat('#bac8c5',.15,{metalness:.9}),.009);
 b(6.743,.166,.003,.003,.78,1.15,m.frame);
 wardrobe(7.14,.015,.45,.18,.65,'south',m.wood,1.70,false);
 sphere(7.36,.55,.19,.21,.3,.28,m.porcelain);b(7.18,.06,.36,.21,.7,0,m.porcelain,.05,true);sphere(7.36,.54,.197,.035,.28,.445,m.white);ob(7.16,.12,.4,.72,.75);
 const flush=cyl(7.36,.16,.032,.007,.706,m.metal);b(7.125,.34,.04,.18,.03,.63,m.metal,.008);
 const roll=cyl(7.11,.43,.065,.10,.54,m.white);roll.rotation.x=Math.PI/2;
 tube([[6.47,.98,.485],[7.015,.98,.485]],.009);b(6.53,.475,.24,.016,.29,.68,mat('#b58069',.94,{map:clothTex}),.006);
 const showerTile=m.bathFloor;
 b(7.68,.01,.195,1.19,.018,-.014,showerTile);b(8.325,.01,.215,1.19,.018,-.014,showerTile);
 b(7.875,.01,.45,.24,.018,-.014,showerTile);b(7.875,.85,.45,.35,.018,-.014,showerTile);
 // A 600 × 450 mm squat pan: ceramic rim, recessed bowl and ridged footrests.
 const panShape=new T.Shape();panShape.moveTo(-.225,-.30);panShape.lineTo(.225,-.30);panShape.lineTo(.225,.30);panShape.lineTo(-.225,.30);panShape.closePath();
 const opening=new T.Path();opening.absellipse(0,0,.105,.225,0,Math.PI*2,true,0);panShape.holes.push(opening);
 const panRim=mesh(new T.ExtrudeGeometry(panShape,{depth:.018,bevelEnabled:false,curveSegments:40}),m.porcelain,8.1,-.014,.55);panRim.rotation.x=-Math.PI/2;
 const panMat=m.porcelain.clone();panMat.side=T.DoubleSide;
 const bowl=mesh(new T.LatheGeometry([[.028,-.17],[.036,-.16],[.060,-.13],[.078,-.08],[.094,-.02],[.105,.004]].map(p=>new T.Vector2(...p)),40),panMat,8.1,0,.55);bowl.scale.z=.225/.105;
 const panDrain=mesh(new T.CircleGeometry(.038,24),m.dark,8.1,-.17,.55);panDrain.rotation.x=-Math.PI/2;panDrain.scale.y=1.8;
 for(const x of [7.89,8.225]){b(x,.33,.085,.44,.012,.004,m.porcelain,.012);for(let i=0;i<10;i++)b(x+.005,.35+i*.037,.075,.007,.002,.016,m.white,.002);}
 b(7.77,.026,.12,.03,.18,.72,m.metal,.009);b(7.80,.06,.06,.014,.055,.81,m.white,.006);
 ob(7.995,.325,.21,.45,.06);
 b(7.65,0,.015,.62,2.13,0,m.glass);ob(7.65,0,.015,.62,2.13);b(7.648,0,.018,.02,2.14,0,m.frame);b(7.65,0,.015,1.22,.018,2.12,m.frame);
 tube([[8.25,.85,.04],[8.25,2.19,.04],[8.25,2.25,.38]],.014,m.bathFittings);
 cyl(8.25,.38,.13,.025,2.2,m.bathFittings);tube([[8.02,1.1,.04],[8.02,1.77,.07]],.012,m.bathFittings);
 sphere(8.02,.072,.045,.07,.018,1.78,m.bathFittings);tube([[8.02,1.62,.045],[7.97,1.12,.04],[8.12,1.04,.04]],.009,m.bathFittings);
 b(7.94,.022,.39,.038,.065,1.1,m.bathFittings,.013);
 b(8.4,.06,.13,.29,.018,1.25,m.metal,.006);
 for(const [z,col] of [[.15,'#f4efe2'],[.27,'#72887d']]){cyl(8.455,z,.026,.14,1.268,mat(col,.6));b(8.45,z-.006,.035,.012,.014,1.41,m.dark,.002);}
 // Independent shower drain omitted from this visual revision; drainage design remains unverified.
 // Living room: TV, open tea area, books and simple closed storage.
 const tx=6.195,tz=3.08;ob(tx,tz,2.34,.55,H);
 wardrobe(tx,tz,.6,.55,.85,'south');wardrobe(tx+.6,tz,1.74,.55,.45,'south');
 b(tx,tz,.6,.55,.024,.85,m.counter,.008);
 b(tx,tz,2.34,.3,.55,2.1,m.wood,.006);
 for(const x of [tx,tx+.6,tx+1.92,tx+2.322])b(x,tz,.018,.3,2.16,.44,m.wood);
 b(tx+.6,tz,1.32,.022,1.64,.45,mat('#ddd1b9'));
 for(const yy of [1.48,2.08])b(tx+.6,tz,1.32,.3,.023,yy,m.wood);
 b(tx+1.251,tz,.018,.3,.577,1.503,m.wood);
 for(const yy of [.46,.85,1.25,1.65,2.05])b(tx+1.92,tz,.42,.3,.025,yy,m.wood);
 const topCuts=[0,.6,1.26,1.92,2.34];for(let i=0;i<4;i++){b(tx+topCuts[i]+.004,tz+.305,topCuts[i+1]-topCuts[i]-.008,.025,.476,2.108,m.wood,.004);}
 const tv=b(tx+.685,tz+.275,1.15,.052,.657,.67,m.dark,.025);b(tx+.705,tz+.331,1.11,.006,.616,.691,m.screen,.009);
 cyl(tx+.17,tz+.325,.11,.23,.876,m.white);cyl(tx+.17,tz+.325,.108,.035,1.105,m.metal);
 sphere(tx+.442,tz+.34,.074,.103,.082,.985,m.metal);tube([[tx+.487,1.02,tz+.34],[tx+.538,1.1,tz+.34]],.012);cyl(tx+.442,tz+.34,.035,.017,1.082,m.dark);
 const bookMats=['#b4baa1','#a8865b','#d8cfb9','#6b8079','#e0d6c1','#a6b5ae'].map(c=>mat(c));
 function books(x,z,w,y){let p=x;while(p<x+w-.04){const bw=.024+rnd()*.029,bh=.17+rnd()*.105;const ma=bookMats[Math.floor(rnd()*bookMats.length)];const book=b(p,z,bw,.16,bh,y,ma,.0015);if(rnd()<.12)book.rotation.z=.09;b(p+.003,z+.161,bw-.006,.002,.005,y+bh*.77,m.white);p+=bw+.004;}}
 books(tx+.635,tz+.07,.60,1.51);books(tx+1.288,tz+.07,.60,1.51);for(const yy of [.88,1.28,1.68])books(tx+1.954,tz+.07,.35,yy);
 // Sofa with cushions, loose pillows and oak legs.
 b(6,5.86,2.4,.85,.31,.16,m.sofa,.08,true);contact(6,5.86,2.4,.85);
 b(6.025,6.46,2.35,.2,.53,.33,m.sofa,.075);
 for(let i=0;i<3;i++){b(6.16+i*.7,5.91,.67,.54,.135,.435,m.sofa,.05);const back=b(6.17+i*.7,6.40,.65,.16,.37,.51,m.sofa,.058);back.rotation.x=-.12;}
 for(const x of [6.025,8.2])b(x,5.9,.175,.76,.37,.31,m.sofa,.075);
 for(const x of [6.14,8.16])for(const z of [5.99,6.57])cyl(x,z,.03,.18,0,m.wood);
 const pillow=b(6.3,6.26,.34,.115,.33,.59,m.sage,.055);pillow.rotation.z=.11;
 bedside(5.55,6.01,.45,.7);
 // Compact rounded table, not a giant living-room centerpiece.
 b(6.75,5.01,.9,.45,.04,.355,m.wood,.15,true);for(const x of [6.9,7.49])for(const z of [5.10,5.34])cyl(x,z,.025,.355,0,m.wood);
 contact(6.75,5.01,.9,.45);cyl(7.17,5.22,.13,.014,.395,m.counter);
 cyl(7.12,5.22,.034,.049,.409,m.porcelain);cyl(7.24,5.22,.031,.045,.409,m.porcelain);
 function plant(x,z,y=0,s=.28){
  cyl(x,z,s*.3,s*.55,y,m.pot,s*.38);const centerY=y+s*.8;
  for(let i=0;i<8;i++){const a=i*Math.PI*.25;const leaf=sphere(x+Math.cos(a)*s*.36,z+Math.sin(a)*s*.36,s*.105,s*.43,s*.045,centerY+s*.18,m.green);leaf.rotation.z=Math.cos(a)*.42;leaf.rotation.x=Math.sin(a)*.42;}
 }
 plant(.72,3.05,.773,.23);plant(5.76,6.28,.49,.25);plant(8.4,4.9,0,.68);
 // Ordinary outlets, switches and a few folded towels lend scale without luxury fixtures.
 for(const [x,z,y] of [[6.5,3.072,1.04],[7.72,1.397,1.13],[3.87,3.59,1.16]]){b(x,z,.08,.013,.08,y,m.white,.005);}
 b(6.48,.09,.19,.12,.03,.795,m.sage,.014);
 // Green outlook modeled in 3D for real parallax through the windows.
 const grass=document.createElement('canvas');grass.width=grass.height=256;const gc=grass.getContext('2d');gc.fillStyle='#829465';gc.fillRect(0,0,256,256);for(let i=0;i<27000;i++){const v=rnd();gc.strokeStyle=v>.5?'rgba(49,74,38,.23)':'rgba(157,171,111,.35)';const x=rnd()*256,z=rnd()*256;gc.beginPath();gc.moveTo(x,z);gc.lineTo(x+rnd()*2-1,z-2-rnd()*4);gc.stroke();}const gt=new T.CanvasTexture(grass);gt.colorSpace=T.SRGBColorSpace;gt.wrapS=gt.wrapT=T.RepeatWrapping;gt.repeat.set(45,45);
 const ground=mesh(new T.PlaneGeometry(90,90),mat('#d1d6bf',1,{map:gt}),4,-.22,3);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
 const foliageGeo=new T.SphereGeometry(1,9,7),leafMat=mat('#709151',.96);
 const positions=[[-3.1,1.2],[-4.6,4],[-2.9,7],[-7,0],[-7,7],[-5,10],[11.5,-.5],[12,3],[11.8,6.8],[15,1.5],[16,5],[14,10],[3,-6],[7,-5],[2,12],[8,13]];
 const inst=new T.InstancedMesh(foliageGeo,leafMat,positions.length*40),dummy=new T.Object3D(),color=new T.Color();let count=0;
 for(const [x,z] of positions){
  const height=3.0+rnd()*1.7;cyl(x,z,.105,height,-.2,m.trunk,.065);
  for(let j=0;j<40;j++){const a=rnd()*Math.PI*2,rr=Math.sqrt(rnd())*1.25;dummy.position.set(x+Math.cos(a)*rr,height-.1+(rnd()-.35)*1.65,z+Math.sin(a)*rr);dummy.scale.set(.35+rnd()*.45,.29+rnd()*.47,.36+rnd()*.4);dummy.rotation.set(rnd(),rnd(),rnd());dummy.updateMatrix();inst.setMatrixAt(count,dummy.matrix);color.setHSL(.23+rnd()*.07,.21+rnd()*.16,.30+rnd()*.14);inst.setColorAt(count++,color);}
 }inst.castShadow=true;inst.receiveShadow=true;root.add(inst);
 // Batch static surfaces by material to keep phone draw calls modest.
 root.updateMatrixWorld(true);const bins=new Map(),remove=[];
 root.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&!Array.isArray(o.material)&&!floors.includes(o)){const key=o.material.uuid+'|'+o.castShadow+'|'+o.receiveShadow;if(!bins.has(key))bins.set(key,{material:o.material,cast:o.castShadow,receive:o.receiveShadow,gs:[]});const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();bins.get(key).gs.push(g.applyMatrix4(o.matrixWorld));remove.push(o);}});
 for(const o of remove)o.removeFromParent();
 let trunkBatch;
 for(const batch of bins.values()){const g=mergeGeometries(batch.gs,false);if(g){const a=new T.Mesh(g,batch.material);a.castShadow=batch.cast;a.receiveShadow=batch.receive;scene.add(a);if(batch.material===m.trunk)trunkBatch=a;}batch.gs.forEach(x=>x.dispose());}
 function setGarden(texture){
  texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
  inst.visible=false;if(trunkBatch)trunkBatch.visible=false;
  const ma=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,fog:false});
  for(const [x,z,angle] of [[-10,3,Math.PI/2],[18.5,3,-Math.PI/2],[4,-10,0],[4,17,Math.PI]]){const p=new T.Mesh(new T.PlaneGeometry(24,12),ma);p.position.set(x,5.75,z);p.rotation.y=angle;scene.add(p);}
 }
 function walkable(x,z,r=.22,camera=false){
  if(!((x>.0&&x<8.55&&z>3.38&&z<6.71)||(x>.55&&x<8.55&&z>0&&z<6.71)))return false;
  for(const o of obstacles){if(camera&&o.h<1.5)continue;const nx=Math.max(o.x,Math.min(x,o.x+o.w)),nz=Math.max(o.z,Math.min(z,o.z+o.d));if((nx-x)**2+(nz-z)**2<r*r)return false;}return true;
 }
 function zone(x,z){if(x<3.94)return z>3.3?'master':'second';if(x>6.2&&z<1.24)return 'bath';if(x>6.2&&z<3.01)return 'kitchen';return z<3.2?'dining':'living';}
 return {root,obstacles,floors,walkable,zone,materials:m,setGarden,cabinetAudit,livingSill:LIVING_SILL,details:DETAILS};
}
