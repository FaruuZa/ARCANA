import { distance } from "../utils/math.js";

export function castRitual(gameState, data) {
    const { team, col, row, spellData } = data;

    console.log(`🔥 RITUAL CAST: Team ${team} at [${col}, ${row}]`);

    // Tipe 1: INSTANT DAMAGE AOE
    if (spellData.type === "damage_aoe") {
        
        // Cari semua unit yang kena (Friendly Fire? Biasanya tidak di game gacha)
        // Kita asumsi HANYA kena musuh.
        
        const targets = [...gameState.units, ...gameState.buildings];
        let hitCount = 0;

        targets.forEach(entity => {
            if (entity.hp <= 0) return;
            if (entity.team === team) return; // Jangan sakiti teman sendiri

            // Cek Jarak (Circle Collision)
            const dx = entity.col - col;
            const dy = entity.row - row;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist <= spellData.radius) {
                // KENA!
                entity.hp -= spellData.damage;
                hitCount++;
                console.log(`   -> Hit ${entity.id} for ${spellData.damage} dmg!`);
            }
            
        });

        gameState.effects.push({
            id: gameState.nextEntityId++, // Tetap butuh ID unik biar client bisa track
            type: "explosion",
            col: col,
            row: row,
            radius: spellData.radius,
            duration: 0.5, // Efek bertahan 0.5 detik di layar
            time: 0.5      // Timer hitung mundur
        });

    }
}