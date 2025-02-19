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

  // Utility for clamped range mapping (like "fog fade")
  function mapRange(value, inMin, inMax, outMin, outMax) {
    const t = Math.max(0, Math.min(1, (value - inMin) / (inMax - inMin)));
    return outMin + t * (outMax - outMin);
  }

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
        // Ensure we enable transparency on materials
        const mesh = new THREE.Mesh(
          orbGeo,
          new THREE.MeshStandardMaterial({
            color: 0xffdd33, // gold
            metalness: 0.8,
            roughness: 0.2,
            transparent: true,
            opacity: 1.0,
          })
        );
        mesh.position.copy(orbs[i]);
        mesh.scale.set(orbSize, orbSize, orbSize);
        sceneRef.current.add(mesh);
        orbInfos.push({ mesh, position: orbs[i].clone() });
      }
    }

    // Add the 4th closest neighbor, plus dynamic line materials (transparent)
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

        // Group indices by their distances
        const distanceGroups = [];
        let currentGroup = [distances[0]];
        let currentDist = distances[0].dist;

        for (let d = 1; d < distances.length; d++) {
          if (Math.abs(distances[d].dist - currentDist) < 1e-12) {
            currentGroup.push(distances[d]);
          } else {
            distanceGroups.push(currentGroup);
            currentGroup = [distances[d]];
            currentDist = distances[d].dist;
          }
        }
        if (currentGroup.length > 0) {
          distanceGroups.push(currentGroup);
        }

        // Connect to nodes in the first 6 distance groups
        for (let g = 0; g < Math.min(5, distanceGroups.length); g++) {
          const group = distanceGroups[g];
          group.forEach(({ index }) => {
            const key = i < index ? `${i}-${index}` : `${index}-${i}`;
            if (!connections.has(key)) {
              connections.add(key);
              const start = getSurfacePoint(
                orbInfos[i].position,
                orbInfos[index].position,
                orbSize
              );
              const end = getSurfacePoint(
                orbInfos[index].position,
                orbInfos[i].position,
                orbSize
              );
              const lineGeo = new THREE.BufferGeometry().setFromPoints([start, end]);
              const lineMat = new THREE.LineBasicMaterial({
                color: 0xffd700,
                transparent: true,
                opacity: 1.0,
              });
              edges.add(new THREE.Line(lineGeo, lineMat));
            }
          });
        }
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

    // Dynamically adjust opacity of orbs & lines based on distance to camera
    function applyFog() {
      if (!cameraRef.current) return;
      const camPos = new THREE.Vector3();
      cameraRef.current.getWorldPosition(camPos);

      // Fog orbs
      for (let orb of orbInfos) {
        const orbWorldPos = new THREE.Vector3();
        orb.mesh.getWorldPosition(orbWorldPos);
        const dist = orbWorldPos.distanceTo(camPos);
        // Example: fade from fully opaque at distance ~5 to fully invisible at ~25
        const alphaVal = mapRange(dist, 5, 25, 1, 0);
        orb.mesh.material.opacity = alphaVal;
        orb.mesh.material.transparent = true;
      }

      // Fog lines (in edges group)
      edges.children.forEach((line) => {
        if (line.geometry && !line.geometry.boundingSphere) {
          line.geometry.computeBoundingSphere();
        }
        if (!line.geometry.boundingSphere) return;

        // The bounding sphere center in local coords
        const center = line.geometry.boundingSphere.center.clone();
        // Convert to world coords
        line.localToWorld(center);

        const dist = center.distanceTo(camPos);
        const alphaVal = mapRange(dist, 5, 25, 1, 0);
        line.material.opacity = alphaVal;
        line.material.transparent = true;
      });
    }

    function animate() {
      frameIdRef.current = requestAnimationFrame(animate);
      if (sceneRef.current && rendererRef.current && cameraRef.current) {
        // Slow rotation
        sceneRef.current.rotation.y += 0.001;

        // Update fog each frame
        applyFog();

        // Render
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    }

    function handleResize() {
      if (!rendererRef.current || !cameraRef.current || !canvasRef.current) return;

      const container = canvasRef.current.parentElement;
      canvasRef.current.style.width = `${container.clientWidth}px`;
      canvasRef.current.style.height = `${container.clientHeight}px`;

      rendererRef.current.setSize(
        canvasRef.current.clientWidth,
        canvasRef.current.clientHeight
      );
      cameraRef.current.aspect =
        canvasRef.current.clientWidth / canvasRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
    }

    // Initialize
    const container = canvasRef.current.parentElement;
    canvasRef.current.style.width = `${container.clientWidth}px`;
    canvasRef.current.style.height = `${container.clientHeight}px`;

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
