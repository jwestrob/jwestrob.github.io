import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './background.css';

const PhyloBackground = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const frameIdRef = useRef(null);
  const nodesRef = useRef([]);
  const leafPositionsRef = useRef([]);
  const leafIndexRef = useRef(0);

  // Configuration parameters
  const MAX_DEPTH = 7;
  const SPHERE_RADIUS = 200;
  const SPRING_REST_LEN = 40;
  const SPRING_STRENGTH = 0.01;
  const REPULSION_STRENGTH = 4000;
  const DAMPING = 0.90;
  const TIME_STEP = 0.2;

  const generateStarPolygon = (sides, step) => {
    const baseIndices = Array.from({ length: sides }, (_, i) => i);
    const starIndices = [];
    let current = 0;
    while (true) {
      starIndices.push(current);
      current = (current + step) % sides;
      if (current === 0) break;
    }
    return starIndices.map(idx => {
      const angle = (2 * Math.PI * idx) / sides;
      return new THREE.Vector2(Math.cos(angle), Math.sin(angle));
    });
  };

  const rotateAroundX = (v, alpha) => {
    const c = Math.cos(alpha);
    const s = Math.sin(alpha);
    const y = v.y * c - v.z * s;
    const z = v.y * s + v.z * c;
    return new THREE.Vector3(v.x, y, z);
  };

  const rotateAroundZ = (v, alpha) => {
    const c = Math.cos(alpha);
    const s = Math.sin(alpha);
    const x = v.x * c - v.y * s;
    const y = v.x * s + v.y * c;
    return new THREE.Vector3(x, y, v.z);
  };

  const buildStarSphere = () => {
    const starSides = 7;
    const starStep = 2;
    const ringCount = 10;
    const baseStar2D = generateStarPolygon(starSides, starStep);
    const angleX = Math.PI / (ringCount - 1);
    const angleZ = (2 * Math.PI) / ringCount;
    const orbs = [];

    for (let i = 0; i < ringCount; i++) {
      for (let j = 0; j < ringCount; j++) {
        const alphaX = i * angleX;
        const alphaZ = j * angleZ;
        for (const p of baseStar2D) {
          const v3 = new THREE.Vector3(p.x, p.y, 0);
          const rx = rotateAroundX(v3, alphaX);
          const rz = rotateAroundZ(rx, alphaZ);
          rz.normalize().multiplyScalar(SPHERE_RADIUS);
          orbs.push(rz.clone());
        }
      }
    }
    return orbs;
  };

  const fibonacciSpherePositions = (count, radius) => {
    const pts = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      pts.push({ x: x * radius, y: y * radius, z: z * radius });
    }
    return pts;
  };

  const physicsStep = () => {
    const nodes = nodesRef.current;
    const nCount = nodes.length;
    const fx = new Array(nCount).fill(0);
    const fy = new Array(nCount).fill(0);
    const fz = new Array(nCount).fill(0);

    // Repulsion
    for (let i = 0; i < nCount; i++) {
      for (let j = i + 1; j < nCount; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dz = nodes[j].z - nodes[i].z;
        const distSq = dx * dx + dy * dy + dz * dz + 0.0001;
        const dist = Math.sqrt(distSq);
        const rep = REPULSION_STRENGTH / distSq;
        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;

        fx[i] -= rep * nx;
        fy[i] -= rep * ny;
        fz[i] -= rep * nz;
        fx[j] += rep * nx;
        fy[j] += rep * ny;
        fz[j] += rep * nz;
      }
    }

    // Spring forces
    for (let i = 0; i < nCount; i++) {
      for (const j of nodes[i].edges) {
        if (j > i) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dz = nodes[j].z - nodes[i].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.00001;
          const diff = dist - SPRING_REST_LEN;
          const force = SPRING_STRENGTH * diff;
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;

          fx[i] += force * nx;
          fy[i] += force * ny;
          fz[i] += force * nz;
          fx[j] -= force * nx;
          fy[j] -= force * ny;
          fz[j] -= force * nz;
        }
      }
    }

    // Integration and constraints
    for (let i = 0; i < nCount; i++) {
      const nd = nodes[i];

      if (nd.isRoot) {
        nd.x = nd.y = nd.z = 0;
        nd.vx = nd.vy = nd.vz = 0;
        continue;
      }

      nd.vx += fx[i] * TIME_STEP;
      nd.vy += fy[i] * TIME_STEP;
      nd.vz += fz[i] * TIME_STEP;

      nd.vx *= DAMPING;
      nd.vy *= DAMPING;
      nd.vz *= DAMPING;

      nd.x += nd.vx * TIME_STEP;
      nd.y += nd.vy * TIME_STEP;
      nd.z += nd.vz * TIME_STEP;

      if (nd.isLeaf) {
        const r2 = nd.x * nd.x + nd.y * nd.y + nd.z * nd.z;
        const r = Math.sqrt(r2);
        if (r < 0.0001) {
          const pos = leafPositionsRef.current[Math.floor(Math.random() * leafPositionsRef.current.length)];
          nd.x = pos.x;
          nd.y = pos.y;
          nd.z = pos.z;
          nd.vx = nd.vy = nd.vz = 0;
        } else {
          const ratio = SPHERE_RADIUS / r;
          nd.x *= ratio;
          nd.y *= ratio;
          nd.z *= ratio;

          const nx = nd.x / SPHERE_RADIUS;
          const ny = nd.y / SPHERE_RADIUS;
          const nz = nd.z / SPHERE_RADIUS;
          const vrad = nd.vx * nx + nd.vy * ny + nd.vz * nz;
          nd.vx -= vrad * nx;
          nd.vy -= vrad * ny;
          nd.vz -= vrad * nz;
        }
      } else if (!nd.isRoot) {
        const r2 = nd.x * nd.x + nd.y * nd.y + nd.z * nd.z;
        if (r2 > SPHERE_RADIUS * SPHERE_RADIUS) {
          const r = Math.sqrt(r2);
          const ratio = SPHERE_RADIUS / r;
          nd.x *= ratio;
          nd.y *= ratio;
          nd.z *= ratio;

          const nx = nd.x / SPHERE_RADIUS;
          const ny = nd.y / SPHERE_RADIUS;
          const nz = nd.z / SPHERE_RADIUS;
          const vrad = nd.vx * nx + nd.vy * ny + nd.vz * nz;
          nd.vx -= vrad * nx;
          nd.vy -= vrad * ny;
          nd.vz -= vrad * nz;
        }
      }
    }
  };

  useEffect(() => {
    const init = () => {
      // Scene setup
      sceneRef.current = new THREE.Scene();
      cameraRef.current = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      cameraRef.current.position.z = 500;

      rendererRef.current = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
      });
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);

      // Lighting
      const ambient = new THREE.AmbientLight(0xffffff, 0.3);
      sceneRef.current.add(ambient);
      const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
      pointLight.position.set(0, 0, 200);
      sceneRef.current.add(pointLight);

      // Initialize tree
      const totalLeaves = Math.pow(2, MAX_DEPTH);
      leafPositionsRef.current = fibonacciSpherePositions(totalLeaves, SPHERE_RADIUS);
      
      // Create geometry and materials
      const orbGeometry = new THREE.SphereGeometry(3, 8, 8);
      const orbMaterial = new THREE.MeshStandardMaterial({
        color: 0xffdd33,
        metalness: 0.8,
        roughness: 0.2,
      });

      // Build tree structure
      nodesRef.current = [];
      const edges = new THREE.Group();
      sceneRef.current.add(edges);

      // Root node
      nodesRef.current.push({
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        depth: 0,
        isRoot: true,
        isLeaf: false,
        edges: [],
        mesh: new THREE.Mesh(orbGeometry, orbMaterial)
      });

      // Add nodes and edges
      const buildTree = (parentIndex, depth) => {
        if (depth > MAX_DEPTH) return;

        const createNode = (isLeaf) => {
          const idx = nodesRef.current.length;
          const node = {
            x: 0, y: 0, z: 0,
            vx: 0, vy: 0, vz: 0,
            depth,
            isRoot: false,
            isLeaf,
            edges: [parentIndex],
            mesh: new THREE.Mesh(orbGeometry, orbMaterial)
          };

          if (isLeaf) {
            const pos = leafPositionsRef.current[leafIndexRef.current++];
            node.x = pos.x;
            node.y = pos.y;
            node.z = pos.z;
          } else {
            const r = (depth / MAX_DEPTH) * SPHERE_RADIUS;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            node.x = r * Math.sin(phi) * Math.cos(theta);
            node.y = r * Math.sin(phi) * Math.sin(theta);
            node.z = r * Math.cos(phi);
          }

          node.mesh.position.set(node.x, node.y, node.z);
          sceneRef.current.add(node.mesh);
          nodesRef.current.push(node);
          return idx;
        };

        const leftIdx = createNode(depth === MAX_DEPTH);
        const rightIdx = createNode(depth === MAX_DEPTH);

        nodesRef.current[parentIndex].edges.push(leftIdx, rightIdx);

        if (depth < MAX_DEPTH) {
          buildTree(leftIdx, depth + 1);
          buildTree(rightIdx, depth + 1);
        }
      };

      buildTree(0, 1);

      // Create edges
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffd700 });
      nodesRef.current.forEach((node, i) => {
        node.edges.forEach(j => {
          if (j > i) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(node.x, node.y, node.z),
              new THREE.Vector3(
                nodesRef.current[j].x,
                nodesRef.current[j].y,
                nodesRef.current[j].z
              )
            ]);
            edges.add(new THREE.Line(geometry, lineMaterial));
          }
        });
      });
    };

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      if (sceneRef.current && rendererRef.current && cameraRef.current) {
        physicsStep();

        // Update positions
        nodesRef.current.forEach(node => {
          node.mesh.position.set(node.x, node.y, node.z);
        });

        sceneRef.current.rotation.y += 0.001;
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    const handleResize = () =>