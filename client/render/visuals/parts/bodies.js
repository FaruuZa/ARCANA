export const BODIES = {
  default: (g, r, color) => {
    // TOP-DOWN VIEW: Badan dari atas (elips vertikal)
    g.beginFill(0x333333); 
    g.drawEllipse(0, 0, r * 0.4, r * 0.6); // Lebih panjang ke bawah
    g.endFill();
    g.beginFill(color);
    g.drawEllipse(0, 0, r * 0.3, r * 0.45);
    g.endFill();
  },

  armor_heavy: (g, r, color) => {
    // TOP-DOWN: Armor berlapis dari atas
    // Bahu (lingkaran di samping)
    g.beginFill(0x263238);
    g.drawCircle(-r * 0.5, -r * 0.3, r * 0.25);
    g.drawCircle(r * 0.5, -r * 0.3, r * 0.25);
    g.endFill();

    // Badan utama (elips vertikal panjang)
    g.beginFill(color);
    g.drawEllipse(0, 0, r * 0.45, r * 0.7);
    g.endFill();

    // Highlight di tengah
    g.beginFill(0xFFFFFF, 0.2);
    g.drawEllipse(0, 0, r * 0.25, r * 0.5);
    g.endFill();

    // Kaki (bottom accent)
    g.beginFill(0x1a1a1a, 0.4);
    g.drawEllipse(0, r * 0.55, r * 0.4, r * 0.15);
    g.endFill();
  },

  robe: (g, r, color) => {
    // TOP-DOWN: Jubah from above, shape seperti lonceng
    g.beginFill(color);
    g.moveTo(-r * 0.6, -r * 0.4);
    g.quadraticCurveTo(-r * 0.8, 0, -r * 0.6, r * 0.8); // Kiri meluas
    g.lineTo(r * 0.6, r * 0.8); // Bawah
    g.quadraticCurveTo(r * 0.8, 0, r * 0.6, -r * 0.4); // Kanan meluas
    g.lineTo(0, -r * 0.5); // Kembali ke atas
    g.endFill();

    // Detail garis jubah vertikal
    g.lineStyle(1, 0x000000, 0.2);
    g.moveTo(-r * 0.2, -r * 0.4);
    g.lineTo(-r * 0.3, r * 0.8);
    g.moveTo(r * 0.2, -r * 0.4);
    g.lineTo(r * 0.3, r * 0.8);
    g.lineStyle(0);
  },

  frame_light: (g, r, color) => {
    // TOP-DOWN: Frame bersih dari atas
    g.lineStyle(2, color, 0.8);
    g.drawEllipse(0, 0, r * 0.5, r * 0.65);
    g.lineStyle(0);
    
    g.beginFill(color, 0.2);
    g.drawEllipse(0, 0, r * 0.5, r * 0.65);
    g.endFill();

    // Garis tengah
    g.lineStyle(1, color, 0.5);
    g.moveTo(0, -r * 0.65);
    g.lineTo(0, r * 0.65);
  },

  frame_shadow: (g, r, color) => {
    // TOP-DOWN: Badan gelap dengan aura
    g.beginFill(0x1a1a1a);
    g.drawEllipse(0, 0, r * 0.55, r * 0.7);
    g.endFill();

    // Aura gelap
    g.lineStyle(3, color, 0.4);
    g.drawEllipse(0, 0, r * 0.6, r * 0.8);
    g.lineStyle(0);

    // Inner glow
    g.beginFill(color, 0.15);
    g.drawEllipse(0, 0, r * 0.45, r * 0.6);
    g.endFill();
  },

  spikes: (g, r, color) => {
    // TOP-DOWN: Badan dengan duri memancar ke samping
    g.beginFill(color);
    g.drawEllipse(0, 0, r * 0.5, r * 0.65);
    g.endFill();

    // Duri-duri ke samping (kiri-kanan, depan-belakang)
    g.beginFill(0x4a2838);
    const positions = [
      { angle: 0, label: 'kanan' },
      { angle: Math.PI, label: 'kiri' },
      { angle: Math.PI / 2, label: 'depan' },
      { angle: -Math.PI / 2, label: 'belakang' }
    ];
    
    for (let pos of positions) {
      const angle = pos.angle;
      const x = Math.cos(angle) * r * 0.7;
      const y = Math.sin(angle) * r * 0.7;
      const tipX = Math.cos(angle) * r * 1.0;
      const tipY = Math.sin(angle) * r * 1.0;
      
      // Duri triangle
      const perpX = Math.sin(angle) * 3;
      const perpY = -Math.cos(angle) * 3;
      
      g.drawPolygon([
        x - perpX, y - perpY,
        x + perpX, y + perpY,
        tipX, tipY
      ]);
    }
    g.endFill();
  },

  ethereal: (g, r, color) => {
    // TOP-DOWN: Badan transparan dengan lingkaran konsentris
    g.lineStyle(2, color, 0.6);
    g.drawEllipse(0, 0, r * 0.5, r * 0.65);
    g.lineStyle(0);

    g.beginFill(color, 0.1);
    g.drawEllipse(0, 0, r * 0.5, r * 0.65);
    g.endFill();

    // Inner rings concentric
    g.lineStyle(1, color, 0.3);
    g.drawEllipse(0, 0, r * 0.3, r * 0.4);
    g.drawEllipse(0, 0, r * 0.15, r * 0.2);
  },

  // === NEW PORTS ===
  armor_plate: (g, r, color) => {
      g.beginFill(0x546e7a);
      g.drawPolygon([
          -r*0.7, -r*0.3, r*0.7, -r*0.3,
          r*0.5, r*0.7, -r*0.5, r*0.7
      ]);
      g.endFill();
      // Core
      g.beginFill(color);
      g.drawPolygon([
          -r*0.3, -r*0.1, r*0.3, -r*0.1, 0, r*0.4
      ]);
      g.endFill();
  },
  
  armor_samurai: (g, r, color) => {
      g.beginFill(0xb71c1c);
      for(let i=0; i<3; i++) {
          const y = -r*0.3 + (i * r*0.4);
          const w = r * (0.8 - i*0.1); 
          g.drawEllipse(0, y, w, r*0.25);
      }
      g.endFill();
  },

  ancient_armor: (g, r, color) => {
      g.beginFill(0x3e2723);
      g.drawPolygon([
          -r*1.0, -r*0.5, r*1.0, -r*0.5,
          r*0.8, r*1.0, -r*0.8, r*1.0
      ]);
      g.endFill();
      // Core
      g.beginFill(0xd7ccc8);
      g.drawCircle(0, 0, r*0.3);
      g.endFill();
  },

  robe_dark: (g, r, color) => {
      g.beginFill(0x311b92);
      g.drawPolygon([
          0, -r*0.6, r*0.9, r*1.2, -r*0.9, r*1.2
      ]);
      g.endFill();
  },

  robe_green: (g, r, color) => {
      g.beginFill(0x2e7d32);
      g.drawPolygon([
          0, -r*0.6, r*0.9, r*1.2, -r*0.9, r*1.2
      ]);
      g.endFill();
  },

  shirt_plaid: (g, r, color) => {
      g.beginFill(0xd32f2f);
      g.drawPolygon([
          -r*0.8, -r*0.3, r*0.8, -r*0.3,
          r*0.6, r*0.8, -r*0.6, r*0.8
      ]);
      g.endFill();
      g.lineStyle(2, 0xb71c1c);
      g.moveTo(0, -r*0.3); g.lineTo(0, r*0.8);
      g.moveTo(-r*0.7, 0); g.lineTo(r*0.7, 0);
      g.lineStyle(0);
  },

  ribs: (g, r, color) => {
      g.lineStyle(2, 0xeeeeee);
      g.moveTo(0, -r*0.4); g.lineTo(0, r*0.4);
      g.moveTo(-r*0.5, -r*0.2); g.lineTo(r*0.5, -r*0.2);
      g.moveTo(-r*0.4, 0); g.lineTo(r*0.4, 0);
      g.moveTo(-r*0.3, r*0.2); g.lineTo(r*0.3, r*0.2);
      g.lineStyle(0);
  },

  ribs_armor: (g, r, color) => {
      g.beginFill(0x444444);
      g.drawPolygon([
          -r*0.6, -r*0.3, r*0.6, -r*0.3,
          r*0.4, r*0.5, 0, r*0.7, -r*0.4, r*0.5
      ]);
      g.endFill();
      g.lineStyle(2, 0xeeeeee);
      g.moveTo(0, -r*0.1); g.lineTo(0, r*0.3);
      g.lineStyle(0);
  },

  spirit: (g, r, color) => {
      g.beginFill(color, 0.8);
      g.drawCircle(0, -r*0.1, r*0.7);
      g.drawCircle(-r*0.4, r*0.5, r*0.2);
      g.drawCircle(r*0.4, r*0.5, r*0.2);
      g.endFill();
  },

  rock: (g, r, color) => {
      g.beginFill(0x8d6e63);
      g.drawPolygon([
          -r*0.9, -r*0.5, r*0.8, -r*0.6,
          r*1.0, r*0.4, 0, r*0.9, -r*0.8, r*0.5
      ]);
      g.endFill();
      g.lineStyle(2, 0x5d4037);
      g.moveTo(0, -r*0.2); g.lineTo(-r*0.4, r*0.3);
      g.lineStyle(0);
  },

  pig: (g, r, color) => {
      g.beginFill(0xf48fb1);
      g.drawEllipse(0, 0, r*0.7, r*0.9);
      g.drawCircle(-r*0.5, -r*0.6, r*0.2);
      g.drawCircle(r*0.5, -r*0.6, r*0.2);
      g.endFill();
  },

  machine_tank: (g, r, color) => {
      g.beginFill(0x5d4037);
      g.drawPolygon([
          -r*1.0, -r*1.0, r*1.0, -r*1.0,
          r*0.6, r*1.0, -r*0.6, r*1.0
      ]);
      g.endFill();
      g.beginFill(0xfbc02d);
      g.drawRoundedRect(-r*0.7, -r*0.7, r*1.4, r*1.4, 3);
      g.endFill();
  },

  basket: (g, r, color) => {
      g.beginFill(0x795548);
      g.drawPolygon([
          -r*0.7, -r*0.7, r*0.7, -r*0.7,
          r*0.5, r*0.5, -r*0.5, r*0.5
      ]);
      g.endFill();
      g.lineStyle(1, 0x5d4037);
      g.moveTo(-r*0.6, -r*0.3); g.lineTo(r*0.6, -r*0.3);
      g.moveTo(-r*0.55, 0); g.lineTo(r*0.55, 0);
      g.lineStyle(0);
  },

  wood_box: (g, r, color) => {
      g.beginFill(0x8d6e63);
      g.drawRoundedRect(-r*0.7, -r*0.7, r*1.4, r*1.4, 4);
      g.endFill();
  },
  
  wood_mech: (g, r, color) => {
      g.beginFill(0x8d6e63);
      g.drawEllipse(0, 0, r*0.7, r*0.8);
      g.endFill();
      g.lineStyle(3, 0x5d4037);
      g.drawCircle(0, 0, r*0.7);
      g.lineStyle(0);
  },

  body_spider: (g, r, color) => {
      g.beginFill(color);
      g.drawCircle(0, 0, r*0.8);
      g.endFill();
      g.beginFill(0x212121);
      g.drawCircle(0, -r*0.6, r*0.5);
      g.endFill();
      // Legs (simplified)
      g.lineStyle(3, color);
      g.moveTo(-r*0.4, -r*0.2); g.lineTo(-r*1.2, r*0.5);
      g.moveTo(r*0.4, -r*0.2); g.lineTo(r*1.2, r*0.5);
      g.lineStyle(0);
  },

  body_snake: (g, r, color) => {
      g.beginFill(color);
      g.drawEllipse(0, r*0.4, r*0.9, r*0.5); // Coil
      g.endFill();
      g.lineStyle(r*0.6, color);
      g.moveTo(0, r*0.2); g.lineTo(0, -r*0.8); // Neck
      g.lineStyle(0);
  },

  body_ice_golem: (g, r, color) => {
      g.beginFill(color);
      g.drawPolygon([
          0, -r*1.1, r*0.9, -r*0.3, r*0.6, r*0.9,
          -r*0.6, r*0.9, -r*0.9, -r*0.3
      ]);
      g.endFill();
      g.lineStyle(1, 0xFFFFFF);
      g.drawPolygon([
          0, -r*1.1, r*0.9, -r*0.3, r*0.6, r*0.9,
          -r*0.6, r*0.9, -r*0.9, -r*0.3, 0, -r*1.1
      ]);
      g.lineStyle(0);
  },

  body_fire_elemental: (g, r, color) => {
      // Simple flame shape
      g.beginFill(color);
      g.moveTo(0, -r*1.5);
      g.quadraticCurveTo(r, -r*0.5, 0, r);
      g.quadraticCurveTo(-r, -r*0.5, 0, -r*1.5);
      g.endFill();
  },

  dragon: (g, r, color) => {
      g.beginFill(color);
      g.drawEllipse(0, 0, r*0.6, r*0.9);
      g.endFill();
  },

  demon: (g, r, color) => {
       g.beginFill(color);
       g.drawCircle(0, 0, r*0.6);
       g.endFill();
  }
};