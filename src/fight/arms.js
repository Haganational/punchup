// Jointed arms: each arm is an upper arm and a forearm that bend at an elbow.
// Given a shoulder and where the glove is, work out where the elbow has to be
// (two-bone inverse kinematics), then draw both segments with an outline.

// side: -1 for the arm on the left of the screen, +1 for the right.
// The elbow bends outward and a little downward, like a real guard.
export function elbowFor(sx, sy, gx, gy, upper, fore, side) {
  const dx = gx - sx; const dy = gy - sy;
  const reach = upper + fore;
  let d = Math.hypot(dx, dy);
  if (d >= reach) {
    // Fully extended (a punch): the elbow sits on the straight line.
    const t = upper / reach;
    return { x: sx + dx * t, y: sy + dy * t };
  }
  d = Math.max(d, Math.abs(upper - fore) + 0.01, 0.01);
  const a = (upper * upper - fore * fore + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, upper * upper - a * a));
  const mx = sx + (dx * a) / d; const my = sy + (dy * a) / d;
  const px = (-dy * h) / d; const py = (dx * h) / d;
  const c1 = { x: mx + px, y: my + py };
  const c2 = { x: mx - px, y: my - py };
  const score = (c) => c.x * side + c.y * 0.6;
  return score(c1) >= score(c2) ? c1 : c2;
}

function segment(g, x1, y1, x2, y2, width, color, outline) {
  const r = Math.round;
  g.lineStyle(width + 2, outline, 1);
  g.lineBetween(r(x1), r(y1), r(x2), r(y2));
  g.fillStyle(outline, 1);
  g.fillCircle(r(x1), r(y1), width / 2 + 1);
  g.fillCircle(r(x2), r(y2), width / 2 + 1);
  g.lineStyle(width, color, 1);
  g.lineBetween(r(x1), r(y1), r(x2), r(y2));
  g.fillStyle(color, 1);
  g.fillCircle(r(x1), r(y1), width / 2);
  g.fillCircle(r(x2), r(y2), width / 2);
}

// style: { upper, fore, width, sleeve, sleeveTo (0..1 of the upper arm), skin, outline, cuff }
export function drawArm(g, sx, sy, gx, gy, side, style, gloveScale = 1) {
  const e = elbowFor(sx, sy, gx, gy, style.upper, style.fore, side);
  const w = style.width;
  // Upper arm: skin first, then the sleeve over the part nearest the shoulder.
  const uw = style.upperWidth ?? w;
  segment(g, sx, sy, e.x, e.y, uw, style.skin, style.outline);
  if (style.sleeveTo > 0) {
    const t = style.sleeveTo;
    segment(g, sx, sy, sx + (e.x - sx) * t, sy + (e.y - sy) * t, uw + 1, style.sleeve, style.sleeveOutline ?? style.outline);
  }
  // Forearm gets thicker as the glove comes toward the camera.
  const fw = Math.max(3, Math.round(w * (0.85 + 0.25 * (gloveScale - 1))));
  segment(g, e.x, e.y, gx, gy, fw, style.foreColor ?? style.skin, style.outline);
  if (style.cuff != null) {
    const t = 0.82;
    segment(g, e.x + (gx - e.x) * t, e.y + (gy - e.y) * t, gx, gy, fw, style.cuff, style.outline);
  }
}
