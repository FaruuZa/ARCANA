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
    g.drawCircle(r * 0.12, -r * 0.55, r * 0.08);
    g.endFill();
  },

  // === NEW PORTS ===
  helmet_full: (g, r, color) => {
    g.beginFill(0x263238);
    g.drawCircle(0, -r * 0.3, r * 0.6);
    g.endFill();
    g.beginFill(0x00e5ff);
    g.drawRect(-r * 0.3, -r * 0.4, r * 0.6, r * 0.15);
    g.endFill();
  },

  helmet_tech: (g, r, color) => {
    g.beginFill(0x263238);
    g.drawCircle(0, -r * 0.3, r * 0.5);
    g.endFill();
    g.beginFill(0xFF0000);
    g.drawCircle(0, -r * 0.3, r * 0.2);
    g.endFill();
  },

  helmet_samurai: (g, r, color) => {
    g.beginFill(0xb71c1c);
    g.drawCircle(0, -r * 0.35, r * 0.6);
    g.endFill();
    g.beginFill(0xffd700);
    g.drawPolygon([0, -r, -r*0.4, -r*0.4, r*0.4, -r*0.4]);
    g.endFill();
  },

  skull: (g, r, color) => {
    g.beginFill(0xFFFFFF);
    g.drawCircle(0, -r * 0.3, r * 0.5);
    g.endFill();
    g.beginFill(0x000000);
    g.drawCircle(-r*0.2, -r*0.3, r*0.15);
    g.drawCircle(r*0.2, -r*0.3, r*0.15);
    g.endFill();
  },
  
  skull_helm: (g, r, color) => {
    g.beginFill(0xffd700);
    g.arc(0, -r*0.5, r*0.4, Math.PI, 0); // Helmet Top
    g.endFill();
    g.beginFill(0xFFFFFF);
    g.arc(0, -r*0.3, r*0.5, 0, Math.PI, false); // Skull Face
    g.endFill();
  },

  hood_ninja: (g, r, color) => {
    g.beginFill(0x111111);
    g.drawCircle(0, -r * 0.3, r * 0.55);
    g.endFill();
    g.beginFill(0xffe0b2);
    g.drawRect(-r*0.3, -r*0.4, r*0.6, r*0.2);
    g.endFill();
  },

  hood_ice: (g, r, color) => {
    g.beginFill(0xb3e5fc);
    g.arc(0, -r*0.3, r*0.55, Math.PI, 0);
    g.endFill();
    g.beginFill(0xe1f5fe);
    g.drawCircle(0, -r*0.3, r*0.4);
    g.endFill();
  },
  
  mohawk: (g, r, color) => {
    g.beginFill(0x333333);
    g.drawRect(-r*0.1, -r*0.9, r*0.2, r*0.6);
    g.endFill();
    g.beginFill(0x8d6e63);
    g.drawCircle(0, -r*0.3, r*0.5);
    g.endFill();
  },

  bald: (g, r, color) => {
    g.beginFill(0xf0ceab);
    g.drawCircle(0, -r*0.3, r*0.5);
    g.endFill();
  },

  hair_spiky: (g, r, color) => {
    g.beginFill(0x263238);
    g.drawPolygon([0, -r, -r*0.5, 0, r*0.5, 0]);
    g.endFill();
    g.beginFill(0xffe0b2);
    g.drawCircle(0, -r*0.2, r*0.4);
    g.endFill();
  },
  
  hair_long: (g, r, color) => {
    g.beginFill(0xfff9c4);
    g.drawCircle(0, -r*0.3, r*0.6);
    g.endFill();
  },

  mask: (g, r, color) => {
    g.beginFill(0x5d4037);
    g.drawCircle(0, -r*0.3, r*0.5);
    g.endFill();
    g.beginFill(0xFFFFFF);
    g.drawCircle(0, -r*0.3, r*0.2);
    g.endFill();
  },

  mask_hood: (g, r, color) => {
    g.beginFill(0x1a237e);
    g.drawCircle(0, -r*0.3, r*0.55);
    g.endFill();
    g.beginFill(0x000000);
    g.drawRect(-r*0.3, -r*0.4, r*0.6, r*0.3);
    g.endFill();
  },

  goblin: (g, r, color) => {
    g.beginFill(0x3949ab);
    g.drawCircle(0, -r*0.3, r*0.5);
    g.endFill();
    // Ears
    g.beginFill(0x1a237e);
    g.drawPolygon([0, -r, -5, -5, 5, -5]);
    g.endFill();
  },

  antlers: (g, r, color) => {
    g.lineStyle(2, 0x5d4037);
    g.moveTo(-5, -10); g.lineTo(-15, -20);
    g.moveTo(5, -10); g.lineTo(15, -20);
    g.lineStyle(0);
    g.beginFill(0xffe0b2);
    g.drawCircle(0, -r*0.3, r*0.5);
    g.endFill();
  },

  hat_wizard: (g, r, color) => {
    g.beginFill(color);
    g.drawPolygon([0, -r*2.0, r*0.7, -r*0.2, -r*0.7, -r*0.2]);
    g.endFill();
    g.beginFill(0x000000, 0.4);
    g.drawRect(-r*0.7, -r*0.4, r*1.4, r*0.2);
    g.endFill();
  },
  
  helm_dragon: (g, r, color) => {
    g.beginFill(color);
    g.drawCircle(0, -r*0.3, r*0.6);
    g.drawRect(-r*0.3, -r*0.3, r*0.6, r*0.5);
    g.endFill();
    g.beginFill(0xd7ccc8);
    g.drawPolygon([-r*0.4, -r*0.8, -r*0.8, -r*1.5, -r*0.2, -r*1.0]);
    g.drawPolygon([r*0.4, -r*0.8, r*0.8, -r*1.5, r*0.2, -r*1.0]);
    g.endFill();
  },

  helm_astronaut: (g, r, color) => {
    g.beginFill(0xeceff1);
    g.drawCircle(0, -r*0.3, r*0.7);
    g.endFill();
    g.beginFill(0xffc107);
    g.drawEllipse(0, -r*0.3, r*0.5, r*0.3);
    g.endFill();
    g.beginFill(0xFFFFFF);
    g.drawEllipse(-r*0.2, -r*0.4, r*0.1, r*0.05);
    g.endFill();
  },

  cyborg_eye: (g, r, color) => {
    g.beginFill(0xf0ceab);
    g.drawCircle(0, -r*0.3, r*0.5);
    g.endFill();
    g.beginFill(0x90a4ae);
    g.drawCircle(r*0.2, -r*0.3, r*0.2);
    g.endFill();
    g.beginFill(color);
    g.drawCircle(r*0.2, -r*0.3, r*0.1);
    g.endFill();
  },

  head_pumpkin: (g, r, color) => {
    g.beginFill(0xe65100);
    g.drawCircle(0, -r*0.4, r*0.65);
    g.endFill();
    g.lineStyle(1, 0xbf360c);
    g.drawCircle(0, -r*0.4, r*0.65);
    g.lineStyle(0);
    // Face
    g.beginFill(color);
    g.drawPolygon([-r*0.3, -r*0.5, -r*0.1, -r*0.5, -r*0.2, -r*0.3]);
    g.drawPolygon([r*0.3, -r*0.5, r*0.1, -r*0.5, r*0.2, -r*0.3]);
    g.endFill();
  },

  head_cyclops: (g, r, color) => {
    g.beginFill(color);
    g.drawCircle(0, -r*0.4, r*0.7);
    g.endFill();
    g.beginFill(0xFFFFFF);
    g.drawCircle(0, -r*0.5, r*0.3);
    g.endFill();
    g.beginFill(0x000000);
    g.drawCircle(0, -r*0.5, r*0.15);
    g.endFill();
  }
};