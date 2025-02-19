// OrbitalSimBackground.jsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './background.css';

const OrbitalSimBackground = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const frameIdRef = useRef(null);

  // ====================== CONFIGURATION ======================
  // Star radii: one small white star, one large red star
  const smallStarRadius = 0.72;  // 30% of original 2.4
  const largeStarRadius = 4.8;   // 200% of original 2.4

  // Define two stars with different sizes orbiting the barycenter
  const starData = [
    { orbitRadius: 8, speed: 0.015, angle: 0, radius: smallStarRadius, color: 0xffd700, emissive: 0xffd700 },
    { orbitRadius: 8, speed: 0.015, angle: Math.PI, radius: largeStarRadius, color: 0xffd700, emissive: 0xffd700 },
  ];

  // Increased spacing between stars and first planet
  const planetData = [
    { orbitRadius: 24, size: 1.2, speed: 0.0010, angle: Math.random() * Math.PI * 2 },
    { orbitRadius: 32, size: 1.6, speed: 0.0007, angle: Math.random() * Math.PI * 2 },
    { orbitRadius: 40, size: 1.36, speed: 0.0005, angle: Math.random() * Math.PI * 2 },
    // Outer gas giant
    { orbitRadius: 72, size: 2.24, speed: 0.0003, angle: Math.random() * Math.PI * 2 },
  ];

  // Asteroid belt parameters — around the region where the 4th planet used to be.
  const asteroidBelt = {
    innerRadius: 48,
    outerRadius: 56,
    count: 100, // number of asteroids to scatter
  };

  // A moon orbiting the gas giant (the last planet in planetData).
  const moonData = {
    orbitRadius: 5, // relative to the gas giant center
    size: 0.6,
    speed: 0.002,
    angle: Math.random() * Math.PI * 2,
  };

  // Refs for star, planet, ring, asteroid, and moon meshes
  const starsRef = useRef([]);
  const starLightsRef = useRef([]);
  const planetsRef = useRef([]);
  const ringsRef = useRef([]);
  const asteroidMeshesRef = useRef([]);
  const moonRef = useRef(null);
  const moonRingRef = useRef(null);

  useEffect(() => {
    // ============== 1. SCENE, CAMERA, RENDERER ==============
    sceneRef.current = new THREE.Scene();
    // Slight tilt of the orbital plane:
    sceneRef.current.rotation.x = Math.PI / 6; // 30-degree tilt

    cameraRef.current = new THREE.PerspectiveCamera(
      60,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      2000
    );
    // Position camera to look at barycenter from above
    cameraRef.current.position.set(0, 0, 200);
    cameraRef.current.lookAt(0, 0, 0);

    rendererRef.current = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    rendererRef.current.setSize(
      canvasRef.current.clientWidth,
      canvasRef.current.clientHeight
    );
    rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ============== 2. LIGHTS ==============
    // Low ambient + separate point lights for each star.
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    sceneRef.current.add(ambientLight);

    // ============== 3. BINARY STARS ==============
    const starMeshes = [];
    const starLights = [];
    starData.forEach((star) => {
      // Custom geometry and material for each star
      const starGeo = new THREE.SphereGeometry(star.radius, 16, 16);
      const starMat = new THREE.MeshStandardMaterial({
        color: star.color,
        emissive: star.emissive,
        emissiveIntensity: 0.5,
        metalness: 0.7,
        roughness: 0.3,
      });

      // Mesh
      const starMesh = new THREE.Mesh(starGeo, starMat);
      sceneRef.current.add(starMesh);
      starMeshes.push(starMesh);

      // Light
      const starLight = new THREE.PointLight(0xffffff, 1.5, 1000);
      sceneRef.current.add(starLight);
      starLights.push(starLight);
    });
    starsRef.current = starMeshes;
    starLightsRef.current = starLights;

    // ============== 4. PLANETS AND ORBIT RINGS ==============
    const planetMeshes = [];
    const ringMeshes = [];
    const planetGeo = new THREE.SphereGeometry(1, 16, 16);

    planetData.forEach((planet) => {
      // Planet mesh
      const planetMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: -1,
        roughness: 0,
      });
      const mesh = new THREE.Mesh(planetGeo, planetMat);
      mesh.scale.set(planet.size, planet.size, planet.size);
      sceneRef.current.add(mesh);
      planetMeshes.push(mesh);

      // Orbit ring
      const ringGeo = new THREE.RingGeometry(
        planet.orbitRadius - 0.05,
        planet.orbitRadius + 0.05,
        64
      );
      ringGeo.rotateX(-Math.PI / 2); // Lay flat in the XZ plane
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      sceneRef.current.add(ring);
      ringMeshes.push(ring);
    });

    planetsRef.current = planetMeshes;
    ringsRef.current = ringMeshes;

    // ============== 5. ASTEROID BELT ==============
    // We'll place random small rocks in the radial band [innerRadius, outerRadius].
    const asteroids = [];
    const asteroidGeometry = new THREE.SphereGeometry(0.16, 8, 8); // small rock
    const asteroidMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0,
        roughness: 0.2,
      });

    // Store initial positions and speeds for each asteroid
    const asteroidData = [];

    for (let i = 0; i < asteroidBelt.count; i++) {
      // Random angle
      const angle = Math.random() * Math.PI * 2;
      // Random radial distance within the belt range
      const radius =
        asteroidBelt.innerRadius +
        (asteroidBelt.outerRadius - asteroidBelt.innerRadius) * Math.random();
      // Position in the XZ plane
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);

      const rock = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
      rock.position.set(x, 0, z);

      // Minor random tilt so they aren't all uniformly oriented
      rock.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      sceneRef.current.add(rock);
      asteroids.push(rock);

      // Store orbital data for this asteroid
      asteroidData.push({
        radius,
        angle,
        // Speed varies with radius (Kepler's laws) plus some randomness
        speed: 0.0006 * Math.pow(radius/60, -1.5) * (0.8 + 0.4 * Math.random())
      });
    }
    asteroidMeshesRef.current = asteroids;

    // ============== 6. GAS GIANT'S MOON ==============
    // We'll assume the gas giant is the last planet in planetData (index 3).
    const moonGeo = new THREE.SphereGeometry(moonData.size, 16, 16);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      metalness: 0.4,
      roughness: 0.4,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    sceneRef.current.add(moonMesh);
    moonRef.current = moonMesh;

    // Orbit ring for the moon around the gas giant
    const moonRingGeo = new THREE.RingGeometry(
      moonData.orbitRadius - 0.05,
      moonData.orbitRadius + 0.05,
      64
    );
    moonRingGeo.rotateX(-Math.PI / 2); // same plane
    const moonRingMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const moonRing = new THREE.Mesh(moonRingGeo, moonRingMat);
    sceneRef.current.add(moonRing);
    moonRingRef.current = moonRing;

    // ============== 7. ANIMATION LOOP ==============
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      // (a) Update binary stars
      starData.forEach((star, idx) => {
        star.angle += star.speed;
        const x = star.orbitRadius * Math.cos(star.angle);
        const z = star.orbitRadius * Math.sin(star.angle);
        starsRef.current[idx].position.set(x, 0, z);
        starLightsRef.current[idx].position.set(x, 0, z);
      });

      // (b) Update planet positions
      planetData.forEach((planet, idx) => {
        planet.angle += planet.speed;
        const x = planet.orbitRadius * Math.cos(planet.angle);
        const z = planet.orbitRadius * Math.sin(planet.angle);
        planetsRef.current[idx].position.set(x, 0, z);
      });

      // Update asteroid positions
      asteroidMeshesRef.current.forEach((asteroid, idx) => {
        const data = asteroidData[idx];
        data.angle += data.speed;
        const x = data.radius * Math.cos(data.angle);
        const z = data.radius * Math.sin(data.angle);
        asteroid.position.set(x, 0, z);
        // Slowly tumble the asteroid
        asteroid.rotation.x += 0.01;
        asteroid.rotation.y += 0.005;
      });

      // (c) Update gas giant's moon
      //     The gas giant is the last planet => index 3
      const giantPos = planetsRef.current[3].position;
      moonData.angle += moonData.speed;
      const moonX = giantPos.x + moonData.orbitRadius * Math.cos(moonData.angle);
      const moonZ = giantPos.z + moonData.orbitRadius * Math.sin(moonData.angle);
      moonRef.current.position.set(moonX, 0, moonZ);

      // Keep the moon's ring centered on the gas giant as well
      moonRingRef.current.position.copy(giantPos);

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    animate();

    // ============== 8. HANDLE RESIZE ==============
    const handleResize = () => {
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
    };
    window.addEventListener('resize', handleResize);

    // Initial size setup
    const container = canvasRef.current.parentElement;
    rendererRef.current.setSize(container.clientWidth, container.clientHeight);
    cameraRef.current.aspect = container.clientWidth / container.clientHeight;
    cameraRef.current.updateProjectionMatrix();

    // ============== CLEANUP ON UNMOUNT ==============
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      rendererRef.current.dispose();
      sceneRef.current.clear();
    };
  }, []);

  return (
    <div className="background-container">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default OrbitalSimBackground;
