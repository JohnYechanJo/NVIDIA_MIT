// src/components/ImmersiveView.js

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';
import { MTLLoader } from 'three-stdlib';
import { FlyControls } from 'three-stdlib';
import { OrbitControls } from 'three-stdlib';
import { EXRLoader } from 'three-stdlib';
import { PMREMGenerator } from 'three';
import "./index.css";
import { useParams } from 'react-router-dom';

function ImmersiveView() {
  const mountRef = useRef(null);
  const { siteId, itemId } = useParams();

  // Simple mobile detection (you could also use other libraries or checks)
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  // console.log(isMobile);

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

    // 3. Conditionally set controls
    let controls;
    if (isMobile) {
      // Use OrbitControls on mobile
      controls = new OrbitControls(camera, renderer.domElement);
      // Optionally tweak OrbitControls settings here
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
      // ...
    } else {
      // Use FlyControls on desktop
      controls = new FlyControls(camera, renderer.domElement);
      controls.movementSpeed = 2;
      controls.rollSpeed = Math.PI / 3;
      controls.dragToLook = true;
      controls.autoForward = false;
    }

    // 4. Create a loading manager (optional)
    const loadingManager = new THREE.LoadingManager();

    // 5. MTLLoader to load the .mtl file
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
        obj.position.set(0, 0, 0);
        obj.scale.set(1, 1, 1);
      });
    });

    // 8. Load environment map with EXR
    const exrLoader = new EXRLoader();
    const pmremGenerator = new PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    exrLoader.load(`/textures/${itemId}.exr`, (texture) => {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.background = envMap;
      scene.environment = envMap;
      texture.dispose();
    });

    // 9. Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      // If using FlyControls, it expects update(delta)
      // If using OrbitControls, it can also use update() for damping
      controls.update && controls.update(delta);
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
  }, [itemId, siteId, isMobile]);

  return (
    <div className="app-container">
      {/* 상단 프로젝트 정보 박스 */}
      <div className="project-info-box">
        <h1 className="project-title">
          {siteId.split('-').join(' ').toUpperCase()}
        </h1>
        <p className="project-subtitle">
          Reconstructed {itemId.split('-').join(' ').toUpperCase()} in 3D.
        </p>

        {/* Only show instructions if NOT mobile */}
        {!isMobile && (
          <p>
            A: Left; D: Right; W: Forward; S: Backward; R: Up; F: Down; Q: Roll Left; E: Roll Right; Click-drag: Look Around
          </p>
        )}

        {isMobile && (
          <p>Switch to laptop for better experience</p>
        )}
        
        <br />
        <button className="explore-button" onClick={() => window.history.back()}>
          Back to Map
        </button>
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
