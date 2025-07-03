import React, { useEffect, useRef } from 'react';
import p5 from 'p5';
import './background.css';

export default function PhyloExpansionBackground() {
  const sketchRef = useRef(null);

  useEffect(() => {
    let p5Instance;

    // We'll wrap all p5 logic in a function that receives the "sketch" object
    const sketch = (p) => {
      /***************************************************************
       * Below is the final code from our p5 fractal/phylogenetic tree
       * example, slightly adapted to run inside a React effect.
       ***************************************************************/

      // ============= CONFIGURABLE PARAMETERS =============
      let MAX_DEPTH          = 5;       // Adjust to your liking
      let SPHERE_RADIUS      = 300;     // Radius for the sphere surface
      let SPRING_REST_LEN    = 40;      // Desired parent–child distance
      let SPRING_STRENGTH    = 0.01;    // Spring constant
      let REPULSION_STRENGTH = 4000;    // Node–node repulsion factor
      let DAMPING            = 0.90;    // Velocity damping
      let TIME_STEP          = 0.2;     // Integration time step

      // We'll store all nodes in an array:
      /// node = {
      ///   x, y, z,        // position
      ///   vx, vy, vz,     // velocity
      ///   depth,          // tree depth (0 => root, MAX_DEPTH => leaf)
      ///   isRoot, isLeaf, // booleans
      ///   edges: []       // connected node indices
      /// }
      let nodes = [];

      // For leaves, we’ll use "Fibonacci sphere" positions to spread them out.
      let leafPositions = [];
      let leafIndex = 0;

      // We can optionally store real phylogenetic data from "phylo.txt" here.
      // let realTreeData = null;

      // p5 setup
      p.setup = async () => {
        // If you want to load real data from 'phylo.txt', do it here
        // realTreeData = await loadTreeFile();
        // parse realTreeData as needed, or build your tree from it
        // For this example, we’ll keep the existing procedural approach.

        const container = sketchRef.current.parentElement;
p.createCanvas(container.clientWidth, container.clientHeight, p.WEBGL);

        // Position camera so we can see everything
        p.camera(0, 0, 900, 0, 0, 0, 0, 1, 0);
        p.strokeWeight(2);
        p.noFill();

        // Number of leaves in a full binary tree is 2^MAX_DEPTH
        let totalLeaves = Math.pow(2, MAX_DEPTH);
        // Generate uniform positions for leaves on the sphere
        leafPositions = fibonacciSpherePositions(totalLeaves, SPHERE_RADIUS);

        // Build the full binary tree
        buildBinaryTree(MAX_DEPTH);

        // Pre-relaxation steps
        for (let i = 0; i < 200; i++) {
          physicsStep();
        }
      };

      p.draw = () => {
        p.background(0);
        // Slow rotation
        p.rotateY(p.frameCount * 0.003);
        p.rotateX(p.frameCount * 0.001);

        // (Optional) sphere reference
        // p.stroke(80);
        // p.sphere(SPHERE_RADIUS);
        // p.stroke(255, 215, 0);

        // Layout step
        physicsStep();

        // Draw edges in gold
        p.stroke(255, 215, 0);
        for (let i = 0; i < nodes.length; i++) {
          let ndA = nodes[i];
          for (let j of ndA.edges) {
            if (j > i) {
              let ndB = nodes[j];
              p.line(ndA.x, ndA.y, ndA.z, ndB.x, ndB.y, ndB.z);
            }
          }
        }
      };

      /***************************************************************
       * Below: the same helpers from the final code snippet
       ***************************************************************/

      function buildBinaryTree(maxDepth) {
        // Root
        nodes.push({
          x: 0, y: 0, z: 0,
          vx: 0, vy: 0, vz: 0,
          depth: 0,
          isRoot: true,
          isLeaf: false,
          edges: []
        });
        buildSubtree(0, 1, maxDepth);
      }

      function buildSubtree(parentIndex, d, maxDepth) {
        if (d > maxDepth) return;
        let leftIdx  = createNodeAtDepth(d, d === maxDepth);
        let rightIdx = createNodeAtDepth(d, d === maxDepth);

        nodes[parentIndex].edges.push(leftIdx, rightIdx);
        nodes[leftIdx].edges.push(parentIndex);
        nodes[rightIdx].edges.push(parentIndex);

        if (d < maxDepth) {
          buildSubtree(leftIdx,  d + 1, maxDepth);
          buildSubtree(rightIdx, d + 1, maxDepth);
        }
      }

      function createNodeAtDepth(depth, isLeaf) {
        let idx = nodes.length;
        let nd = {
          x: 0, y: 0, z: 0,
          vx: 0, vy: 0, vz: 0,
          depth: depth,
          isRoot: false,
          isLeaf: isLeaf,
          edges: []
        };
        if (isLeaf) {
          // Assign next position from the uniform sphere set
          let pos = leafPositions[leafIndex++];
          nd.x = pos.x;
          nd.y = pos.y;
          nd.z = pos.z;
        } else {
          // Internal node => radius depends on depth
          let rFrac = depth / MAX_DEPTH;
          let r = rFrac * SPHERE_RADIUS;
          let theta = p.random(p.TWO_PI);
          let phi   = p.random(p.PI);
          nd.x = r * p.sin(phi) * p.cos(theta);
          nd.y = r * p.sin(phi) * p.sin(theta);
          nd.z = r * p.cos(phi);
          nd.x += p.random(-5,5);
          nd.y += p.random(-5,5);
          nd.z += p.random(-5,5);
        }
        nodes.push(nd);
        return idx;
      }

      function physicsStep() {
        let nCount = nodes.length;
        let fx = new Array(nCount).fill(0);
        let fy = new Array(nCount).fill(0);
        let fz = new Array(nCount).fill(0);

        // (1) Repulsion
        for (let i = 0; i < nCount; i++) {
          for (let j = i+1; j < nCount; j++) {
            let dx = nodes[j].x - nodes[i].x;
            let dy = nodes[j].y - nodes[i].y;
            let dz = nodes[j].z - nodes[i].z;
            let distSq = dx*dx + dy*dy + dz*dz + 0.0001;
            let dist   = p.sqrt(distSq);
            let rep = REPULSION_STRENGTH / distSq;
            let nx = dx/dist, ny = dy/dist, nz = dz/dist;
            fx[i] -= rep * nx;  fy[i] -= rep * ny;  fz[i] -= rep * nz;
            fx[j] += rep * nx;  fy[j] += rep * ny;  fz[j] += rep * nz;
          }
        }

        // (2) Springs
        for (let i = 0; i < nCount; i++) {
          for (let j of nodes[i].edges) {
            if (j > i) {
              let dx = nodes[j].x - nodes[i].x;
              let dy = nodes[j].y - nodes[i].y;
              let dz = nodes[j].z - nodes[i].z;
              let dist = p.sqrt(dx*dx + dy*dy + dz*dz) + 0.00001;
              let diff = dist - SPRING_REST_LEN;
              let force = SPRING_STRENGTH * diff;
              let nx = dx/dist, ny = dy/dist, nz = dz/dist;
              fx[i] +=  force * nx;  fy[i] +=  force * ny;  fz[i] +=  force * nz;
              fx[j] -=  force * nx;  fy[j] -=  force * ny;  fz[j] -=  force * nz;
            }
          }
        }

        // (3) Integrate
        for (let i = 0; i < nCount; i++) {
          let nd = nodes[i];
          // Root pinned
          if (nd.isRoot) {
            nd.x=0; nd.y=0; nd.z=0;
            nd.vx=0; nd.vy=0; nd.vz=0;
            continue;
          }

          // Accel
          nd.vx += fx[i] * TIME_STEP;
          nd.vy += fy[i] * TIME_STEP;
          nd.vz += fz[i] * TIME_STEP;
          // Damping
          nd.vx *= DAMPING;
          nd.vy *= DAMPING;
          nd.vz *= DAMPING;
          // Position
          nd.x += nd.vx * TIME_STEP;
          nd.y += nd.vy * TIME_STEP;
          nd.z += nd.vz * TIME_STEP;
        }

        // (4) Constraints
        for (let i = 0; i < nCount; i++) {
          let nd = nodes[i];
          if (nd.isLeaf) {
            // clamp to sphere
            let r2 = nd.x*nd.x + nd.y*nd.y + nd.z*nd.z;
            let r  = p.sqrt(r2);
            if (r < 0.0001) {
              // re-init if collapsed
              let pos = leafPositions[Math.floor(p.random(leafPositions.length))];
              nd.x = pos.x; nd.y = pos.y; nd.z = pos.z;
              nd.vx=0; nd.vy=0; nd.vz=0;
            } else {
              // fix radius
              let ratio = SPHERE_RADIUS / r;
              nd.x *= ratio; nd.y *= ratio; nd.z *= ratio;
              // remove radial velocity
              let nx = nd.x / SPHERE_RADIUS;
              let ny = nd.y / SPHERE_RADIUS;
              let nz = nd.z / SPHERE_RADIUS;
              let vrad = nd.vx*nx + nd.vy*ny + nd.vz*nz;
              nd.vx -= vrad*nx; nd.vy -= vrad*ny; nd.vz -= vrad*nz;
            }
          }
          else if (!nd.isRoot) {
            // internal node => keep inside sphere
            let r2 = nd.x*nd.x + nd.y*nd.y + nd.z*nd.z;
            if (r2 > SPHERE_RADIUS*SPHERE_RADIUS) {
              let r = p.sqrt(r2);
              let ratio = SPHERE_RADIUS / r;
              nd.x *= ratio; nd.y *= ratio; nd.z *= ratio;
              // remove outward velocity
              let nx = nd.x / SPHERE_RADIUS;
              let ny = nd.y / SPHERE_RADIUS;
              let nz = nd.z / SPHERE_RADIUS;
              let vrad = nd.vx*nx + nd.vy*ny + nd.vz*nz;
              nd.vx -= vrad*nx; nd.vy -= vrad*ny; nd.vz -= vrad*nz;
            }
          }
        }
      }

      // Helper: Generate 'count' nearly uniform points on a sphere via Fibonacci
      function fibonacciSpherePositions(count, radius) {
        let pts = [];
        let phi = Math.PI * (3 - Math.sqrt(5));  // golden angle
        for (let i = 0; i < count; i++) {
          let y = 1 - (i / (count - 1)) * 2;  // from +1 to -1
          let r = Math.sqrt(1 - y*y);
          let theta = phi * i;
          let x = Math.cos(theta) * r;
          let z = Math.sin(theta) * r;
          pts.push({ x: x*radius, y: y*radius, z: z*radius });
        }
        return pts;
      }
    }; // end of p5 sketch definition

    // Create the p5 instance
    p5Instance = new p5(sketch, sketchRef.current);

    // Cleanup on unmount
    return () => {
      if (p5Instance) {
        p5Instance.remove();
      }
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