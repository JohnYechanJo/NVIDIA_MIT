// src/components/ImmersiveView.js

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';
import { MTLLoader } from 'three-stdlib';
import { PLYLoader } from 'three-stdlib'; 
import { OrbitControls } from 'three-stdlib';  // For basic mouse controls

function ImmersiveView() {
  const mountRef = useRef(null);

  useEffect(() => {
    // 1. Set up Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      60, 
      mountRef.current.clientWidth / mountRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    // 2. Add Basic Lighting (only matters for meshes with non-emissive materials)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // 3. Orbit Controls (so we can drag/zoom around the scene)
    const controls = new OrbitControls(camera, renderer.domElement);

    // 4. Create a loading manager (optional)
    const loadingManager = new THREE.LoadingManager();

    // 5. MTLLoader to load the .mtl file
    const mtlLoader = new MTLLoader(loadingManager);
    mtlLoader.setPath('/models/');          // Directory where .mtl file resides
    mtlLoader.load('material_0.mtl', (materials) => {
      // This ensures the material properties are all parsed
      materials.preload();

      // 6. OBJLoader uses the materials
      const objLoader = new OBJLoader(loadingManager);
      objLoader.setMaterials(materials);
      objLoader.setPath('/models/');
      objLoader.load('mesh.obj', (obj) => {
        // 7. The object is loaded with the correct material referencing material_0.png
        scene.add(obj);

        // Optionally, adjust position or scale
        obj.position.set(0, 0, 0);
        obj.scale.set(1, 1, 1);
      });
    });


    // // 8. Load the exported PLY (mesh or point cloud)
    // const loader = new PLYLoader();
    // // Suppose the .ply file is in public/ folder: public/models/scene.ply
    // loader.load('/models/poisson_mesh.ply', function (geometry) {
    //   // If it's a mesh, convert geometry to a Three.js mesh:
    //   // For a point cloud, you can use PointsMaterial instead (see next section).
      
    //   // For a standard Mesh
    //   geometry.computeVertexNormals();
    //   const material = new THREE.MeshStandardMaterial({ color: 0x999999 });
    //   const mesh = new THREE.Mesh(geometry, material);
    //   scene.add(mesh);
    // });

    // 9. Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();  // OrbitControls
      renderer.render(scene, camera);
    };
    animate();

    // 10. Cleanup on Unmount
    return () => {
      // Stop the animation loop, if you're calling it
      renderer.dispose(); // optional if you want to release resources
    
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div style={{ width: '100%', height: '100vh' }} ref={mountRef} />;
}

export default ImmersiveView;
