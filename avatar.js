import * as T from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';

// A textured, rigged adult; uniform world-space scale, not an arbitrary sprite.
export async function makeAvatar(scene){
 const gltf=await new GLTFLoader().loadAsync('./assets/person.glb');
 const model=gltf.scene,group=new T.Group();group.add(model);scene.add(group);
 const mixer=new T.AnimationMixer(model),pose=gltf.animations.find(a=>a.name==='TPose');
 if(pose){mixer.clipAction(pose).play();mixer.setTime(0);mixer.stopAllAction();}
 const bones={};model.traverse(o=>{if(o.isBone)bones[o.name.replace('mixamorig','').replace(':','')]=o;if(o.isMesh){o.castShadow=false;o.receiveShadow=true;o.material.roughness=.88;o.material.metalness=0;o.material.envMapIntensity=.45;}});
 const v1=new T.Vector3(),v2=new T.Vector3(),q1=new T.Quaternion(),q2=new T.Quaternion(),q3=new T.Quaternion();
 function aim(name,childName,x,y,z){
  const bone=bones[name],child=bones[childName];if(!bone||!child)return;
  group.updateMatrixWorld(true);bone.getWorldPosition(v1);child.getWorldPosition(v2);v2.sub(v1).normalize();
  const target=new T.Vector3(x,y,z).normalize().applyQuaternion(group.quaternion);
  q1.setFromUnitVectors(v2,target);bone.getWorldQuaternion(q2);q1.multiply(q2);bone.parent.getWorldQuaternion(q3);bone.quaternion.copy(q3.invert().multiply(q1));
 }
 function stance(s=0){
  for(const [side,sign] of [['Left',1],['Right',-1]]){
   aim(side+'Arm',side+'ForeArm',sign*.085,-1,-s*sign*.45);
   aim(side+'ForeArm',side+'Hand',sign*.025,-1,.065-s*sign*.32);
   aim(side+'UpLeg',side+'Leg',sign*.03,-1,s*sign);
   aim(side+'Leg',side+'Foot',0,-1,-Math.max(0,s*sign)*.5);
  }
 }
 stance();group.updateMatrixWorld(true);
 model.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();o.computeBoundingBox();}});
 let bounds=new T.Box3().setFromObject(model,true);const scale=1.65/(bounds.max.y-bounds.min.y);model.scale.multiplyScalar(scale);
 model.updateMatrixWorld(true);model.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();o.computeBoundingBox();}});
 bounds=new T.Box3().setFromObject(model,true);model.position.y-=bounds.min.y;
 model.position.x-=(bounds.max.x+bounds.min.x)/2;model.position.z-=(bounds.max.z+bounds.min.z)/2;
 group.updateMatrixWorld(true);
 const cv=document.createElement('canvas');cv.width=cv.height=64;const cx=cv.getContext('2d'),gr=cx.createRadialGradient(32,32,3,32,32,32);gr.addColorStop(0,'rgba(30,24,16,.25)');gr.addColorStop(.5,'rgba(30,24,16,.12)');gr.addColorStop(1,'rgba(30,24,16,0)');cx.fillStyle=gr;cx.fillRect(0,0,64,64);const shadow=new T.Mesh(new T.PlaneGeometry(.58,.45),new T.MeshBasicMaterial({map:new T.CanvasTexture(cv),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.009;group.add(shadow);
 let phase=0,blend=0;
 group.visible=false;
 return {group,bones,height:1.65,scale,update(dt,moving,yaw){
  group.rotation.y=yaw+Math.PI;
  blend=T.MathUtils.lerp(blend,moving?1:0,Math.min(1,dt*8));phase+=dt*5.5;
  if(group.visible)stance(Math.sin(phase)*.24*blend);
 },measure(){group.updateMatrixWorld(true);model.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();o.computeBoundingBox();}});const b=new T.Box3().setFromObject(model,true);return {height:b.max.y-b.min.y,minY:b.min.y,width:b.max.x-b.min.x};}};
}
