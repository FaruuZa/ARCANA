export const WEAPONS = {
  none: (g, r, color) => {
    // Tanpa senjata
  },

  sword: (g, r, color) => {
    // TOP-DOWN: Pedang dari atas (segaris membujur ke depan)
    g.beginFill(0xC0C0C0);
    g.drawRect(-r * 0.08, -r * 0.9, r * 0.16, r * 0.7);
    g.endFill();

    // Hilt (gagang berwarna)
    g.beginFill(color || 0xBB4513);
    g.drawRect(-r * 0.12, -r * 0.25, r * 0.24, r * 0.15);
    g.endFill();

    // Guard (pelindung tangan)
    g.beginFill(0xFFD700);
    g.drawRect(-r * 0.18, -r * 0.2, r * 0.36, r * 0.08);
    g.endFill();
  },

  hammer: (g, r, color) => {
    // TOP-DOWN: Palu dari atas
    // Kepala palu (kotak di depan)
    g.beginFill(0x7F7F7F);
    g.drawRect(-r * 0.25, -r * 0.8, r * 0.5, r * 0.35);
    g.endFill();

    // Handle (gagang panjang)
    g.beginFill(0xBB4513);
    g.drawRect(-r * 0.06, -r * 0.45, r * 0.12, r * 0.5);
    g.endFill();
  },

  bow: (g, r, color) => {
    // TOP-DOWN: Busur dari atas (Y shape)
    g.beginFill(0x8B4513);
    g.drawEllipse(0, -r * 0.2, r * 0.1, r * 0.5);
    g.endFill();

    // Lengan busur (dua cabang melengkung)
    g.lineStyle(3, 0x8B4513);
    g.arc(0, -r * 0.7, r * 0.25, -Math.PI / 4, Math.PI / 4);
    g.lineStyle(0);

    // String (tali busur)
    g.lineStyle(2, 0x654321, 0.8);
    g.moveTo(-r * 0.2, -r * 0.5);
    g.lineTo(r * 0.2, -r * 0.5);
    g.lineStyle(0);

    // Panah di belakang
    g.beginFill(0xFFD700);
    g.drawRect(-r * 0.04, r * 0.1, r * 0.08, r * 0.3);
    g.endFill();
  },

  staff: (g, r, color) => {
    // TOP-DOWN: Tongkat ajaib dari atas
    // Gagang panjang
    g.beginFill(0x8B4513);
    g.drawRect(-r * 0.08, -r * 0.7, r * 0.16, r * 0.8);
    g.endFill();

    // Kristal di ujung (lingkaran glowing)
    g.beginFill(color || 0x00FFFF, 0.8);
    g.drawCircle(0, -r * 0.85, r * 0.2);
    g.endFill();

    // Outline kristal
    g.lineStyle(2, color || 0x00FFFF);
    g.drawCircle(0, -r * 0.85, r * 0.2);
    g.lineStyle(0);
  },

  axe: (g, r, color) => {
    // TOP-DOWN: Kapak dari atas
    // Kepala kapak (persegi panjang besar)
    g.beginFill(0x7F7F7F);
    g.drawRect(-r * 0.3, -r * 0.7, r * 0.6, r * 0.35);
    g.endFill();

    // Pisau yang tajam (garis)
    g.lineStyle(3, 0xFFFFFF, 0.6);
    g.moveTo(-r * 0.3, -r * 0.7);
    g.lineTo(r * 0.3, -r * 0.7);
    g.lineStyle(0);

    // Handle kayu
    g.beginFill(0xBB4513);
    g.drawRect(-r * 0.08, -r * 0.35, r * 0.16, r * 0.45);
    g.endFill();
  },

  dagger: (g, r, color) => {
    // TOP-DOWN: Pisau pendek assassin dari atas
    // Blade (bilah tipis panjang)
    g.beginFill(0x696969);
    g.drawRect(-r * 0.06, -r * 0.65, r * 0.12, r * 0.55);
    g.endFill();

    // Ujung tajam (outline cerah)
    g.lineStyle(1.5, 0xFFFFFF, 0.7);
    g.moveTo(-r * 0.06, -r * 0.65);
    g.lineTo(r * 0.06, -r * 0.65);
    g.lineStyle(0);

    // Hilt ungu
    g.beginFill(0x9C27B0);
    g.drawRect(-r * 0.1, -r * 0.1, r * 0.2, r * 0.12);
    g.endFill();
  },

  scythe: (g, r, color) => {
    // TOP-DOWN: Sabit maut dari atas
    // Handle panjang vertikal
    g.beginFill(0x2F4F4F);
    g.drawRect(-r * 0.08, -r * 0.6, r * 0.16, r * 0.7);
    g.endFill();

    // Pisau melengkung (setengah lingkaran)
    g.beginFill(0x696969);
    g.arc(0, -r * 0.6, r * 0.35, 0, Math.PI, false);
    g.endFill();

    // Outline cengkeram maut (ungu gelap)
    g.lineStyle(2, 0x8B008B, 0.8);
    g.arc(0, -r * 0.6, r * 0.35, 0, Math.PI, false);
    g.lineStyle(0);
  }
};