import * as T from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { buildHome, rooms } from './scene.js?v=20260913-details';
import { EffectComposer } from './vendor/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/postprocessing/RenderPass.js';
import { SSAOPass } from './vendor/postprocessing/SSAOPass.js';
import { OutputPass } from './vendor/postprocessing/OutputPass.js';
import { makeAvatar } from './avatar.js';
import { storageInfo } from './storage.js?v=20260913-details';

const $=s=>document.querySelector(s), canvas=$('#view'), eye=1.65;
const TOUR_SPEED=.74, TOUR_PAUSE_SCALE=.5;
const scene=new T.Scene();scene.background=new T.Color('#d4e1df');scene.fog=new T.Fog('#d4e1df',23,58);
const state={ready:false,yaw:-.81,pitch:-.12,targetYaw:-.81,targetPitch:-.12,path:[],pathIndex:0,mode:'idle',tourIndex:0,hold:0,tourPaused:false,lastRoom:'living',goal:null,frames:0,view:'first'};
const player=new T.Vector3(5.36,0,5.32);
let composer,ao,avatar,renderer,home,camera,frameTime=0,toastTimer,hintTimer,drag=null,moveKeys=new Set(),pointerButtons=new Map(),lastRoomTime=0;
const ray=new T.Raycaster(),pointer=new T.Vector2();
const tourStops=[
 {...rooms.living,room:'living',hold:4},
 {room:'living',name:'客厅',point:[6.12,4.55],look:[7.33,1.0,6.27],hold:5},
 {...rooms.dining,room:'dining',hold:5},
 {...rooms.kitchen,room:'kitchen',hold:5},
 {room:'kitchen',name:'厨房洗切区',point:[7.22,2.52],look:[6.86,1.05,1.56],hold:3},
 {...rooms.bath,room:'bath',hold:5},
 {room:'bath',name:'淋浴与蹲便',point:[6.72,.98],look:[8.1,.04,.55],hold:4},
 {...rooms.second,room:'second',hold:5},
 {room:'second',name:'次卧',point:[2.10,2.50],look:[3.50,1.25,1.1],hold:5},
 {...rooms.master,room:'master',hold:6},
 {room:'master',name:'主卧',point:[1.0,3.99],look:[-.1,1.3,4.5],hold:4},
 {room:'master',name:'主卧',point:[2.9,4.1],look:[3.55,1.27,5.63],hold:5},
 {...rooms.living,room:'living',hold:4}
];
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
function hideHint(){clearTimeout(hintTimer);$('#hint').classList.add('hidden');}
function angleDiff(a,b){let d=a-b;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;}
function targetLook(at){const dx=at[0]-player.x,dz=at[2]-player.z;state.targetYaw=Math.atan2(-dx,-dz);state.targetPitch=Math.atan2(at[1]-eye,Math.hypot(dx,dz));}
function updateTourUI(){
 const running=state.mode==='tour';
 $('#tour-label').textContent=running?'暂停漫游':state.tourPaused?'继续漫游':'自动看房';
 $('#tour-icon').innerHTML=running?'<path d="M6 5h4v14H6zm8 0h4v14h-4Z"/>':'<path d="m8 5 11 7-11 7Z"/>';
 $('#tour-btn').setAttribute('aria-pressed',String(running));
 $('#tour-status').textContent=running?('自动漫游 · '+(state.tourIndex+1)+' / '+tourStops.length):state.tourPaused?'已停下，可以自由看看':'约1分钟逛一圈';
}
function stopMotion(manual=true){if(state.mode==='tour')state.tourPaused=true;state.path=[];state.mode='idle';state.hold=0;state.goal=null;if(manual){state.targetYaw=state.yaw;state.targetPitch=state.pitch;}updateTourUI();}
function clearLine(a,b){const n=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/.05);for(let i=0;i<=n;i++){const t=n?i/n:0;if(!home.walkable(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t))return false;}return true;}
const step=.12,cols=73,rows=58;
let grid;
function makeGrid(){grid=new Uint8Array(cols*rows);for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)grid[j*cols+i]=home.walkable(i*step,j*step)?1:0;}
function nearest(point){
 const a=Math.round(point[0]/step),b=Math.round(point[1]/step);let best=-1,dist=Infinity;
 for(let y=Math.max(0,b-4);y<=Math.min(rows-1,b+4);y++)for(let x=Math.max(0,a-4);x<=Math.min(cols-1,a+4);x++){const id=y*cols+x;if(!grid[id])continue;const d=Math.hypot(x*step-point[0],y*step-point[1]);if(d<dist&&clearLine(point,[x*step,y*step])){dist=d;best=id;}}
 return best;
}
function findPath(from,to){
 if(!home.walkable(...to))return null;
 if(clearLine(from,to))return [from,to];
 const start=nearest(from),end=nearest(to);if(start<0||end<0)return null;
 const came=new Int32Array(grid.length).fill(-1),cost=new Float32Array(grid.length).fill(Infinity),closed=new Uint8Array(grid.length),open=[start];
 cost[start]=0;const gx=end%cols,gy=Math.floor(end/cols);let found=false;
 while(open.length){
  let bi=0,bv=Infinity;for(let i=0;i<open.length;i++){const id=open[i],v=cost[id]+Math.hypot(id%cols-gx,Math.floor(id/cols)-gy);if(v<bv){bv=v;bi=i;}}
  const id=open.splice(bi,1)[0];if(id===end){found=true;break;}if(closed[id])continue;closed[id]=1;
  const x=id%cols,y=Math.floor(id/cols);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const nx=x+dx,ny=y+dy;if(nx<0||nx>=cols||ny<0||ny>=rows)continue;
   const n=ny*cols+nx;if(!grid[n]||closed[n])continue;
   if(dx&&dy&&(!grid[y*cols+nx]||!grid[ny*cols+x]))continue;
   const c=cost[id]+Math.hypot(dx,dy);if(c<cost[n]){cost[n]=c;came[n]=id;open.push(n);}
  }
 }
 if(!found)return null;
 const result=[to];let id=end;while(id!==start&&id>=0){result.push([id%cols*step,Math.floor(id/cols)*step]);id=came[id];}result.push(from);result.reverse();
 const smooth=[result[0]];let i=0;while(i<result.length-1){let far=i+1;for(let j=i+2;j<result.length;j++){if(clearLine(result[i],result[j]))far=j;else break;}smooth.push(result[far]);i=far;}return smooth;
}
function navigate(goal,mode='walk'){
 if(!state.ready)return false;const path=findPath([player.x,player.z],goal.point);
 if(!path){toast('这个位置暂时走不过去，换个房间试试');return false;}
 state.goal=goal;state.path=path;state.pathIndex=1;state.mode=mode;state.hold=0;hideHint();updateTourUI();return true;
}
function startTour(){
 moveKeys.clear();pointerButtons.clear();
 if(state.mode==='tour'){stopMotion();return;}
 if(!state.tourPaused)state.tourIndex=0;
 state.tourPaused=false;if(!navigate(tourStops[state.tourIndex],'tour')){state.mode='idle';updateTourUI();}
}
function setRoom(key){stopMotion();state.tourPaused=false;navigate({...rooms[key],room:key});toast('沿通道去'+rooms[key].name);}
function arrived(){
 state.path=[];targetLook(state.goal.look);
 if(state.mode==='tour'){state.hold=(state.goal.hold||4)*TOUR_PAUSE_SCALE;}
 else {state.mode='idle';$('#tour-status').textContent='已到'+state.goal.name+'，拖动画面看看';}
}
function advanceTour(){state.tourIndex++;if(state.tourIndex>=tourStops.length){state.mode='idle';state.tourPaused=false;state.tourIndex=0;updateTourUI();toast('已经逛完一圈，可以自由看看了');$('#tour-progress span').style.width='100%';return;}navigate(tourStops[state.tourIndex],'tour');}
function tryStep(dx,dz){
 const p=player;
 if(home.walkable(p.x+dx,p.z+dz)){p.x+=dx;p.z+=dz;return true;}
 let moved=false;if(home.walkable(p.x+dx,p.z)){p.x+=dx;moved=true;}if(home.walkable(p.x,p.z+dz)){p.z+=dz;moved=true;}return moved;
}
function tick(now){
 requestAnimationFrame(tick);if(!state.ready)return;
 const dt=Math.min(.1,(now-frameTime)/1000||.016);frameTime=now;if(document.hidden)return;
 const controls=new Set([...moveKeys,...pointerButtons.values()]);
 if(controls.size){
  if(state.mode!=='idle')stopMotion();let f=(controls.has('forward')?1:0)-(controls.has('back')?1:0),r=(controls.has('right')?1:0)-(controls.has('left')?1:0);
  const len=Math.hypot(f,r)||1,speed=.72*dt/len;f*=speed;r*=speed;
  tryStep(-Math.sin(state.yaw)*f+Math.cos(state.yaw)*r,-Math.cos(state.yaw)*f-Math.sin(state.yaw)*r);
 }else if(state.path.length){
  const at=state.path[state.pathIndex],p=player,dx=at[0]-p.x,dz=at[1]-p.z,dist=Math.hypot(dx,dz),amount=Math.min(dist,(state.mode==='tour'?TOUR_SPEED:.66)*dt);
  if(dist>.015){const nx=dx/dist*amount,nz=dz/dist*amount;if(!tryStep(nx,nz)){stopMotion();toast('前面有家具，换个方向看看');}else{state.targetYaw=Math.atan2(-dx,-dz);state.targetPitch=-.075;}}
  if(dist<.025){state.pathIndex++;if(state.pathIndex>=state.path.length)arrived();}
 }else if(state.mode==='tour'&&state.hold>0){state.hold-=dt;if(state.hold<=0)advanceTour();}
 if(!drag){state.yaw+=angleDiff(state.targetYaw,state.yaw)*Math.min(1,dt*2.5);state.pitch+=(state.targetPitch-state.pitch)*Math.min(1,dt*2.5);}
 state.pitch=T.MathUtils.clamp(state.pitch,-.75,.62);
 const moving=controls.size>0||state.path.length>0;
 if(avatar){avatar.group.position.copy(player);avatar.group.visible=state.view==='third';avatar.update(dt,moving,state.yaw);}
 if(state.view==='third'){
  let distance=.05;for(let d=.1;d<=2.35;d+=.025){if(!home.walkable(player.x+Math.sin(state.yaw)*d,player.z+Math.cos(state.yaw)*d,.12,true))break;distance=d;}
  camera.position.set(player.x+Math.sin(state.yaw)*distance,eye,player.z+Math.cos(state.yaw)*distance);
  const centerY=eye-Math.tan(Math.atan2(eye,distance)/2)*distance;camera.lookAt(player.x,T.MathUtils.clamp(centerY+state.pitch*.4,.55,1.45),player.z);
  if(avatar)avatar.group.visible=distance>1.02;
 }else{camera.position.set(player.x,eye,player.z);camera.rotation.set(state.pitch,state.yaw,0,'YXZ');}

 if(now-lastRoomTime>250){lastRoomTime=now;const key=home.zone(player.x,player.z);$('#place-name').textContent=rooms[key].name;if(key!==state.lastRoom){state.lastRoom=key;updateStorage();document.querySelectorAll('[data-room]').forEach(b=>{const sel=b.dataset.room===key;b.classList.toggle('selected',sel);b.setAttribute('aria-pressed',sel);});}if(state.mode==='tour')$('#tour-progress span').style.width=(state.tourIndex/tourStops.length*100)+'%';}
 if(composer)composer.render();else renderer.render(scene,camera);state.frames++;
}
function resize(){if(!renderer)return;const w=window.innerWidth,h=window.innerHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=w<h?64:55;camera.updateProjectionMatrix();if(composer){composer.setSize(w,h);ao.setSize(Math.round(w*.65),Math.round(h*.65));}}
canvas.addEventListener('pointerdown',e=>{if(!state.ready||e.button>0)return;hideHint();stopMotion();drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,time:performance.now(),moved:false};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5)drag.moved=true;state.yaw-=dx*.0034;state.pitch=T.MathUtils.clamp(state.pitch-dy*.0027,-.75,.62);state.targetYaw=state.yaw;state.targetPitch=state.pitch;drag.x=e.clientX;drag.y=e.clientY;});
function pointerEnd(e){
 if(!drag||drag.id!==e.pointerId)return;
 const click=!drag.moved&&performance.now()-drag.time<300;drag=null;
 if(click){const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(home.floors,false);if(hits.length){const p=hits[0].point;if(home.walkable(p.x,p.z)){navigate({point:[p.x,p.z],look:[p.x-Math.sin(state.yaw)*2,1.45,p.z-Math.cos(state.yaw)*2],name:'这里'});}}}
}
canvas.addEventListener('pointerup',pointerEnd);canvas.addEventListener('pointercancel',()=>{drag=null;});
for(const button of document.querySelectorAll('[data-move]')){
 button.addEventListener('pointerdown',e=>{e.preventDefault();hideHint();stopMotion();pointerButtons.set(e.pointerId,button.dataset.move);button.classList.add('held');button.setPointerCapture(e.pointerId);});
 const release=e=>{pointerButtons.delete(e.pointerId);button.classList.remove('held');};button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
}
const keymap={w:'forward',ArrowUp:'forward',s:'back',ArrowDown:'back',a:'left',ArrowLeft:'left',d:'right',ArrowRight:'right'};
window.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;const key=keymap[e.key]||keymap[e.key.toLowerCase()];if(key){e.preventDefault();hideHint();stopMotion();moveKeys.add(key);}});
window.addEventListener('keyup',e=>{const key=keymap[e.key]||keymap[e.key.toLowerCase()];if(key)moveKeys.delete(key);});
window.addEventListener('blur',()=>{moveKeys.clear();pointerButtons.clear();drag=null;document.querySelectorAll('.held').forEach(b=>b.classList.remove('held'));});
document.addEventListener('visibilitychange',()=>{frameTime=performance.now();if(document.hidden){moveKeys.clear();pointerButtons.clear();}});
document.querySelectorAll('[data-room]').forEach(b=>b.addEventListener('click',()=>setRoom(b.dataset.room)));
$('#tour-btn').addEventListener('click',startTour);$('#reset-btn').addEventListener('click',()=>{stopMotion();state.tourPaused=false;navigate({...rooms.living,room:'living'});toast('回到客厅起点');});
function openDialog(id){stopMotion();moveKeys.clear();pointerButtons.clear();$(id).showModal();}
$('#plan-btn').addEventListener('click',()=>openDialog('#plan-dialog'));$('#help-btn').addEventListener('click',()=>openDialog('#help-dialog'));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('#fullscreen-btn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('#home').requestFullscreen)await $('#home').requestFullscreen();else toast('把手机横过来，画面会更开阔');}catch{toast('把手机横过来，画面会更开阔');}});
function updateStorage(){
 const item=storageInfo[state.lastRoom];$('#storage-title').textContent=rooms[state.lastRoom].name+' · 尺寸与收纳';
 $('#storage-items').innerHTML=item.rows.map(r=>'<li><b>'+r[0]+'</b><span>'+r[1]+'</span></li>').join('');$('#storage-note').textContent=item.note;
}
$('#storage-btn').addEventListener('click',()=>{updateStorage();openDialog('#storage-dialog');});
$('#view-btn').addEventListener('click',()=>{
 stopMotion();state.view=state.view==='first'?'third':'first';
 if(state.view==='third'){
  let best=state.yaw,score=-1;for(let i=0;i<12;i++){const a=state.yaw+i*Math.PI/6;let dist=0;for(let d=.1;d<=2.35;d+=.05){if(!home.walkable(player.x+Math.sin(a)*d,player.z+Math.cos(a)*d,.12,true))break;dist=d;}const v=dist-Math.abs(angleDiff(a,state.yaw))*.12;if(v>score){score=v;best=a;}}
  state.yaw=state.targetYaw=best;state.pitch=state.targetPitch=0;hideHint();
 }
 $('#view-btn').textContent=state.view==='first'?'第三人称':'第一人称';$('#view-btn').setAttribute('aria-pressed',String(state.view==='third'));
 $('#eye-label').textContent=state.view==='first'?'眼高 1.65米':'人物身高 1.65米';
 toast(state.view==='third'?'已放入1.65米的人物；靠墙时镜头会自动收近':'回到离地1.65米的第一人称视角');
});
window.addEventListener('resize',resize);
try{
 renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,window.innerWidth<760?1.5:1.7));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 camera=new T.PerspectiveCamera(55,1,.04,85);camera.position.set(5.36,eye,5.32);camera.rotation.order='YXZ';resize();
 scene.add(new T.HemisphereLight('#e4edf3','#9b8d75',.48));scene.add(new T.AmbientLight('#e5dac7',.045));
 const pmrem=new T.PMREMGenerator(renderer);const env=new RoomEnvironment();scene.environment=pmrem.fromScene(env,.10).texture;scene.environmentIntensity=.34;env.dispose();pmrem.dispose();
 const sun=new T.DirectionalLight('#fff0d8',2.35);sun.position.set(15,7,6);sun.target.position.set(2,0,3);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.5,far:38});sun.shadow.normalBias=.010;sun.shadow.bias=-.00015;sun.shadow.radius=3;scene.add(sun,sun.target);
 const west=new T.DirectionalLight('#dce9f2',.65);west.position.set(-6,5,3);west.target.position.set(3,0,3);west.castShadow=true;west.shadow.mapSize.set(1024,1024);Object.assign(west.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.5,far:22});west.shadow.normalBias=.012;west.shadow.bias=-.0002;scene.add(west,west.target);
 home=buildHome(scene);makeGrid();
 const garden=await new T.TextureLoader().loadAsync('./assets/garden.jpg');home.setGarden(garden);
 try{avatar=await makeAvatar(scene);}catch(e){console.warn('人物模型暂未载入',e);$('#view-btn').disabled=true;$('#view-btn').textContent='人物暂不可用';}
 updateStorage();
 camera.rotation.set(state.pitch,state.yaw,0,'YXZ');await renderer.compileAsync(scene,camera);renderer.render(scene,camera);renderer.shadowMap.autoUpdate=false;
 const target=new T.WebGLRenderTarget(innerWidth,innerHeight,{type:T.HalfFloatType,samples:4});composer=new EffectComposer(renderer,target);composer.setPixelRatio(Math.min(devicePixelRatio,1.35));composer.addPass(new RenderPass(scene,camera));ao=new SSAOPass(scene,camera,innerWidth*.65,innerHeight*.65,16);ao.ssaoMaterial.fragmentShader=ao.ssaoMaterial.fragmentShader.replace('1.0 - occlusion','1.0 - occlusion * 0.52');ao.kernelRadius=.16;ao.minDistance=.00002;ao.maxDistance=.003;composer.addPass(ao);composer.addPass(new OutputPass());resize();
 state.ready=true;frameTime=performance.now();$('#loading').classList.add('done');hintTimer=setTimeout(hideHint,12000);requestAnimationFrame(tick);
 window.__homeDebug={state,home,camera,player,avatar,renderer,composer,ao,rooms,tourStops,findPath,clearLine,setRoom,stopMotion,advanceTour,navigate,reset:()=>{stopMotion();player.set(5.36,0,5.32);state.yaw=state.targetYaw=-.81;state.pitch=state.targetPitch=-.12;}};
}catch(error){
 console.error(error);$('#load-text').textContent='这个浏览器暂时无法显示3D，可以换系统浏览器打开，或先看平面图。';$('.load-line').style.display='none';const btn=document.createElement('button');btn.textContent='先看平面图';btn.className='tour-button';btn.addEventListener('click',()=>$('#plan-dialog').showModal());$('#loading').append(btn);
}
