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
  }
};