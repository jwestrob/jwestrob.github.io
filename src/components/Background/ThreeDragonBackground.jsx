import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import './background.css'; // Assuming you might want to reuse some styling

export default function ThreeDragonBackground() {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const groupRef = useRef(null); // For rotating the dragon curve

  const sphereRadius = 200;
  const iterations = 11;

  // 1. Dragon Curve Generation Logic (adapted from p5.js version)
  const dragonLines3D = useMemo(() => {
    const lines = [];

    // Helper to create a 2D vector
    const vec2 = (x, y) => new THREE.Vector2(x, y);

    function generateDragonCurve(iters) {
      let path = [vec2(0, 0), vec2(1, 0)];
      for (let i = 0; i < iters; i++) {
        path = iterateDragon(path);
      }
      return path;
    }

    function iterateDragon(path) {
      const pivot = path[path.length - 1].clone();
      const newPath = [...path];
      for (let i = path.length - 2; i >= 0; i--) {
        const dv = path[i].clone().sub(pivot);
        // 90° rotation: (dx, dy) → (−dy, dx)
        const rx = -dv.y;
        const ry = dv.x;
        newPath.push(pivot.clone().add(vec2(rx, ry)));
      }
      return newPath;
    }

    function find2DMinMax(pts) {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      for (let v of pts) {
        if (v.x < minX) minX = v.x;
        if (v.x > maxX) maxX = v.x;
        if (v.y < minY) minY = v.y;
        if (v.y > maxY) maxY = v.y;
      }
      return { minX, maxX, minY, maxY };
    }

    function sphericalToCartesian(theta, phi, r) {
      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(theta);
      return new THREE.Vector3(x, y, z);
    }

    const dragon2D = generateDragonCurve(iterations);
    const { minX, maxX, minY, maxY } = find2DMinMax(dragon2D);

    for (let i = 0; i < dragon2D.length - 1; i++) {
      const xA = THREE.MathUtils.mapLinear(dragon2D[i].x, minX, maxX, -1, 1);
      const yA = THREE.MathUtils.mapLinear(dragon2D[i].y, minY, maxY, -1, 1);
      const xB = THREE.MathUtils.mapLinear(dragon2D[i + 1].x, minX, maxX, -1, 1);
      const yB = THREE.MathUtils.mapLinear(dragon2D[i + 1].y, minY, maxY, -1, 1);

      const thetaA = THREE.MathUtils.mapLinear(yA, -1, 1, 0, Math.PI);
      const phiA   = THREE.MathUtils.mapLinear(xA, -1, 1, -Math.PI, Math.PI);
      const thetaB = THREE.MathUtils.mapLinear(yB, -1, 1, 0, Math.PI);
      const phiB   = THREE.MathUtils.mapLinear(xB, -1, 1, -Math.PI, Math.PI);

      const pA = sphericalToCartesian(thetaA, phiA, sphereRadius);
      const pB = sphericalToCartesian(thetaB, phiB, sphereRadius);
      lines.push({ pA, pB });
    }
    return lines;
  }, [iterations, sphereRadius]);


  useEffect(() => {
    const currentMount = mountRef.current;
    const parentElement = currentMount.parentElement;

    // Scene setup
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      parentElement.clientWidth / parentElement.clientHeight,
      0.1,
      1000
    );
    cameraRef.current.position.set(0, 0, 600); // Similar to p5 camera
    cameraRef.current.lookAt(0,0,0);

    // Renderer setup
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current.setSize(parentElement.clientWidth, parentElement.clientHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(rendererRef.current.domElement);

    // Group for rotation
    groupRef.current = new THREE.Group();
    sceneRef.current.add(groupRef.current);

    // Create line geometry
    const points = [];
    dragonLines3D.forEach(line => {
      points.push(line.pA.x, line.pA.y, line.pA.z);
      points.push(line.pB.x, line.pB.y, line.pB.z);
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

    // Material
    // For now, a simple gold color. Fog/alpha can be added later.
    const material = new THREE.LineBasicMaterial({
      color: 0xffd700, // Gold
      linewidth: 2, // Note: linewidth > 1 might not work on all platforms with LineBasicMaterial
                    // Consider LineMaterial from examples/jsm/lines/Line2.js for better width control
    });

    const lineSegments = new THREE.LineSegments(geometry, material);
    groupRef.current.add(lineSegments);
    
    // Fog (optional, can be refined)
    // sceneRef.current.fog = new THREE.Fog(0x000000, 500, 800); // color, near, far

    // Animation loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      if (groupRef.current) {
        groupRef.current.rotation.y += 0.003;
      }
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current || !parentElement) return;
      const width = parentElement.clientWidth;
      const height = parentElement.clientHeight;
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (currentMount && rendererRef.current && rendererRef.current.domElement) {
         // Check if domElement exists before trying to remove
        if (currentMount.contains(rendererRef.current.domElement)) {
            currentMount.removeChild(rendererRef.current.domElement);
        }
      }
      // Dispose geometries and materials if they are not shared
      if (geometry) geometry.dispose();
      if (material) material.dispose();
      sceneRef.current = null; // Help GC
      cameraRef.current = null;
      rendererRef.current = null;
      groupRef.current = null;
    };
  }, [dragonLines3D]); // Re-run effect if dragonLines3D changes (though it shouldn't with useMemo)

  return <div ref={mountRef} className="background-container" />;
}
