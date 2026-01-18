const Utils = {
  getDist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),

  // FUNGSI RESIZE PENTING
  resize: () => {},

  lerpAngle: (a, b, t) => {
    let diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  },

  randomPick: (arr) => arr[Math.floor(Math.random() * arr.length)],
};

class Effect {
  constructor(x, y, radius, color) {
    this.x = x; this.y = y; this.radius = radius; this.color = color;
  }
}

class LightningEffect {
  constructor(x1, y1, x2, y2) {
    // Lightning agak kompleks, untuk server kita simpan koordinatnya saja
    // Client yang akan merender petirnya
    this.x = x1; this.y = y1; this.radius = 0; this.color = 'yellow'; // Hack biar masuk ke array effects
  }
}

class SpellArea {
  constructor(x, y, radius, type, duration, team, amount = 0) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.type = type;
    this.duration = duration * 60;
    this.maxDuration = this.duration;
    this.team = team;
    this.amount = amount;
    this.dead = false;
    this.tickTimer = 0;
  }
  update(game) {
    this.duration--;
    if (this.duration <= 0) {
      this.dead = true;
      return;
    }

    if (this.type === "rage") {
      [...game.units, ...game.buildings, ...game.towers].forEach((e) => {
        if (
          e.team === this.team &&
          !e.dead &&
          Utils.getDist(this, e) < this.radius
        )
          e.applyRage(this.amount);
      });
    } else if (this.type === "earthquake") {
      [...game.units].forEach((e) => {
        if (
          e.team !== this.team &&
          !e.dead &&
          !e.isAir &&
          Utils.getDist(this, e) < this.radius
        )
          e.applySlow(0.1, 0.5);
      });
      this.tickTimer++;
      if (this.tickTimer % 30 === 0) {
        const dmg = this.amount / (this.maxDuration / 60);
        [...game.buildings, ...game.towers].forEach((b) => {
          if (
            b.team !== this.team &&
            !b.dead &&
            Utils.getDist(this, b) < this.radius
          )
            b.takeDamage(dmg * 3);
        });
        [...game.units].forEach((u) => {
          if (
            u.team !== this.team &&
            !u.dead &&
            !u.isAir &&
            Utils.getDist(this, u) < this.radius
          )
            u.takeDamage(dmg);
        });
      }
    } else if (this.type === "void") {
      this.tickTimer++;
      if (this.tickTimer % 30 === 0) {
        const targets = [
          ...game.units,
          ...game.buildings,
          ...game.towers,
        ].filter(
          (t) =>
            t.team !== this.team &&
            !t.dead &&
            Utils.getDist(this, t) < this.radius
        );
        if (targets.length > 0) {
          const share = this.amount / targets.length;
          targets.forEach((t) => {
            t.takeDamage(share);
            game.effects.push(new Effect(t.x, t.y, 20, "#6a1b9a"));
          });
        }
      }
    }
  }
}

module.exports = { Utils, Effect, LightningEffect, SpellArea };
