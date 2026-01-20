// 1. Warna Tint Unit (Tetap Sama)
const TINTS = {
  NORMAL: 0xFFFFFF,
  STUNNED: 0x888888, 
  ROOTED: 0xCD853F, 
  FROZEN: 0xA5F2F3, 
  SLOWED: 0xADD8E6, 
  SILENCED: 0xDA70D6, 
  BUFFED: 0xFFD700, 
  POISONED: 0x00FF00
};

// 2. Cache Texture (Akan diisi saat init)
const ICON_TEXTURES = {};

// ==========================================
// [BARU] FUNGSI GENERATE ICON PIXI
// ==========================================
export function initBuffIcons(app) {
    // Helper untuk render graphics ke texture
    const genTex = (drawFn) => {
        const g = new PIXI.Graphics();
        drawFn(g);
        return app.renderer.generateTexture(g);
    };

    // 1. STUN (Spiral Kuning)
    ICON_TEXTURES.stun = genTex((g) => {
        g.lineStyle(3, 0xFFFF00); // Kuning
        g.drawCircle(16, 16, 12);
        g.drawCircle(16, 16, 6);
        g.moveTo(16, 16); g.lineTo(16, 10); // Garis kecil di tengah
    });

    // 2. ROOT (Silang Coklat / Akar)
    ICON_TEXTURES.root = genTex((g) => {
        g.lineStyle(4, 0x8B4513); // Coklat
        g.moveTo(6, 26); g.lineTo(26, 6); // Garis miring 1
        g.moveTo(6, 6); g.lineTo(26, 26); // Garis miring 2
        g.lineStyle(2, 0x00FF00); // Daun kecil
        g.drawCircle(6, 6, 2); g.drawCircle(26, 26, 2);
    });

    // 3. SILENCE (Masker/Silang Ungu)
    ICON_TEXTURES.silence = genTex((g) => {
        g.beginFill(0x800080); // Ungu
        g.drawCircle(16, 16, 14); // Bulatan Background
        g.endFill();
        g.lineStyle(3, 0xFFFFFF); // Silang Putih
        g.moveTo(10, 10); g.lineTo(22, 22);
        g.moveTo(22, 10); g.lineTo(10, 22);
    });

    // 4. SLOW (Panah Biru ke Bawah)
    ICON_TEXTURES.slow = genTex((g) => {
        g.beginFill(0x00FFFF); // Cyan
        // Gambar Panah Ke Bawah
        g.drawPolygon([
            10, 4,  22, 4,  // Batang atas
            22, 16, 30, 16, // Sayap kanan
            16, 30,         // Ujung bawah
            2, 16,  10, 16  // Sayap kiri
        ]);
        g.endFill();
    });

    // 5. BUFF (Panah Emas ke Atas)
    ICON_TEXTURES.buff = genTex((g) => {
        g.beginFill(0xFFD700); // Emas
        // Gambar Panah Ke Atas
        g.drawPolygon([
            16, 2,          // Ujung atas
            30, 16, 22, 16, // Sayap kanan
            22, 28, 10, 28, // Batang bawah
            10, 16, 2, 16   // Sayap kiri
        ]);
        g.endFill();
    });

    // 6. POISON (Tengkorak Hijau Simpel)
    ICON_TEXTURES.poison = genTex((g) => {
        g.beginFill(0x00FF00); 
        g.drawCircle(16, 12, 10); // Kepala
        g.drawRect(10, 20, 12, 8); // Rahang
        g.beginFill(0x000000); // Mata Hitam
        g.drawCircle(12, 12, 3);
        g.drawCircle(20, 12, 3);
    });
}

// ==========================================
// FUNGSI UTAMA: UPDATE VISUAL
// ==========================================
export function updateUnitVisualEffects(unitContainer, serverUnitData) {
    // 1. SETUP CONTAINER
    let effectsContainer = unitContainer.getChildByName("effectsContainer");
    if (!effectsContainer) {
        effectsContainer = new PIXI.Container();
        effectsContainer.name = "effectsContainer";
        effectsContainer.y = -40; // Di atas kepala
        unitContainer.addChild(effectsContainer);
    }

    // 2. RESET
    const bodySprite = unitContainer.getChildByName("bodySprite");
    if (bodySprite) bodySprite.tint = TINTS.NORMAL;
    effectsContainer.removeChildren();

    // 3. CEK STATUS & TINT
    // --- STUN / FREEZE ---
    if (serverUnitData.isStunned) {
        if (serverUnitData.attackSpeed <= 0.01) {
             if (bodySprite) bodySprite.tint = TINTS.FROZEN;
             addIcon(effectsContainer, 'stun'); 
             addIcon(effectsContainer, 'slow');
        } else {
             if (bodySprite) bodySprite.tint = TINTS.STUNNED;
             addIcon(effectsContainer, 'stun');
        }
    }
    // --- ROOT ---
    if (serverUnitData.isRooted) {
        if (bodySprite) bodySprite.tint = TINTS.ROOTED;
        addIcon(effectsContainer, 'root');
    }
    // --- SILENCE ---
    if (serverUnitData.isSilenced) {
        addIcon(effectsContainer, 'silence');
    }

    // --- SLOW / HASTE ---
    const baseSpeed = serverUnitData.baseSpeed || serverUnitData.speed;
    const speedRatio = serverUnitData.speed / baseSpeed;

    if (speedRatio < 0.9 && !serverUnitData.isStunned && !serverUnitData.isRooted) {
        if (bodySprite) bodySprite.tint = TINTS.SLOWED;
        addIcon(effectsContainer, 'slow');
    } else if (speedRatio > 1.1) {
        if (bodySprite) bodySprite.tint = TINTS.BUFFED;
        addIcon(effectsContainer, 'buff');
    }

    // --- POISON ---
    if (serverUnitData.buffs && serverUnitData.buffs.some(b => b.type === 'poison')) {
         if (bodySprite && bodySprite.tint === TINTS.NORMAL) bodySprite.tint = TINTS.POISONED;
         addIcon(effectsContainer, 'poison');
    }
}

// Helper Tambah Ikon
function addIcon(container, type) {
    const texture = ICON_TEXTURES[type];
    if (!texture) return; // Skip kalau texture belum digenerate

    const iconSprite = new PIXI.Sprite(texture);
    iconSprite.anchor.set(0.5);
    iconSprite.scale.set(0.5); // Perkecil sedikit (32px -> 16px visual)
    
    // Auto layout ke samping
    const spacing = 18;
    iconSprite.x = (container.children.length - 0.5) * spacing; 
    
    // Biar center, kita geser parent containernya sedikit ke kiri setiap nambah anak
    // (Atau biarkan rata kiri dari tengah kepala)
    container.addChild(iconSprite);
}