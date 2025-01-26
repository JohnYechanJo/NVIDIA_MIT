// src/components/ImmersiveView.js
/* eslint-disable */
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';
import { MTLLoader } from 'three-stdlib';
import { PLYLoader } from 'three-stdlib';
import { OrbitControls } from 'three-stdlib';  // For basic mouse controls
import "./index.css"; // Import CSS for this component
import { useParams } from 'react-router-dom'; // useParams를 가져옴

function ImmersiveView() {
  const mountRef = useRef(null);
  const { siteId, itemId } = useParams(); // URL parameter

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

    // 2. Add Basic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // 3. Orbit Controls (for drag/zoom)
    const controls = new OrbitControls(camera, renderer.domElement);

    // 4. Create a loading manager (optional)
    const loadingManager = new THREE.LoadingManager();

    // 5. MTLLoader to load the .mtl file
    // NOTE the trailing slash here:
    const itemPath = `/models/${itemId}/`;
    console.log(itemPath);

    const mtlLoader = new MTLLoader(loadingManager);
    mtlLoader.setPath(itemPath);

    mtlLoader.load('mtl.mtl', (materials) => {
      materials.preload();

      // 6. OBJLoader uses the materials
      const objLoader = new OBJLoader(loadingManager);
      objLoader.setMaterials(materials);
      objLoader.setPath(itemPath);

      objLoader.load('obj.obj', (obj) => {
        // 7. The object is loaded with the correct material
        scene.add(obj);

        // Optionally adjust position or scale
        obj.position.set(0, 0, 0);
        obj.scale.set(1, 1, 1);
      });
    });

    // 9. Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();  // OrbitControls
      renderer.render(scene, camera);
    };
    animate();

    // 10. Cleanup on Unmount
    return () => {
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [itemId, siteId]);

  return (
    <div className="app-container">
      {/* 상단 프로젝트 정보 박스 */}
      <div className="project-info-box">
        <h1 className="project-title">{siteId}</h1>
        <p className="project-subtitle">
          Reconstructing Historic Objects with Nerfstudio
        </p>
      </div>

      {/* Three.js 렌더링 영역 */}
      <div
        className="immersive-view-renderer"
        style={{ width: '100%', height: '100%' }}
        ref={mountRef}
      />
    </div>
  );
}

export default ImmersiveView;
