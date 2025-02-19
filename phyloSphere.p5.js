/***************************************************************
 * 3D Bifurcating "Phylogenetic" Tree in p5.js
 * with Improved Leaf Distribution
 * -------------------------------------------------------------
 * We create a full binary tree of depth = MAX_DEPTH:
 *   - Root at index 0 pinned at (0,0,0).
 *   - Internal (bifurcation) nodes inside the sphere, at
 *     a radius proportional to their tree depth.
 *   - Leaves placed on the sphere surface *without overlap*:
 *       => We use "Fibonacci sphere" sampling for LEAF_COUNT = 2^MAX_DEPTH,
 *          so leaves start out in a more uniform distribution.
 *
 * We still do a force-directed layout:
 *   - Repulsion among all node pairs (including leaves).
 *   - Springs along each parent–child edge.
 *   - Leaves can slide tangentially on the sphere,
 *     root pinned at center, internal nodes forced to remain
 *     within the sphere, leaves remain exactly on surface.
 *
 * If you find the leaves still too "crowded," you can:
 *   - Increase SPHERE_RADIUS
 *   - Decrease SPRING_REST_LEN or SPRING_STRENGTH
 *   - Reduce or remove leaf-leaf repulsion in the code
 * 
 * Enjoy!
 ***************************************************************/

// ============= CONFIGURABLE PARAMETERS =============
let MAX_DEPTH          = 7;        // e.g. depth=7 => 128 leaves
let SPHERE_RADIUS      = 200;      // Radius for the sphere surface
let SPRING_REST_LEN    = 40;       // Desired parent–child distance
let SPRING_STRENGTH    = 0.01;     // Spring constant
let REPULSION_STRENGTH = 4000;     // Node–node repulsion factor
let DAMPING            = 0.90;     // Velocity damping
let TIME_STEP          = 0.2;      // Integration time step

// We'll store all nodes in an array:
/// node = {
//   x, y, z,         // position
//   vx, vy, vz,      // velocity
//   depth,           // tree depth (0 => root, maxDepth => leaf)
//   isRoot, isLeaf,  // booleans
//   edges: []        // connected node indices
// }
let nodes = [];

// We'll pre-generate a set of evenly-spaced positions on the sphere
// using a Fibonacci sphere. We'll assign these to the leaf nodes.
let leafPositions = [];
let leafIndex = 0;  // so we can assign leaf positions one by one

function setup() {
  createCanvas(600, 600, WEBGL);

  // Position camera further back so we see the entire structure
  camera(0, 0, 900, 0, 0, 0, 0, 1, 0);
  strokeWeight(2);
  noFill();

  // Number of leaves in a full binary tree of depth = 2^MAX_DEPTH
  let totalLeaves = Math.pow(2, MAX_DEPTH);

  // 1) Generate uniform positions for all leaves
  // (Fibonacci sphere method)
  leafPositions = fibonacciSpherePositions(totalLeaves, SPHERE_RADIUS);

  // 2) Build the full binary tree
  buildBinaryTree(MAX_DEPTH);

  // 3) Optionally run some pre-relaxation steps
  for (let i = 0; i < 200; i++) {
    physicsStep();
  }
}

function draw() {
  background(0);

  // Slow rotation
  rotateY(frameCount * 0.003);
  rotateX(frameCount * 0.001);

  // (Optional) draw a faint sphere reference
  // stroke(80);
  // sphere(SPHERE_RADIUS);
  // stroke(255, 215, 0);

  // Layout step
  physicsStep();

  // Draw edges in gold
  stroke(255, 215, 0);
  for (let i = 0; i < nodes.length; i++) {
    let ndA = nodes[i];
    for (let j of ndA.edges) {
      if (j > i) {
        let ndB = nodes[j];
        line(ndA.x, ndA.y, ndA.z, ndB.x, ndB.y, ndB.z);
      }
    }
  }
}

/**
 * Build a full binary tree of depth = maxDepth.
 * Index 0 => root pinned at origin.
 */
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

  // Recursively build subtrees from the root
  buildSubtree(0, 1, maxDepth);
}

/**
 * Recursively create left & right children for 'parentIndex',
 * at depth 'd'. If d <= maxDepth, we create actual children.
 * If d == maxDepth, these children become leaves.
 */
function buildSubtree(parentIndex, d, maxDepth) {
  if (d > maxDepth) {
    return; // no children beyond maxDepth
  }

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

/**
 * Create a node at a given depth. If it's a leaf, we place it
 * at one of our precomputed "fibonacci sphere" positions.
 * Otherwise, place it at an interior radius proportional to its depth.
 */
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

    // random angles
    let theta = random(TWO_PI);
    let phi   = random(PI);
    nd.x = r * sin(phi) * cos(theta);
    nd.y = r * sin(phi) * sin(theta);
    nd.z = r * cos(phi);

    // small random jitter so nodes at the same depth don't overlap exactly
    nd.x += random(-5,5);
    nd.y += random(-5,5);
    nd.z += random(-5,5);
  }

  nodes.push(nd);
  return idx;
}

/**
 * Main force-directed layout step:
 * 1) Repulsion among all pairs
 * 2) Spring forces along edges
 * 3) Integrate (Euler) + damping
 * 4) Constrain root at center
 * 5) Keep leaves on sphere surface (but allow tangential movement)
 * 6) Keep internal nodes inside sphere
 */
