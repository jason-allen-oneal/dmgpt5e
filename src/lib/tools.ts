export function getDiceRollTool() {
    return {
        type: "function",
        function: {
            name: "dice_roll",
            description: "Roll a dice",
            parameters: {
                type: "object",
                properties: {
                    dice: { type: "string", description: "The dice to roll" },
                },
            },
        },
    }
}

export function rollDice(dice: string): number[] {
    // Supports formats like 'd20', '2d6', '3d4', etc.
    const match = dice.match(/^(\d*)d(\d+)$/i)
    if (!match) return []
    const num = match[1] ? parseInt(match[1], 10) : 1
    const sides = parseInt(match[2], 10)
    if (!sides || num < 1) return []
    const rolls = []
    for (let i = 0; i < num; i++) {
        rolls.push(1 + Math.floor(Math.random() * sides))
    }
    return rolls
}