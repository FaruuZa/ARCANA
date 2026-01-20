export const HEADS = {
  default: (g, r, color) => {
    // TOP-DOWN: Kepala dari atas (lingkaran)
    g.beginFill(0xffe0b2); // Kulit
    g.drawCircle(0, -r * 0.5, r * 0.35);
    g.endFill();

    // Mata dari atas (dua titik)
    g.beginFill(0x000000);
    g.drawCircle(-r * 0.12, -r * 0.55, r * 0.06);
    g.drawCircle(r * 0.12, -r * 0.55, r * 0.06);
    g.endFill();
  },

  helmet_viking: (g, r, color) => {
    // TOP-DOWN: Helm Viking dari atas
    g.beginFill(0xfbc02d);
    g.drawCircle(0, -r * 0.5, r * 0.4);
    g.endFill();

    // Tanduk (dua bukit di depan)
    g.beginFill(0xffffff);
    g.drawPolygon([
      -r * 0.35, -r * 0.8,
      -r * 0.15, -r * 0.6,
      r * 0.15, -r * 0.6,
      r * 0.35, -r * 0.8
    ]);
    g.endFill();

    // Visor (garis gelap di depan)
    g.lineStyle(2, 0xd4a017, 0.8);
    g.moveTo(-r * 0.3, -r * 0.85);
    g.lineTo(r * 0.3, -r * 0.85);
    g.lineStyle(0);
  },

  helmet_shadow: (g, r, color) => {
    // TOP-DOWN: Helm gelap untuk Noctis
    g.beginFill(0x1a1a2e);
    g.drawCircle(0, -r * 0.5, r * 0.4);
    g.endFill();

    // Highlight ungu di depan
    g.beginFill(0x9C27B0, 0.5);
    g.drawCircle(0, -r * 0.8, r * 0.15);
    g.endFill();
  },

  hood: (g, r, color) => {
    // TOP-DOWN: Jubah kepala dari atas
    g.beginFill(color);
    g.drawCircle(0, -r * 0.5, r * 0.42);
    g.endFill();

    // Wajah dalam
    g.beginFill(0xffe0b2);
    g.drawCircle(0, -r * 0.5, r * 0.3);
    g.endFill();

    // Mata misterius (glow hijau)
    g.beginFill(0x00FF00, 0.7);
    g.drawCircle(-r * 0.12, -r * 0.55, r * 0.08);
    g.drawCircle(r * 0.12, -r * 0.55, r * 0.08);
    g.endFill();
  },

  crown_gold: (g, r, color) => {
    // TOP-DOWN: Mahkota emas dari atas
    g.beginFill(0xfbc02d);
    g.drawCircle(0, -r * 0.5, r * 0.38);
    g.endFill();

    // Mahkota (peak di depan dan belakang)
    g.beginFill(0xFFD700);
    g.drawPolygon([
      -r * 0.25, -r * 0.8,  // Peak kiri depan
      0, -r * 0.95,          // Peak tengah depan
      r * 0.25, -r * 0.8,   // Peak kanan depan
      0, -r * 0.2            // Center
    ]);
    g.endFill();

    // Batu permata di tengah
    g.beginFill(0xFF0000);
    g.drawCircle(0, -r * 0.5, r * 0.1);
    g.endFill();
  },

  crown_shadow: (g, r, color) => {
    // TOP-DOWN: Mahkota ungu dari atas
    g.beginFill(0x1a1a2e);
    g.drawCircle(0, -r * 0.5, r * 0.38);
    g.endFill();

    // Mahkota ungu
    g.beginFill(0x9C27B0);
    g.drawPolygon([
      -r * 0.25, -r * 0.8,
      0, -r * 0.95,
      r * 0.25, -r * 0.8,
      0, -r * 0.2
    ]);
    g.endFill();

    // Batu dark
    g.beginFill(0xFF1493);
    g.drawCircle(0, -r * 0.5, r * 0.1);
    g.endFill();
  },

  mask_void: (g, r, color) => {
    // TOP-DOWN: Topeng assassin dari atas
    g.beginFill(0x0a0a0c);
    g.drawCircle(0, -r * 0.5, r * 0.42);
    g.endFill();

    // Eye glow cyan (dua bulan sabit di depan)
    g.beginFill(0x00FFFF);
    g.drawCircle(-r * 0.15, -r * 0.65, r * 0.12);
    g.drawCircle(r * 0.15, -r * 0.65, r * 0.12);
    g.endFill();

    // Outline ungu
    g.lineStyle(2, 0x9C27B0, 0.7);
    g.drawCircle(0, -r * 0.5, r * 0.42);
    g.lineStyle(0);
  },

  halo: (g, r, color) => {
    // TOP-DOWN: Halo healer dari atas
    g.beginFill(0xffe0b2);
    g.drawCircle(0, -r * 0.5, r * 0.38);
    g.endFill();

    // Halo cahaya (ring)
    g.lineStyle(2, 0xFFD700, 0.8);
    g.drawCircle(0, -r * 0.5, r * 0.6);
    g.drawCircle(0, -r * 0.5, r * 0.5);
    g.lineStyle(0);

    // Mata cerah biru
    g.beginFill(0x0099FF);
    g.drawCircle(-r * 0.12, -r * 0.55, r * 0.08);
    g.drawCircle(r * 0.12, -r * 0.55, r * 0.08);
    g.endFill();
  }
};