# SPDX-License-Identifier: AGPL-3.0-or-later
"""Build the clothed, rigged Asian adult from MB-Lab's m_as01 base.
Source database: https://github.com/animate1978/MB-Lab (AGPL-3.0).
Run with Blender 5.1: blender -b -t 4 --python build-avatar.py -- SOURCE_DIR OUTPUT_DIR
"""
import bpy, json, sys, math
from pathlib import Path
from mathutils import Vector
src,out=map(Path,sys.argv[sys.argv.index('--')+1:]);out.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
with bpy.data.libraries.load(str(src/'data/humanoid_library.blend')) as (a,b):
 b.objects=['MBLab_human_male','MBLab_skeleton_base_fk']
body,rig=b.objects
for o in [body,rig]: bpy.context.collection.objects.link(o)
body.name='Asian adult skin';rig.name='Home visitor skeleton'
body.modifiers.clear()
if body.data.shape_keys: body.shape_key_clear()
verts=json.load(open(src/'data/vertices/m_as01_verts.json'))
for v,co in zip(body.data.vertices,verts):v.co=co
body.data.update()
weights=json.load(open(src/'data/vgroups/human_male_vgroups_base.json'))
body.vertex_groups.clear()
for name,entries in weights.items():
 g=body.vertex_groups.new(name=name)
 for i,w in entries:g.add([i],w,'REPLACE')
joints=json.load(open(src/'data/joints/human_male_joints.json'));offsets=json.load(open(src/'data/joints/human_male_joints_offset.json'))
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for bone in rig.data.edit_bones:
 oldz=bone.z_axis.copy()
 for end in ['head','tail']:
  key=bone.name+'_'+end
  if key in joints:
   pos=sum((Vector(verts[i]) for i in joints[key]),Vector())/len(joints[key])+Vector(offsets.get(key,[0,0,0]));setattr(bone,end,pos)
 bone.align_roll(oldz)
bpy.ops.object.mode_set(mode='OBJECT')
for p in rig.pose.bones:
 for c in list(p.constraints):p.constraints.remove(c)
rig.animation_data_clear();body.animation_data_clear()

def mat(name,col,rough=.85):
 m=bpy.data.materials.new(name);m.diffuse_color=(*col,1);m.use_nodes=True;n=m.node_tree.nodes.get('Principled BSDF');n.inputs['Base Color'].default_value=(*col,1);n.inputs['Roughness'].default_value=rough
 return m
