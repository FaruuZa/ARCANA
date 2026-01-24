export const FACTIONS = {
    solaris: {
        name: "Solaris",
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
    }
};
