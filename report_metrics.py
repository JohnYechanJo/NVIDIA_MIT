import os
import sys
import json
import math
import glob
from tqdm import tqdm, trange

import trimesh

def parse_face_vertex_count(obj_filepath):
    """
    Parse the .obj file line by line to count the number of vertices per face.
    This helps us find how many triangles, quads, or n-gons the file contains
    (before trimesh potentially triangulates them internally).
    """
    tri_count = 0
    quad_count = 0
    ngon_count = 0
    
    with open(obj_filepath, 'r', encoding='utf-8') as f:
        for line in f:
            # Face lines typically start with 'f '
            if line.startswith('f '):
                # Example face line: f 1/1/1 2/2/2 3/3/3 (tri)
                # or f 1 2 3 4 (quad) ...
                parts = line.strip().split()[1:]  # skip the 'f'
                vertex_refs = [p for p in parts if p.strip() != '']
                vertex_count = len(vertex_refs)

                if vertex_count == 3:
                    tri_count += 1
                elif vertex_count == 4:
                    quad_count += 1
                else:
                    ngon_count += 1
    return tri_count, quad_count, ngon_count

def compute_uv_metrics(mesh):
    """
    Compute UV coverage, overlap, etc.
    - 'uv_coverage': ratio of area occupied by the mesh's UVs in [0,1]^2.
    - 'uv_overlap': naive approach to detect overlapping triangles in UV space.
    
    NOTE: Overlap detection can be complex; this function shows a simplistic approach,
    computing bounding boxes of each face in UV space and checking for intersection.
    More robust solutions may triangulate each face in UV space and do polygon intersection tests.
    """
    # If no UV data, return None
    if (not hasattr(mesh.visual, 'uv')) or (mesh.visual.uv is None):
        return {
            "uv_coverage": None,
            "uv_overlap": None
        }
    
    uv_coords = mesh.visual.uv
    # Keep only XY from uv_coords (trimesh uses shape (n, 2) for UV)
    min_u, min_v = uv_coords.min(axis=0)
    max_u, max_v = uv_coords.max(axis=0)
    
    # If the UVs are outside [0,1], coverage could be > 1 or partial if negative, etc.
    # For a normalized measure, we'll just see how much of the bounding box is inside [0,1].
    # Then we can do a ratio of how large that bounding box is relative to the 1x1 range.
    uv_width = max_u - min_u
    uv_height = max_v - min_v
    uv_area_bounding_box = uv_width * uv_height
    
    # A naive coverage: if bounding box is entirely within [0,1]^2, coverage ~ uv_area_bounding_box
    # But typically we want how well it *fits* within that space. This is an approximation:
    uv_coverage = uv_area_bounding_box  # can exceed 1 if it extends outside

    # Overlap detection (naive): bounding boxes of faces in UV space
    # This might not be fully accurate for partial overlaps.
    # For a more rigorous approach, you'd check polygon intersection in UV space.
    uv_face_bounds = []
    for face in mesh.faces:
        face_uv = uv_coords[face]
        f_min = face_uv.min(axis=0)
        f_max = face_uv.max(axis=0)
        uv_face_bounds.append((f_min, f_max))
    
    overlap_count = 0
    for i in trange(len(uv_face_bounds)):
        for j in range(i+1, len(uv_face_bounds)):
            (min_i, max_i) = uv_face_bounds[i]
            (min_j, max_j) = uv_face_bounds[j]
            # Check bounding box overlap in UV space
            if (min_i[0] <= max_j[0] and max_i[0] >= min_j[0] and
                min_i[1] <= max_j[1] and max_i[1] >= min_j[1]):
                overlap_count += 1

    uv_overlap = overlap_count if overlap_count > 0 else 0

    return {
        "uv_coverage": uv_coverage,
        "uv_overlap": uv_overlap
    }

def compute_aspect_ratios(mesh):
    """
    Compute aspect ratios for each face.
    For triangles, ratio = longest edge / shortest edge.
    For quads or n-gons (if loaded directly, though trimesh usually triangulates), we'd do similarly.
    We'll do it on the triangulated version from trimesh.
    Returns average, min, max aspect ratio across faces.
    """
    aspect_ratios = []
    # Each face is a triple of vertex indices (since trimesh triangulates).
    for face in tqdm(mesh.faces):
        vertices = mesh.vertices[face]
        # Edges: v0->v1, v1->v2, v2->v0
        edges = [
            vertices[1] - vertices[0],
            vertices[2] - vertices[1],
            vertices[0] - vertices[2]
        ]
        lengths = [e.dot(e)**0.5 for e in edges]  # Euclidean distances
        max_len = max(lengths)
        min_len = min(lengths)
        ratio = max_len / (min_len if min_len > 0 else 1e-8)
        aspect_ratios.append(ratio)
    
    if len(aspect_ratios) == 0:
        return None, None, None
    
    avg_ratio = sum(aspect_ratios) / len(aspect_ratios)
    min_ratio = min(aspect_ratios)
    max_ratio = max(aspect_ratios)
    return avg_ratio, min_ratio, max_ratio

