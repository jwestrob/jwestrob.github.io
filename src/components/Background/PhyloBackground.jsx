import React, { useEffect, useRef } from 'react';
import p5 from 'p5';
import './background.css';

const PhyloBackground = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Create and mount the p5 sketch into the containerRef div
    const sketch = new p5((p) => {
      let MIN_WEDGE;     // Minimum wedge in radians
      let rawNewick;     // Array of lines from phylo.txt
      let treeRoot;      // Parsed tree structure
      let maxDepth = 0;  // Maximum depth in the tree

      /* ================== p5 PRELOAD ================== */
      p.preload = () => {
        // Load the Newick file. (Relative path from your component to 'src/assets/phylo.txt')
        // Adjust if your build system requires a different path (e.g., "/assets/phylo.txt").
        rawNewick = p.loadStrings('src/assets/phylo.txt');
      };

      /* ================== p5 SETUP ================== */
      p.setup = () => {
        p.createCanvas(800, 800, p.WEBGL);

        // 3° in radians
        MIN_WEDGE = 3 * p.PI / 180;

        // Parse the Newick tree
        treeRoot = parseNewick(rawNewick.join(''));

        // Compute leaf counts, determine maximum depth
        computeLeafCounts(treeRoot);
        maxDepth = getMaxDepth(treeRoot);

        // Assign angles to each node in the tree
        assignAngles(treeRoot, 0, p.TWO_PI, 0);
      };

      /* ================== p5 DRAW ================== */
      p.draw = () => {
        p.background(0);

        // Slow rotation around Y and X
        p.rotateY(p.frameCount * 0.01);
        p.rotateX(p.frameCount * 0.005);

        p.stroke('gold');
        p.strokeWeight(1);
        p.noFill();

        // Spherical radius for drawing
        const R = 200;
        drawTreeOnSphere(treeRoot, R);
      };

      /* ========== Helper: draw node + children on sphere ========== */
      function drawTreeOnSphere(node, R) {
        let { x, y, z } = sphericalToCartesian(R, node._theta, node._phi);
        // If leaf, no children to draw
        if (!node.children) return;

        // Draw lines from this node to each child
        for (let child of node.children) {
          let { x: cx, y: cy, z: cz } = sphericalToCartesian(R, child._theta, child._phi);
          p.line(x, y, z, cx, cy, cz);
          drawTreeOnSphere(child, R);
        }
      }

      /* ========== Spherical → Cartesian ========== */
      function sphericalToCartesian(R, theta, phi) {
        // theta ∈ [0, π], phi ∈ [0, 2π]
        let st = p.sin(theta);
        let x = R * st * p.cos(phi);
        let y = R * p.cos(theta);
        let z = R * st * p.sin(phi);
        return { x, y, z };
      }

      /* ========== Assign angles to each node’s subtree ========== */
      function assignAngles(node, startAngle, endAngle, depth) {
        node._theta = p.map(depth, 0, maxDepth, 0, p.PI);
        node._phi   = 0.5 * (startAngle + endAngle);

        if (!node.children || node.children.length === 0) return;

        let totalTips = node._leafCount || 1;
        let availableAngle = endAngle - startAngle;

        // Each child’s wedge is proportionate to its fraction of leaf tips, min enforced
        let wedges = [];
        let sumWedges = 0;
        for (let child of node.children) {
          let fraction = (child._leafCount || 1) / totalTips;
          let desired  = fraction * availableAngle;
          let w = p.max(MIN_WEDGE, desired);
          wedges.push(w);
          sumWedges += w;
        }

        // Scale down if total wedge exceeds the parent wedge
        let scale = 1;
        if (sumWedges > availableAngle) {
          scale = availableAngle / sumWedges;
        }

        let currentAngle = startAngle;
        for (let i = 0; i < node.children.length; i++) {
          let w = wedges[i] * scale;
          let childStart = currentAngle;
          let childEnd   = currentAngle + w;
          assignAngles(node.children[i], childStart, childEnd, depth + 1);
          currentAngle += w;
        }
      }

      /* ========== Compute number of leaves in each subtree ========== */
      function computeLeafCounts(node) {
        if (!node.children || node.children.length === 0) {
          node._leafCount = 1;
          return 1;
        }
        let sum = 0;
        for (let c of node.children) {
          sum += computeLeafCounts(c);
        }
        node._leafCount = sum;
        return sum;
      }

      /* ========== Get maximum depth ========== */
      function getMaxDepth(node, depth = 0) {
        if (!node.children || node.children.length === 0) {
          return depth;
        }
        let best = depth;
        for (let c of node.children) {
          let d = getMaxDepth(c, depth + 1);
          if (d > best) best = d;
        }
        return best;
      }

      /* ========== Parse Newick string → tree object ========== */
      function parseNewick(str) {
        let tokens = str.split(/\s*(;|\(|\)|,|:)\s*/);
        let stack = [];
        let tree = {};
        let current = tree;

        for (let i = 0; i < tokens.length; i++) {
          let token = tokens[i];
          if (token === '(') {
            let child = { children: [] };
            if (!current.children) current.children = [];
            current.children.push(child);
            stack.push(current);
            current = child;
          } else if (token === ',') {
            let sibling = { children: [] };
            stack[stack.length - 1].children.push(sibling);
            current = sibling;
          } else if (token === ')') {
            current = stack.pop();
          } else if (token === ':') {
            // Next token is branch length - we handle it in next iteration
          } else if (token === ';') {
            break;
          } else {
            // Name or branch length
            let nextToken = tokens[i + 1];
            if (nextToken === ':') {
              current.name = token;
            } else {
              if (!current.name) {
                current.name = token;
              } else {
                current.length = parseFloat(token);
              }
            }
          }
        }
        return tree;
      }
    }, containerRef.current);

    // Cleanup: remove the p5 sketch on unmount
    return () => {
      sketch.remove();
    };
  }, []);

  return (
    <div className="background-container" ref={containerRef} />
  );
};

export default PhyloBackground;
