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
const PLAYER_COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
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
      .withIndex("by_join_code", (q) => q.eq("joinCode", args.joinCode.toUpperCase()))
      .first();
    
    if (!game) {
      throw new Error("Game not found");
    }
    
    const players = game.players || [];
    
    // Check if player already in game
    const existingPlayer = players.find((p) => p.id === args.playerId);
    if (existingPlayer) {
      return game._id; // Already joined
    }
    
    // Add new player
    const colorIndex = players.length % PLAYER_COLORS.length;
    await ctx.db.patch(game._id, {
      players: [
        ...players,
        {
          id: args.playerId,
          name: args.playerName,
          selectedCell: null,
          direction: "across",
          color: PLAYER_COLORS[colorIndex],
        },
      ],
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
    if (!game) throw new Error("Game not found");

    const newGridValues = game.gridValues.map((r, rowIdx) =>
      r.map((cell, colIdx) =>
        rowIdx === args.row && colIdx === args.col ? args.value : cell
      )
    );

    await ctx.db.patch(args.gameId, {
      gridValues: newGridValues,
      updatedAt: Date.now(),
    });
  },
});

// Update selected cell and direction for a specific player
export const updateSelection = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.string(),
    selectedCell: v.union(
      v.null(),
      v.object({
        row: v.number(),
        col: v.number(),
      })
    ),
    direction: v.union(v.literal("across"), v.literal("down")),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    
    const players = game.players || [];
    
    // Update the specific player's selection
    const updatedPlayers = players.map((player) =>
      player.id === args.playerId
        ? { ...player, selectedCell: args.selectedCell, direction: args.direction }
        : player
    );
    
    await ctx.db.patch(args.gameId, {
      players: updatedPlayers,
      updatedAt: Date.now(),
    });
  },
});

