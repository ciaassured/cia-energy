import math
from pathlib import Path

import bpy
from mathutils import Matrix


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "models" / "cia-energy.glb"
BRAND_BLUE = (0.0, 0.63, 0.86, 1.0)
WHITE = (1.0, 1.0, 1.0, 1.0)


def make_principled_material(name, color, roughness=0.48, metallic=0.0):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = color

    principled = material.node_tree.nodes.get("Principled BSDF")
    if principled:
        if "Base Color" in principled.inputs:
            principled.inputs["Base Color"].default_value = color
        if "Roughness" in principled.inputs:
            principled.inputs["Roughness"].default_value = roughness
        if "Metallic" in principled.inputs:
            principled.inputs["Metallic"].default_value = metallic

    return material


def add_text(name, text, size, local_position, material, can):
    bpy.ops.object.text_add()
    text_object = bpy.context.object
    text_object.name = name
    text_object.data.name = f"{name}Curve"
    text_object.data.body = text
    text_object.data.align_x = "CENTER"
    text_object.data.align_y = "CENTER"
    text_object.data.size = size
    text_object.data.extrude = 0.012
    text_object.data.resolution_u = 16
    text_object.data.materials.append(material)

    tangent_rotation = Matrix.Rotation(math.radians(90), 4, "X")
    text_object.matrix_world = can.matrix_world @ Matrix.Translation(local_position) @ tangent_rotation

    bpy.context.view_layer.objects.active = text_object
    text_object.select_set(True)
    bpy.ops.object.convert(target="MESH")
    return bpy.context.object


can = bpy.data.objects["drink"]
blue_material = make_principled_material("CIA Energy Blue", BRAND_BLUE, roughness=0.34, metallic=0.08)
white_material = make_principled_material("CIA Energy White", WHITE, roughness=0.38, metallic=0.0)

for slot in can.material_slots:
    if slot.material and slot.material.name == "Label":
        slot.material = blue_material

add_text("CIAEnergyTextCIA", "CIA", 0.58, (0, -0.94, 0.38), white_material, can)
add_text("CIAEnergyTextEnergy", "ENERGY", 0.24, (0, -0.945, -0.18), white_material, can)

bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT),
    export_format="GLB",
    export_apply=True,
    export_yup=True,
)
