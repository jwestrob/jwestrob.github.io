import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './background.css';

const Background = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const frameIdRef = useRef(null);

  const sphereRadius = 7.0;
  const orbSize = 0.015;
  const starSides = 7;
  const starStep = 2;
  const ringCount = 10;

  useEffect(() => {
    const orbs = [];
    const orbInfos = [];
    const connections = new Set();
    const edges = new THREE.Group();

    function generateStarPolygon(sides, step) {
      const baseIndices = [];
      for (let i = 0; i < sides; i++) {
        baseIndices.push(i);
      }
      const starIndices = [];
      let current = 0;
      while (true) {
        starIndices.push(current);
        current = (current + step) % sides;
        if (current === 0) break;
      }
      const points2D = [];
      for (let idx of starIndices) {
        const angle = (2 * Math.PI * idx) / sides;
        const x = Math.cos(angle);
        const y = Math.sin(angle);
        points2D.push(new THREE.Vector2(x, y));
      }
      return points2D;
    }

    function rotateAroundX(v, alpha) {
      const c = Math.cos(alpha);
      const s = Math.sin(alpha);
      const y = v.y * c - v.z * s;
      const z = v.y * s + v.z * c;
      return new THREE.Vector3(v.x, y, z);
    }

    function rotateAroundZ(v, alpha) {
      const c = Math.cos(alpha);
      const s = Math.sin(alpha);
      const x = v.x * c - v.y * s;
      const y = v.x * s + v.y * c;
      return new THREE.Vector3(x, y, v.z);
    }

    function buildStarSphere() {
      const baseStar2D = generateStarPolygon(starSides, starStep);
      const angleX = Math.PI / (ringCount - 1);
      const angleZ = (2 * Math.PI) / ringCount;
      for (let i = 0; i < ringCount; i++) {
        for (let j = 0; j < ringCount; j++) {
          const alphaX = i * angleX;
          const alphaZ = j * angleZ;
          for (let p of baseStar2D) {
            const v3 = new THREE.Vector3(p.x, p.y, 0);
            const rx = rotateAroundX(v3, alphaX);
            const rz = rotateAroundZ(rx, alphaZ);
            rz.normalize().multiplyScalar(sphereRadius);
            orbs.push(rz.clone());
          }
        }
      }
    }

    function addOrbs() {
      const orbGeo = new THREE.SphereGeometry(1, 8, 8);
      for (let i = 0; i < orbs.length; i++) {
        const mesh = new THREE.Mesh(
          orbGeo,
          new THREE.MeshStandardMaterial({
            color: 0xffdd33, // gold
            metalness: 0.8,
            roughness: 0.2,
          })
        );
        mesh.position.copy(orbs[i]);
        mesh.scale.set(orbSize, orbSize, orbSize);
        sceneRef.current.add(mesh);
        orbInfos.push({ mesh, position: orbs[i].clone() });
      }
    }

    function connectNearestNeighbors() {
      sceneRef.current.add(edges);

      function getSurfacePoint(c1, c2, r) {
        const dir = c2.clone().sub(c1).normalize();
        return c1.clone().add(dir.multiplyScalar(r));
      }

      for (let i = 0; i < orbInfos.length; i++) {
        const distances = [];
        for (let j = 0; j < orbInfos.length; j++) {
          if (i === j) continue;
          const dist = orbInfos[i].position.distanceTo(orbInfos[j].position);
          distances.push({ index: j, dist });
        }
        distances.sort((a, b) => a.dist - b.dist);

        const minDist = distances[0].dist;
        let secondDist = Infinity,
          thirdDist = Infinity;

        for (let d = 1; d < distances.length; d++) {
          if (distances[d].dist > minDist) {
            secondDist = distances[d].dist;
            break;
          }
        }
        for (let d = 1; d < distances.length; d++) {
          if (distances[d].dist > secondDist) {
            thirdDist = distances[d].dist;
            break;
          }
        }

        const minDistIndices = distances
          .filter((d) => Math.abs(d.dist - minDist) < 1e-12)
          .map((d) => d.index);
        const secondDistIndices =
          secondDist < Infinity
            ? distances
                .filter((d) => Math.abs(d.dist - secondDist) < 1e-12)
                .map((d) => d.index)
            : [];
        const thirdDistIndices =
          thirdDist < Infinity
            ? distances
                .filter((d) => Math.abs(d.dist - thirdDist) < 1e-12)
                .map((d) => d.index)
            : [];

        function connect(i, j) {
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (!connections.has(key)) {
            connections.add(key);
            const start = getSurfacePoint(orbInfos[i].position, orbInfos[j].position, orbSize);
            const end = getSurfacePoint(orbInfos[j].position, orbInfos[i].position, orbSize);
            const lineGeo = new THREE.BufferGeometry().setFromPoints([start, end]);
            const lineMat = new THREE.LineBasicMaterial({ color: 0xffd700 });
            edges.add(new THREE.Line(lineGeo, lineMat));
          }
        }

        minDistIndices.forEach((idx) => connect(i, idx));
        secondDistIndices.forEach((idx) => connect(i, idx));
        thirdDistIndices.forEach((idx) => connect(i, idx));
      }
    }

    function initScene() {
      sceneRef.current = new THREE.Scene();
      cameraRef.current = new THREE.PerspectiveCamera(
        75,
        canvasRef.current.clientWidth / canvasRef.current.clientHeight,
        0.1,
        1000
      );
      cameraRef.current.position.z = 16;

      rendererRef.current = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
      });
      rendererRef.current.setSize(
        canvasRef.current.clientWidth,
        canvasRef.current.clientHeight
      );

      // Minimal lighting
      const ambient = new THREE.AmbientLight(0xffffff, 0.3);
      sceneRef.current.add(ambient);
      const pointLight = new THREE.PointLight(0xffffff, 1, 100);
      pointLight.position.set(0, 0, 10);
      sceneRef.current.add(pointLight);
    }

    function animate() {
      frameIdRef.current = requestAnimationFrame(animate);
      if (sceneRef.current && rendererRef.current && cameraRef.current) {
        sceneRef.current.rotation.y += 0.001; // slow rotation
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }

    function handleResize() {
      if (!rendererRef.current || !cameraRef.current || !canvasRef.current) return;
      
      canvasRef.current.style.width = `${window.innerWidth}px`;
      canvasRef.current.style.height = `${window.innerHeight}px`;
      
      rendererRef.current.setSize(
        canvasRef.current.clientWidth,
        canvasRef.current.clientHeight
      );
      cameraRef.current.aspect =
        canvasRef.current.clientWidth / canvasRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
    }

    // Initialize
    canvasRef.current.style.width = `${window.innerWidth}px`;
    canvasRef.current.style.height = `${window.innerHeight}px`;
    
    initScene();
    buildStarSphere();
    addOrbs();
    connectNearestNeighbors();
    animate();

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="background-container">
      <canvas ref={canvasRef} id="backgroundCanvas" />
    </div>
  );
};

export default Background;