skin=mat('Asian skin • MB-Lab albedo',(0.7,0.5,0.36),.72)
image=bpy.data.images.load(str(src/'data/textures/hum_m_asian_albedo.png'));image.scale(1024,1024);image.pack()
n=skin.node_tree.nodes.new('ShaderNodeTexImage');n.image=image;skin.node_tree.links.new(n.outputs['Color'],skin.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
eye=mat('Dark brown eyes',(.027,.016,.009),.34);white=mat('Warm eye white',(.84,.82,.77),.46);mouth=mat('Mouth',(.19,.07,.065));hairmat=mat('Natural black hair',(.016,.012,.009),.87)
print('ORIGINAL_MATERIALS',[(i,m.name if m else '') for i,m in enumerate(body.data.materials)])
oldnames=[m.name.lower() if m else '' for m in body.data.materials];oldindices=[p.material_index for p in body.data.polygons];body.data.materials.clear()
clear=mat('Clear cornea',(1,1,1),.12);clear.node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value=0
for m in [skin,eye,white,mouth,hairmat,clear]:body.data.materials.append(m)
for p in body.data.polygons:
 name=oldnames[oldindices[p.index]] if oldindices[p.index]<len(oldnames) else ''
 p.material_index=5 if 'cornea' in name else 4 if 'eyelash' in name else 1 if any(a in name for a in ['iris','pupil']) else 2 if any(a in name for a in ['sclera','teeth','human_eyes']) else 3 if 'tongue' in name else 0
 p.use_smooth=True

def extract(name,predicate,material,offset=0):
 polys=[p for p in body.data.polygons if predicate(p.center)]
 ids=sorted({i for p in polys for i in p.vertices});mapping={v:i for i,v in enumerate(ids)}
 mesh=bpy.data.meshes.new(name);mesh.from_pydata([body.data.vertices[i].co+body.data.vertices[i].normal*offset for i in ids],[],[[mapping[i] for i in p.vertices] for p in polys]);mesh.update()
 ob=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(ob);ob.data.materials.append(material)
 for p in mesh.polygons:p.use_smooth=True
 for g in body.vertex_groups:ob.vertex_groups.new(name=g.name)
 for old in ids:
  for g in body.data.vertices[old].groups:ob.vertex_groups[g.group].add([mapping[old]],g.weight,'REPLACE')
 return ob,ids
shirt,si=extract('Sage cotton T-shirt',lambda p:.88<p.z<1.465 and abs(p.x)<.38,mat('Muted sage cotton',(.26,.34,.29)),.017)
# Give the shirt a relaxed fabric envelope rather than copying muscles.
for v in shirt.data.vertices:
 x,y,z=v.co
 if abs(x)<.235 and z<1.37:
  a=math.atan2(y+.015,x);radius=.205+.035*max(0,min(1,(z-.94)/.4))
  target=Vector((math.cos(a)*radius,math.sin(a)*.18-.015,z))
  v.co=v.co.lerp(target,.85)
# Flatten the hem and sleeve cuffs using their boundary vertices.
from collections import Counter
counts=Counter(tuple(sorted(e)) for p in shirt.data.polygons for e in p.edge_keys)
boundary={i for e,n in counts.items() if n==1 for i in e}
for i in boundary:
 v=shirt.data.vertices[i]
 if v.co.z<1.08:v.co.z=.945
 elif abs(v.co.x)>.30:v.co.x=math.copysign(.365,v.co.x)
# Smooth the high-frequency muscular shape into everyday cotton.
sm=shirt.modifiers.new('Relaxed cotton','SMOOTH');sm.factor=.8;sm.iterations=9
bpy.context.view_layer.objects.active=shirt;bpy.ops.object.modifier_apply(modifier=sm.name)
for i in boundary:
 v=shirt.data.vertices[i]
 if v.co.z<1.08:v.co.z=.935
for v in shirt.data.vertices:
 if v.co.z<1.09:
  for g in list(v.groups):shirt.vertex_groups[g.group].remove([v.index])
  shirt.vertex_groups['pelvis'].add([v.index],1,'REPLACE')
# Straight-cut trouser legs with a clean fabric silhouette and explicit knee weights.
trouserMat=mat('Charcoal cotton',(.075,.085,.089))
vs=[];fs=[];weightrows=[];N=40
for side,sign in [('L',1),('R',-1)]:
 base=len(vs)
 levels=[(.99,.105,.100,.110),(.88,.116,.095,.112),(.75,.127,.094,.112),(.60,.138,.086,.103),(.49,.147,.080,.098),(.35,.160,.075,.092),(.20,.174,.070,.085),(.105,.181,.067,.082)]
 for z,cx,rx,ry in levels:
  for i in range(N):
   a=i*math.tau/N;vs.append((sign*cx+rx*math.cos(a),.011+ry*math.sin(a),z))
   if z>.88:weightsHere={'pelvis':min(1,(z-.88)/.10),'thigh_'+side:1-min(1,(z-.88)/.10)}
   elif z>.58:weightsHere={'thigh_'+side:1}
   elif z<.42:weightsHere={'calf_'+side:1}
   else:
    t=(z-.42)/.16;weightsHere={'thigh_'+side:t,'calf_'+side:1-t}
   weightrows.append(weightsHere)
 for j in range(len(levels)-1):
  for i in range(N):
   x=base+j*N+i;nx=base+j*N+(i+1)%N;fs.append((x,nx,nx+N,x+N))
mesh=bpy.data.meshes.new('Straight trousers');mesh.from_pydata(vs,[],fs);mesh.update();pants=bpy.data.objects.new('Charcoal straight trousers',mesh);bpy.context.collection.objects.link(pants);pants.data.materials.append(trouserMat)
for name in ['pelvis','thigh_L','thigh_R','calf_L','calf_R']:pants.vertex_groups.new(name=name)
for i,row in enumerate(weightrows):
 for name,w in row.items():
  if w:pants.vertex_groups[name].add([i],w,'REPLACE')
for p in pants.data.polygons:p.use_smooth=True
shoes,shi=extract('Simple grey house shoes',lambda p:p.z<.14,mat('House shoes',(.21,.23,.22)),.014)
# A short scalp-following haircut; forehead, eyebrows and ears stay uncovered.
def scalp(p):
 if abs(p.x)>.086:return p.z>1.655
 return p.z>(1.665 if p.y<-.055 else 1.60)
hair,hi=extract('Short black hair',scalp,hairmat,.008)
for v in hair.data.vertices:
 if v.co.z>1.69:v.co.z+=.008
# Remove hidden unclothed body faces. Only head, neck, forearms and hands remain skin.
import bmesh
bm=bmesh.new();bm.from_mesh(body.data);bm.faces.ensure_lookup_table()
deletion=[]
for f in bm.faces:
 c=f.calc_center_median()
 if c.z<.92 or (.91<c.z<1.43 and abs(c.x)<.36):deletion.append(f)
bmesh.ops.delete(bm,geom=deletion,context='FACES');bm.to_mesh(body.data);bm.free()
for ob in [body,shirt,pants,shoes,hair]:
 ob.parent=rig
 sub=ob.modifiers.new('Soft fabric surface','SUBSURF');sub.levels=1;sub.render_levels=1
 bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=sub.name)
 mod=ob.modifiers.new('Human motion','ARMATURE');mod.object=rig
 ob.select_set(True)
# Hair mesh inherits the exact head weights, rather than floating above the head.
bpy.context.view_layer.objects.active=rig
print('KEY_BONES',[(n,tuple(rig.data.bones[n].head_local),tuple(rig.data.bones[n].tail_local)) for n in ['head','upperarm_L','lowerarm_L','thigh_L','calf_L','foot_L']])
bpy.ops.wm.save_as_mainfile(filepath=str(out/'asian-adult-source.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'asian-adult.glb'),export_format='GLB',use_selection=True,export_animations=False,export_apply=False,export_yup=True,export_extras=True,export_image_format='JPEG',export_jpeg_quality=90)
print('SAVED_AVATAR',str(out/'asian-adult.glb'))
