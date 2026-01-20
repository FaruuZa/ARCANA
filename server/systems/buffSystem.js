export function updateBuffs(gameState, dt) {
  const units = gameState.units;
  const buildings = gameState.buildings;
  const allEntities = [...units, ...buildings]; // Buff berlaku untuk unit & bangunan

  for (const entity of allEntities) {
    if (entity.hp <= 0) continue;

    if (!entity.buffs) {
      entity.buffs = [];
    }

    // 1. RESET STATS KE BASE
    // Agar perhitungan tidak menumpuk (compounding) secara permanen
    // Kecuali HP (HP adalah state, MaxHP adalah stat)

    // Cek apakah entity punya base stats (Bangunan mungkin strukturnya beda, sesuaikan)
    const baseSpeed =
      entity.baseSpeed !== undefined ? entity.baseSpeed : entity.speed;
    const baseDmg =
      entity.baseDamage !== undefined ? entity.baseDamage : entity.damage;
    const baseAtkSpd =
      entity.baseAttackSpeed !== undefined
        ? entity.baseAttackSpeed
        : entity.attackSpeed;

    entity.scale = 1.0;

    entity.speed = baseSpeed;
    entity.damage = baseDmg;
    entity.attackSpeed = baseAtkSpd;

    // Reset Status Flags
    entity.isStunned = false;
    entity.isRooted = false;
    entity.isSilenced = false;

    // Visual Color Override (Optional, bisa kirim ke client)
    entity.colorOverlay = null;

    // 2. PROSES BUFFS
    // Kita loop dari belakang agar aman saat menghapus (splice)
    for (let i = entity.buffs.length - 1; i >= 0; i--) {
      const buff = entity.buffs[i];

      // A. Kurangi Durasi
      buff.duration -= dt;

      // B. Terapkan Efek
      applyBuffEffect(entity, buff, dt);

      // C. Hapus jika expired
      if (buff.duration <= 0) {
        entity.buffs.splice(i, 1);
      }
    }

    if (entity.baseRadius) {
      entity.radius = entity.baseRadius * entity.scale;
    }
  }
}

function applyBuffEffect(entity, buff, dt) {
  switch (buff.type) {
    // --- STATUS EFFECTS ---
    case "stun":
      entity.isStunned = true;
      entity.speed = 0; // Stop movement
      // Logic attackSystem nanti cek isStunned untuk stop attack
      break;

    case "root":
      entity.isRooted = true;
      entity.speed = 0;
      break;

    case "freeze":
      entity.isStunned = true;
      entity.speed = 0;
      entity.attackSpeed = 0; // Animasi freeze total
      break;

    // --- STAT MODIFIERS (Multiplicative) ---
    case "speed_mult":
      // Value 0.5 = Slow 50%, Value 1.5 = Haste 50%
      entity.speed *= buff.value;
      break;

    case "damage_mult":
      entity.damage *= buff.value;
      break;

    case "attack_speed_mult":
      entity.attackSpeed *= buff.value;
      break;

    case "scale_mult":
      entity.scale *= buff.value;
      entity.range *= buff.value;
      entity.aoeRadius *= buff.value;
      // Contoh: value 1.5 = Unit membesar 50%
      // Contoh: value 0.5 = Unit mengecil 50%

      // Opsional: Biasanya unit besar jalannya lambat tapi damage naik
      // entity.speed *= (1 / buff.value);
      // entity.damage *= buff.value;
      break;

    // --- PERIODIC EFFECTS (DoT / HoT) ---
    case "poison":
    case "burn":
    case "regen":
      // Gunakan timer internal buff untuk tick damage per detik (atau per interval)
      buff.tickTimer = (buff.tickTimer || 0) - dt;

      if (buff.tickTimer <= 0) {
        const isHeal = buff.type === "regen";
        const amount = buff.value; // Damage per tick

        if (isHeal) {
          entity.hp = Math.min(entity.hp + amount, entity.maxHp);
        } else {
          entity.hp -= amount;
          // Bisa tambahkan logic kill credit jika mati kena dot
        }

        // Reset timer (misal tick setiap 0.5 detik)
        buff.tickTimer = 0.5;
      }
      break;
  }
}
