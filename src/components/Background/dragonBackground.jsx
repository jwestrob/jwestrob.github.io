import React, { useEffect, useRef } from 'react';
import p5 from 'p5';
import './background.css';

export default function DragonSphereBackground() {
  const sketchRef = useRef(null);

  useEffect(() => {
    let p5Instance;

    const sketch = (p) => {
      let dragonLines3D = [];
      const sphereRadius = 200;
      const iterations = 11;
      let angle = 0;

      p.setup = () => {
        const container = sketchRef.current.parentElement;
        p.createCanvas(container.clientWidth, container.clientHeight, p.WEBGL);

        // Position the camera similarly to your original code
        p.camera(0, 0, 600, 0, 0, 0, 0, 1, 0);

        // Generate the 2D dragon curve
        const dragon2D = generateDragonCurve(iterations);
        const { minX, maxX, minY, maxY } = find2DMinMax(dragon2D);

        // Map each segment onto the sphere
        for (let i = 0; i < dragon2D.length - 1; i++) {
          const xA = p.map(dragon2D[i].x,   minX, maxX, -1, 1);
          const yA = p.map(dragon2D[i].y,   minY, maxY, -1, 1);
          const xB = p.map(dragon2D[i + 1].x, minX, maxX, -1, 1);
          const yB = p.map(dragon2D[i + 1].y, minY, maxY, -1, 1);

          const thetaA = p.map(yA, -1, 1, 0, p.PI);
          const phiA   = p.map(xA, -1, 1, -p.PI, p.PI);
          const thetaB = p.map(yB, -1, 1, 0, p.PI);
          const phiB   = p.map(xB, -1, 1, -p.PI, p.PI);

          const pA = sphericalToCartesian(thetaA, phiA, sphereRadius);
          const pB = sphericalToCartesian(thetaB, phiB, sphereRadius);

          dragonLines3D.push({
            x1: pA.x, y1: pA.y, z1: pA.z,
            x2: pB.x, y2: pB.y, z2: pB.z,
          });
        }
      };

      p.draw = () => {
        p.background(0);
        angle += 0.003;

        p.strokeWeight(2);
        p.noFill();

        const cosA = p.cos(angle);
        const sinA = p.sin(angle);

        // Draw each segment with a simple fog fade
        for (let seg of dragonLines3D) {
          const rx1 = seg.x1 * cosA + seg.z1 * sinA;
          const rz1 = -seg.x1 * sinA + seg.z1 * cosA;
          const ry1 = seg.y1;

          const rx2 = seg.x2 * cosA + seg.z2 * sinA;
          const rz2 = -seg.x2 * sinA + seg.z2 * cosA;
          const ry2 = seg.y2;

          // Midpoint to measure distance to camera
          const midX = (rx1 + rx2) * 0.5;
          const midY = (ry1 + ry2) * 0.5;
          const midZ = (rz1 + rz2) * 0.5;

          // Fog effect
          const distToCam = p.dist(midX, midY, midZ, 0, 0, 600);
          const alphaVal = p.map(distToCam, 200, 1000, 255, 0, true);

          p.stroke(255, 215, 0, alphaVal);
          p.line(rx1, ry1, rz1, rx2, ry2, rz2);
        }
      };

      // Dragon curve helpers
      function generateDragonCurve(iters) {
        let path = [p.createVector(0, 0), p.createVector(1, 0)];
        for (let i = 0; i < iters; i++) {
          path = iterateDragon(path);
        }
        return path;
      }

      function iterateDragon(path) {
        const pivot = path[path.length - 1];
        const newPath = [...path];
        for (let i = path.length - 2; i >= 0; i--) {
          const dx = path[i].x - pivot.x;
          const dy = path[i].y - pivot.y;
          // 90° rotation about pivot => (dx, dy) → (−dy, dx)
          const rx = -dy;
          const ry = dx;
          newPath.push(p.createVector(pivot.x + rx, pivot.y + ry));
        }
        return newPath;
      }

      // Utilities
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
        const x = r * p.sin(theta) * p.cos(phi);
        const y = r * p.sin(theta) * p.sin(phi);
        const z = r * p.cos(theta);
        return p.createVector(x, y, z);
      }
    };

    p5Instance = new p5(sketch, sketchRef.current);
    return () => {
      p5Instance.remove();
    };
  }, []);

  const handleResize = () => {
    if (!p5Instance) return;
    const container = sketchRef.current.parentElement;
    p5Instance.resizeCanvas(container.clientWidth, container.clientHeight);
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="background-container">
      <div ref={sketchRef} />
    </div>
  );
}
