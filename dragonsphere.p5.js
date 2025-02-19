let dragonLines3D = [];
let sphereRadius = 200;
let iterations = 11;

let cam;          // We'll set up our own camera
let angle = 0;    // Rotation accumulator

function setup() {
  createCanvas(600, 600, WEBGL);
  
  // 1) Create and position a camera at (0,0,600), looking at the origin
  cam = createCamera();
  cam.setPosition(0, 0, 600);
  cam.lookAt(0, 0, 0);

  // 2) Generate the 2D dragon curve, then map it onto a sphere
  let dragon2D = generateDragonCurve(iterations);
  let { minX, maxX, minY, maxY } = find2DMinMax(dragon2D);

  for (let i = 0; i < dragon2D.length - 1; i++) {
    let xA = map(dragon2D[i].x,   minX, maxX, -1, 1);
    let yA = map(dragon2D[i].y,   minY, maxY, -1, 1);
    let xB = map(dragon2D[i+1].x, minX, maxX, -1, 1);
    let yB = map(dragon2D[i+1].y, minY, maxY, -1, 1);

    // Convert these normalized coords to spherical angles
    let thetaA = map(yA, -1, 1, 0, PI);
    let phiA   = map(xA, -1, 1, -PI, PI);
    let thetaB = map(yB, -1, 1, 0, PI);
    let phiB   = map(xB, -1, 1, -PI, PI);

    // Convert spherical → Cartesian
    let pA = sphericalToCartesian(thetaA, phiA, sphereRadius);
    let pB = sphericalToCartesian(thetaB, phiB, sphereRadius);

    // Store for later drawing
    dragonLines3D.push({ x1: pA.x, y1: pA.y, z1: pA.z,
                         x2: pB.x, y2: pB.y, z2: pB.z });
  }
}

function draw() {
  background(0);
  
  // 3) Increase rotation angle
  angle += 0.003;

  strokeWeight(2);
  noFill();

  // Pre-calculate sine/cosine to rotate points around the Y-axis
  let cosA = cos(angle);
  let sinA = sin(angle);

  // Camera is at (0,0,600). We measure how far each midpoint is from that point
  for (let seg of dragonLines3D) {
    // Manual rotation of each endpoint around y-axis
    let rx1 = seg.x1 * cosA + seg.z1 * sinA;
    let rz1 = -seg.x1 * sinA + seg.z1 * cosA;
    let ry1 = seg.y1;

    let rx2 = seg.x2 * cosA + seg.z2 * sinA;
    let rz2 = -seg.x2 * sinA + seg.z2 * cosA;
    let ry2 = seg.y2;

    // Midpoint AFTER rotation
    let midX = (rx1 + rx2) / 2;
    let midY = (ry1 + ry2) / 2;
    let midZ = (rz1 + rz2) / 2;

    // Distance from the camera at (0,0,600)
    let distToCam = dist(midX, midY, midZ, 0, 0, 600);

    // Fog effect: closer lines = higher alpha, far lines fade out
    // Tune these numbers for stronger or weaker fog
    let alphaVal = map(distToCam, 200, 1000, 255, 0, true);

    stroke(255, 215, 0, alphaVal);
    line(rx1, ry1, rz1, rx2, ry2, rz2);
  }
}

/* ================= DRAGON CURVE GENERATION ================ */
function generateDragonCurve(iters) {
  // Start with a single horizontal segment
  let path = [createVector(0,0), createVector(1,0)];
  for (let i = 0; i < iters; i++) {
    path = iterateDragon(path);
  }
  return path;
}

function iterateDragon(path) {
  let pivot = path[path.length - 1];
  let newPath = [...path];
  for (let i = path.length - 2; i >= 0; i--) {
    let dx = path[i].x - pivot.x;
    let dy = path[i].y - pivot.y;
    // 90° rotation about pivot: (dx, dy) → (−dy, dx)
    let rx = -dy;
    let ry = dx;
    newPath.push(createVector(pivot.x + rx, pivot.y + ry));
  }
  return newPath;
}

/* =================== UTILITIES =================== */
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
  let x = r * sin(theta) * cos(phi);
  let y = r * sin(theta) * sin(phi);
  let z = r * cos(theta);
  return createVector(x, y, z);
}
