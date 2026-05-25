/**
 * Headless physics audit for all 20 handcrafted levels.
 * Run: npx tsx scripts/audit-levels.ts
 */
import Matter from "matter-js";
import { HANDCRAFTED_LEVELS } from "../lib/handcrafted-levels-data";
import { createPhysicsWorld } from "../lib/physics/createWorld";
import { validateLevelPhysics } from "../lib/physics/levelValidation";

const issues: { id: string; name: string; logs: string[] }[] = [];

for (const level of HANDCRAFTED_LEVELS) {
  const w = createPhysicsWorld(level);
  const logs: string[] = [];
  const origWarn = console.warn;
  console.warn = (msg: unknown) => {
    const s = String(msg);
    if (s.includes(`level ${level.id}`)) logs.push(s);
  };
  validateLevelPhysics(Matter, w.engine, w.targets, { debug: true, label: level.id });
  console.warn = origWarn;

  for (const b of w.blocks) {
    const sp = Matter.Vector.magnitude(b.velocity) + Math.abs(b.angularVelocity) * 10;
    if (sp > 0.32) logs.push(`block ${b.label} still moving (${sp.toFixed(2)})`);
  }

  const supportFilter = (b: Matter.Body) => {
    const k = (b.plugin as { vibe?: string })?.vibe;
    return k === "block" || k === "ground" || (k === "platform" && !b.isSensor);
  };
  const support = Matter.Composite.allBodies(w.engine.world).filter(supportFilter);
  for (const t of w.targets) {
    if (Matter.Query.collides(t, support).length === 0) {
      logs.push(`FLOATING target ${t.label} @ y=${t.position.y.toFixed(0)}`);
    }
  }

  w.dispose();
  if (logs.length) issues.push({ id: level.id, name: level.name, logs });
  else console.log(`OK  L${level.id} ${level.shortName}`);
}

if (issues.length) {
  console.log("\n--- Issues ---\n");
  for (const i of issues) {
    console.log(`L${i.id} ${i.name}`);
    for (const l of i.logs) console.log(`  ${l}`);
  }
  process.exit(1);
}

console.log("\nAll levels passed audit.");