def compute_normal_consistency(mesh):
    """
    A simple approach to check normal consistency:
    Compare each face normal to the average of adjacent face normals.
    If angles deviate significantly, that may indicate flipped normals.
    This is approximate.
    Returns a 'score' in [0..100], with 100 meaning fully consistent.
    """
    # Build adjacency
    adjacency = mesh.face_adjacency
    normals = mesh.face_normals
    total_faces = len(normals)
    if total_faces == 0:
        return 100  # trivially consistent if no faces

    consistent_count = 0
    # For each face, compare with adjacent faces
    for idx in trange(total_faces):
        adjacent_indices = adjacency[(adjacency[:,0] == idx) | (adjacency[:,1] == idx)]
        # adjacency is an Nx2 array of face indices
        # For each row, we have (face_i, face_j)
        # We only need the "other" face next to idx
        # Example: if adjacency row is (idx, x), x is the neighbor
        neighbors = []
        for pair in adjacent_indices:
            if pair[0] == idx:
                neighbors.append(pair[1])
            else:
                neighbors.append(pair[0])

        current_normal = normals[idx]
        # average neighbor normal
        if neighbors:
            neighbor_norms = normals[neighbors]
            avg_neighbor_normal = neighbor_norms.mean(axis=0)
            # measure angle
            dot_val = current_normal.dot(avg_neighbor_normal)
            if dot_val < 0:
                # means they are somewhat flipped
                # negative dot => >90 degrees difference
                pass
            else:
                consistent_count += 1
        else:
            # No neighbors => can't check
            consistent_count += 1

    # normal_consistency = ratio * 100%
    consistency_score = (consistent_count / total_faces) * 100.0
    return consistency_score

def analyze_obj_file(obj_file):
    # Gather polygon composition from raw .obj
    tri_count_raw, quad_count_raw, ngon_count_raw = parse_face_vertex_count(obj_file)

    # Load with trimesh to compute other metrics
    mesh = trimesh.load(obj_file, file_type='obj')

    vertex_count = len(mesh.vertices)
    face_count   = len(mesh.faces)        # Triangulated face count
    edge_count   = len(mesh.edges_unique)
    is_watertight = mesh.is_volume

    # bounding box
    bb_min, bb_max = mesh.bounds
    bounding_box_size = (bb_max - bb_min).tolist()  # [dx, dy, dz]

    # UV metrics
    uv_results = compute_uv_metrics(mesh)

    # Aspect ratios (average, min, max)
    avg_ar, min_ar, max_ar = compute_aspect_ratios(mesh)

    # Normal consistency
    normal_consistency_score = compute_normal_consistency(mesh)

    results = {
        "file": os.path.basename(obj_file),
        "path": obj_file,
        # Raw polygon composition (as read from .obj)
        "polygon_composition_raw": {
            "triangles": tri_count_raw,
            "quads": quad_count_raw,
            "ngons": ngon_count_raw
        },
        # Triangulated data from trimesh
        "vertex_count": vertex_count,
        "face_count_triangulated": face_count,
        "edge_count": edge_count,
        "is_watertight": is_watertight,
        "bounding_box_size": bounding_box_size,
        # UV data
        "uv_coverage": uv_results["uv_coverage"],
        "uv_overlap_count": uv_results["uv_overlap"],
        # Aspect Ratio
        "aspect_ratio_avg": avg_ar,
        "aspect_ratio_min": min_ar,
        "aspect_ratio_max": max_ar,
        # Normal consistency
        "normal_consistency_score": normal_consistency_score
    }
    return results

def main():
    if len(sys.argv) < 2:
        print("Usage: report_metrics.py <directory_or_obj_file_path>")
        sys.exit(1)

    input_path = sys.argv[1]
    # If input_path is a directory, find all .obj recursively
    # If input_path is a file, analyze just that file
    files_to_analyze = []

    if os.path.isdir(input_path):
        files_to_analyze = glob.glob(os.path.join(input_path, "**/*.obj"), recursive=True)
    else:
        # Single file
        if os.path.isfile(input_path) and input_path.lower().endswith(".obj"):
            files_to_analyze = [input_path]
        else:
            print("ERROR: Provided path is not a directory or an .obj file.")
            sys.exit(1)

    if not files_to_analyze:
        print(f"No .obj files found in {input_path}.")
        sys.exit(0)

    # Analyze each file
    for obj_file in tqdm(files_to_analyze):
        try:
            results = analyze_obj_file(obj_file)
            print(json.dumps(results))
        except Exception as e:
            err = {
                "file": obj_file,
                "error": str(e)
            }
            print(json.dumps(err), file=sys.stderr)

if __name__ == "__main__":
    main()
