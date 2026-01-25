export const FACTIONS = {
    solaris: {
        name: "Solaris",
        enabled: true, // [NEW] Flag for Random Selection
        description: "The keepers of the eternal flame. Defensive and resilient.",
        arcanaRate: 1.0, // Standard rate
        towerStats: {
            king: {
                hp: 4500, // Tankier
                damage: 20,
                range: 7.0,
                radius: 1.5
            },
            side: {
                hp: 2500, // Tankier
                damage: 15,
                range: 5.0,
                radius: 1.0
            }
        }
    },
    noctis: {
        name: "Noctis",
        enabled: true, // [NEW] Flag for Random Selection
        description: "Shadows that consume the light. Aggressive and destructive.",
        arcanaRate: 1.1, // Slightly faster resource gen
        towerStats: {
            king: {
                hp: 3500, // Squishier
                damage: 30, // Higher damage
                range: 7.0,
                radius: 1.5
            },
            side: {
                hp: 2000, // Squishier
                damage: 25, // Higher damage
                range: 5.0,
                radius: 1.0
            }
        }
    },
    mortis: {
        name: "Mortis",
        enabled: false, 
        description: "Death is not the end, but a resource. Sacrifice and Rebirth.",
        arcanaRate: 1.0,
        towerStats: {
            king: {
                hp: 4000,
                damage: 25,
                range: 7.0,
                radius: 1.5
            },
            side: {
                hp: 2200,
                damage: 20,
                range: 5.0,
                radius: 1.0
            }
        }
    },
    chronis: {
        name: "Chronis",
        enabled: false, 
        description: "Time is a river to be redirected. Delay, Rewind, Control.",
        arcanaRate: 0.9, // Slower accumulation (Control archetype)
        towerStats: {
            king: {
                hp: 3800,
                damage: 15, // Low damage but maybe rapid? 
                range: 8.0, // Longer range
                radius: 1.5
            },
            side: {
                hp: 2400,
                damage: 12,
                range: 6.0,
                radius: 1.0
            }
        }
    }
};
