import bpy
import os
import mathutils

# Clear existing objects in scene
bpy.ops.wm.read_factory_settings(use_empty=True)

v3_path = r"c:\Projects\fitness-3d\public\models\anatomy-v3.glb"
poc_path = r"c:\Projects\fitness-3d\artifacts\body-surface-poc\extremity-surface-aligned-poc.glb"
out_dir = r"c:\Projects\fitness-3d\artifacts\body-surface-poc"

# Import anatomy-v3.glb
bpy.ops.import_scene.gltf(filepath=v3_path)
v3_objects = list(bpy.context.scene.objects)
print(f"Imported anatomy-v3 with {len(v3_objects)} objects")

# Create red/orange muscle material for anatomy-v3 to distinguish
muscle_mat = bpy.data.materials.new(name="Muscle_V3_Mat")
muscle_mat.use_nodes = True
bsdf = muscle_mat.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs['Base Color'].default_value = (0.7, 0.25, 0.2, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.4

for obj in v3_objects:
    if obj.type == 'MESH':
        obj.data.materials.clear()
        obj.data.materials.append(muscle_mat)

# Import aligned POC
bpy.ops.import_scene.gltf(filepath=poc_path)
all_objects = list(bpy.context.scene.objects)
poc_objects = [o for o in all_objects if o not in v3_objects and o.type == 'MESH']
print(f"Imported aligned POC with {len(poc_objects)} objects")

# Create semi-translucent / skin-tinted neutral material for POC surface
skin_mat = bpy.data.materials.new(name="Skin_Surface_Mat")
skin_mat.use_nodes = True
bsdf = skin_mat.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs['Base Color'].default_value = (0.85, 0.75, 0.65, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.6

for obj in poc_objects:
    obj.data.materials.clear()
    obj.data.materials.append(skin_mat)

# Add lighting
light_data = bpy.data.lights.new(name="KeyLight", type='SUN')
light_data.energy = 3.0
light_obj = bpy.data.objects.new(name="KeyLight", object_data=light_data)
bpy.context.scene.collection.objects.link(light_obj)
light_obj.rotation_euler = (0.785, 0.3, 0.5)

fill_data = bpy.data.lights.new(name="FillLight", type='SUN')
fill_data.energy = 1.5
fill_obj = bpy.data.objects.new(name="FillLight", object_data=fill_data)
bpy.context.scene.collection.objects.link(fill_obj)
fill_obj.rotation_euler = (-0.785, -0.3, 2.5)

# Setup Camera with look-at constraint
cam_data = bpy.data.cameras.new(name="RenderCam")
cam_data.clip_start = 10.0
cam_data.clip_end = 10000.0
cam_obj = bpy.data.objects.new(name="RenderCam", object_data=cam_data)
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

# Empty target for camera tracking
target_empty = bpy.data.objects.new("CamTarget", None)
bpy.context.scene.collection.objects.link(target_empty)
track = cam_obj.constraints.new(type='TRACK_TO')
track.target = target_empty
track.track_axis = 'TRACK_NEGATIVE_Z'
track.up_axis = 'UP_Y'

# Set world background to neutral gray
world = bpy.context.scene.world
if not world:
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs['Color'].default_value = (0.2, 0.22, 0.25, 1.0)
    bg.inputs['Strength'].default_value = 1.0

bpy.context.scene.render.resolution_x = 1024
bpy.context.scene.render.resolution_y = 1024

# Find target objects in scene
left_wrist = bpy.data.objects.get("Anterior region of wrist.l")
left_ankle = bpy.data.objects.get("Anterior region of ankle.l")

def get_obj_center(obj):
    bbox = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
    center = sum(bbox, mathutils.Vector((0,0,0))) / 8.0
    return center

wrist_center = get_obj_center(left_wrist) if left_wrist else mathutils.Vector((0,0,0))
ankle_center = get_obj_center(left_ankle) if left_ankle else mathutils.Vector((0,0,0))

print("Left wrist center in Blender:", wrist_center)
print("Left ankle center in Blender:", ankle_center)

views = [
    {
        'name': 'left_hand_wrist.png',
        'target': wrist_center,
        'offset': mathutils.Vector((0, -350, 0)),
        'focal': 50
    },
    {
        'name': 'left_hand_side.png',
        'target': wrist_center,
        'offset': mathutils.Vector((350, 0, 0)),
        'focal': 50
    },
    {
        'name': 'left_foot_ankle.png',
        'target': ankle_center,
        'offset': mathutils.Vector((0, -350, 0)),
        'focal': 50
    },
    {
        'name': 'left_foot_side.png',
        'target': ankle_center,
        'offset': mathutils.Vector((350, 0, 0)),
        'focal': 50
    }
]

for v in views:
    target_empty.location = v['target']
    cam_obj.location = v['target'] + v['offset']
    cam_data.lens = v['focal']
    bpy.context.view_layer.update()
    bpy.context.scene.render.filepath = os.path.join(out_dir, v['name'])
    bpy.ops.render.render(write_still=True)
    print(f"Rendered: {v['name']}")

print("All renders completed successfully.")