function physicsStep() {
  let nCount = nodes.length;
  let fx = new Array(nCount).fill(0);
  let fy = new Array(nCount).fill(0);
  let fz = new Array(nCount).fill(0);

  // --- (1) Repulsion: O(n^2) ---
  for (let i = 0; i < nCount; i++) {
    for (let j = i+1; j < nCount; j++) {
      let dx = nodes[j].x - nodes[i].x;
      let dy = nodes[j].y - nodes[i].y;
      let dz = nodes[j].z - nodes[i].z;
      let distSq = dx*dx + dy*dy + dz*dz + 0.0001;
      let dist   = sqrt(distSq);

      // (Optional) reduce or skip leaf-leaf repulsion here if desired:
      // if (nodes[i].isLeaf && nodes[j].isLeaf) { ... }

      let rep = REPULSION_STRENGTH / distSq;
      let nx = dx/dist, ny = dy/dist, nz = dz/dist;

      fx[i] -= rep * nx;  fy[i] -= rep * ny;  fz[i] -= rep * nz;
      fx[j] += rep * nx;  fy[j] += rep * ny;  fz[j] += rep * nz;
    }
  }

  // --- (2) Spring forces along edges ---
  for (let i = 0; i < nCount; i++) {
    for (let j of nodes[i].edges) {
      if (j > i) {
        let dx = nodes[j].x - nodes[i].x;
        let dy = nodes[j].y - nodes[i].y;
        let dz = nodes[j].z - nodes[i].z;
        let dist = sqrt(dx*dx + dy*dy + dz*dz) + 0.00001;
        let diff = dist - SPRING_REST_LEN;
        let force = SPRING_STRENGTH * diff;
        let nx = dx/dist, ny = dy/dist, nz = dz/dist;

        fx[i] +=  force * nx;  fy[i] +=  force * ny;  fz[i] +=  force * nz;
        fx[j] -=  force * nx;  fy[j] -=  force * ny;  fz[j] -=  force * nz;
      }
    }
  }

  // --- (3) Integrate (Euler) + damping ---
  for (let i = 0; i < nCount; i++) {
    let nd = nodes[i];

    // Root pinned at center
    if (nd.isRoot) {
      nd.x = nd.y = nd.z = 0;
      nd.vx = nd.vy = nd.vz = 0;
      continue;
    }

    // Acceleration
    nd.vx += fx[i] * TIME_STEP;
    nd.vy += fy[i] * TIME_STEP;
    nd.vz += fz[i] * TIME_STEP;

    // Damping
    nd.vx *= DAMPING;
    nd.vy *= DAMPING;
    nd.vz *= DAMPING;

    // Position update
    nd.x += nd.vx * TIME_STEP;
    nd.y += nd.vy * TIME_STEP;
    nd.z += nd.vz * TIME_STEP;
  }

  // --- (4) Constraints ---
  for (let i = 0; i < nCount; i++) {
    let nd = nodes[i];

    // (A) If leaf => clamp to sphere surface, remove radial velocity
    if (nd.isLeaf) {
      let r2 = nd.x*nd.x + nd.y*nd.y + nd.z*nd.z;
      let r  = sqrt(r2);
      if (r < 0.0001) {
        // corner case => re-init
        let pos = leafPositions[floor(random(leafPositions.length))];
        nd.x = pos.x; 
        nd.y = pos.y; 
        nd.z = pos.z;
        nd.vx = nd.vy = nd.vz = 0;
      } else {
        // clamp to exactly SPHERE_RADIUS
        let ratio = SPHERE_RADIUS / r;
        nd.x *= ratio;  nd.y *= ratio;  nd.z *= ratio;

        // remove radial velocity => purely tangential motion
        let nx = nd.x / SPHERE_RADIUS;
        let ny = nd.y / SPHERE_RADIUS;
        let nz = nd.z / SPHERE_RADIUS;
        let vrad = nd.vx*nx + nd.vy*ny + nd.vz*nz;
        nd.vx -= vrad*nx;
        nd.vy -= vrad*ny;
        nd.vz -= vrad*nz;
      }
    }
    // (B) If internal node => ensure inside sphere
    else if (!nd.isRoot) {
      let r2 = nd.x*nd.x + nd.y*nd.y + nd.z*nd.z;
      if (r2 > SPHERE_RADIUS*SPHERE_RADIUS) {
        let r = sqrt(r2);
        let ratio = SPHERE_RADIUS / r;
        nd.x *= ratio;  nd.y *= ratio;  nd.z *= ratio;

        // remove outward velocity
        let nx = nd.x / SPHERE_RADIUS;
        let ny = nd.y / SPHERE_RADIUS;
        let nz = nd.z / SPHERE_RADIUS;
        let vrad = nd.vx*nx + nd.vy*ny + nd.vz*nz;
        nd.vx -= vrad*nx;
        nd.vy -= vrad*ny;
        nd.vz -= vrad*nz;
      }
    }
  }
}

/**
 * Generate 'count' nearly uniform points on the surface of a sphere
 * of given 'radius' using the Fibonacci sphere approach.
 * Returns an array of {x, y, z}.
 *
 * This helps to spread leaves out more evenly vs random angles.
 */
function fibonacciSpherePositions(count, radius) {
  let pts = [];
  // Golden angle in radians
  let phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    // y goes from +1 to -1
    let y = 1 - (i / (count - 1)) * 2;  // from +1 to -1
    let r = Math.sqrt(1 - y*y);
    let theta = phi * i;
    let x = Math.cos(theta) * r;
    let z = Math.sin(theta) * r;

    // scale by radius
    pts.push({ x: x*radius, y: y*radius, z: z*radius });
  }
  return pts;
}
