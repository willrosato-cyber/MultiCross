import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate a random 6-character join code
function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Player colors for cursor display
// First player (creator) always gets blue, second player always gets red
const PLAYER_COLORS = [
  "#3B82F6", // blue - always first/creator
  "#EF4444", // red - always second player
  "#10B981", // green
  "#F59E0B", // amber
  "#8B5CF6", // purple
  "#EC4899", // pink
];

// Create a new game
export const createGame = mutation({
  args: {
    gridPattern: v.array(v.array(v.number())),
    gridNumbers: v.array(v.array(v.number())),
    gridSize: v.union(v.literal(15), v.literal(21)),
    clues: v.object({
      across: v.array(
        v.object({
          number: v.number(),
          text: v.string(),
          answer: v.string(),
          row: v.number(),
          col: v.number(),
          direction: v.literal("across"),
        })
      ),
      down: v.array(
        v.object({
          number: v.number(),
          text: v.string(),
          answer: v.string(),
          row: v.number(),
          col: v.number(),
          direction: v.literal("down"),
        })
      ),
    }),
    playerId: v.string(),
    playerName: v.string(),
  },
  handler: async (ctx, args) => {
    let joinCode = generateJoinCode();
    
    // Ensure unique join code
    let existing = await ctx.db
      .query("games")
      .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
      .first();
    
    while (existing) {
      joinCode = generateJoinCode();
      existing = await ctx.db
        .query("games")
        .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
        .first();
    }
    
    const gameId = await ctx.db.insert("games", {
      gridPattern: args.gridPattern,
      gridNumbers: args.gridNumbers,
      gridValues: Array(args.gridSize)
        .fill("")
        .map(() => Array(args.gridSize).fill("")),
      gridSize: args.gridSize,
      clues: args.clues,
      selectedCell: null,
      direction: "across",
      joinCode,
      players: [
        {
          id: args.playerId,
          name: args.playerName,
          selectedCell: null,
          direction: "across",
          color: PLAYER_COLORS[0],
        },
      ],
      createdAt: Date.now(),
      createdBy: args.playerName,
      updatedAt: Date.now(),
    });
    return { gameId, joinCode };
  },
});

// Join a game by code
export const joinGame = mutation({
  args: {
    joinCode: v.string(),
    playerId: v.string(),
    playerName: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_join_code", (q) => q.eq("joinCode", args.joinCode))
      .first();
    
    if (!game) {
      throw new Error("Game not found");
    }
    
    // Check if player already exists (by name, case-insensitive)
    const existingPlayerIndex = game.players?.findIndex(
      (p) => p.name.toLowerCase() === args.playerName.toLowerCase()
    ) ?? -1;
    
    let updatedPlayers = game.players || [];
    
    if (existingPlayerIndex >= 0) {
      // Player exists, update their ID
      updatedPlayers[existingPlayerIndex] = {
        ...updatedPlayers[existingPlayerIndex],
        id: args.playerId,
      };
    } else {
      // New player, add them
      // Assign color: creator gets blue (0), second player gets red (1), others cycle
      const colorIndex = updatedPlayers.length % PLAYER_COLORS.length;
      updatedPlayers.push({
        id: args.playerId,
        name: args.playerName,
        selectedCell: null,
        direction: "across",
        color: PLAYER_COLORS[colorIndex],
      });
    }
    
    await ctx.db.patch(game._id, {
      players: updatedPlayers,
      updatedAt: Date.now(),
    });
    
    return game._id;
  },
});

// Get a game by ID
export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

// Update a cell value
export const updateCell = mutation({
  args: {
    gameId: v.id("games"),
    row: v.number(),
    col: v.number(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return;
    
    const newValues = game.gridValues.map((r) => [...r]);
    newValues[args.row][args.col] = args.value;
    
    await ctx.db.patch(args.gameId, {
      gridValues: newValues,
      updatedAt: Date.now(),
    });
  },
});

// Update player's selected cell and direction
export const updateSelection = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.string(),
    selectedCell: v.object({
      row: v.number(),
      col: v.number(),
    }),
    direction: v.union(v.literal("across"), v.literal("down")),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || !game.players) return;
    
    const updatedPlayers = game.players.map((player) =>
      player.id === args.playerId
        ? {
            ...player,
            selectedCell: args.selectedCell,
            direction: args.direction,
          }
        : player
    );
    
    await ctx.db.patch(args.gameId, {
      players: updatedPlayers,
      updatedAt: Date.now(),
    });
  },
});

// Delete a game (creator or will can delete)
export const deleteGame = mutation({
  args: {
    gameId: v.id("games"),
    username: v.string(),
  },
  handler: async (ctx, { gameId, username }) => {
    const game = await ctx.db.get(gameId);
    
    if (!game) {
      throw new Error("Game not found");
    }
    
    // Check if user is the creator OR is will (admin)
    const isCreator = game.createdBy === username;
    const isAdmin = username.toLowerCase() === 'will';
    const isPlayer = game.players?.some(p => p.name.toLowerCase() === username.toLowerCase());
    
    if (!isCreator && !(isAdmin && isPlayer)) {
      throw new Error("Only the creator or admin can delete this game");
    }
    
    // Delete the game
    await ctx.db.delete(gameId);
  },
});
