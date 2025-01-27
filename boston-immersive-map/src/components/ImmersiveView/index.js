// src/components/ImmersiveView.js
/* eslint-disable */
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';
import { MTLLoader } from 'three-stdlib';
import { FlyControls } from 'three-stdlib';
import { OrbitControls } from 'three-stdlib';  // For basic mouse controls
import { EXRLoader } from 'three-stdlib';
// PMREMGenerator 用于将 equirectangular 贴图转成 WebGL 适用的 Environment Map
import { PMREMGenerator } from 'three';
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
    // const controls = new OrbitControls(camera, renderer.domElement);

    // FlyControls
    const controls = new FlyControls(camera, renderer.domElement);
    controls.movementSpeed = 2; // how fast to move around
    controls.rollSpeed = Math.PI / 3; // how fast to roll
    controls.dragToLook = true; // if true, you must click-drag to rotate
    controls.autoForward = false; // if true, you always move forward

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

    // 4. 使用 EXRLoader 加载 museum.exr
    const exrLoader = new EXRLoader();
    const pmremGenerator = new PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    exrLoader.load(`/textures/${itemId}.exr`, (texture) => {
      // 将 equirectangular EXR 转换成 PMREM 的贴图
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      // 设置场景的背景和环境
      scene.background = envMap;
      scene.environment = envMap;

      // 注意：转成 PMREM 后原始贴图可以释放
      texture.dispose();
    });

    // 9. Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      controls.update(delta);
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
        <h1 className="project-title">{siteId.split('-').join(' ').toUpperCase()}</h1>
        <p className="project-subtitle">
          Reconstructed {itemId.split('-').join(' ').toUpperCase()} in 3D.
        </p>
        <p>
          A: Left; D: Right; W: Forward; S: Backward; R: Up; F: Down; Q: Roll Left; E: Roll Right; Click-drag: Look Around
        </p>
        <br />
        <button className="explore-button" onClick={() => window.history.back()}>
          Explore More
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
