import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Initialize hardcoded users (run once)
export const initializeUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const existingBilly = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "billy"))
      .first();
    
    if (!existingBilly) {
      await ctx.db.insert("users", {
        username: "billy",
        password: "07312025",
        createdAt: Date.now(),
      });
    }

    const existingSaran = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "saran"))
      .first();
    
    if (!existingSaran) {
      await ctx.db.insert("users", {
        username: "saran",
        password: "07312025",
        createdAt: Date.now(),
      });
    }
  },
});

// Get all users (admin only)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Log activity
export const logActivity = mutation({
  args: {
    username: v.string(),
    action: v.union(v.literal("login"), v.literal("game_created"), v.literal("game_joined")),
    gameId: v.optional(v.string()),
    joinCode: v.optional(v.string()),
  },
  handler: async (ctx, { username, action, gameId, joinCode }) => {
    await ctx.db.insert("activityLog", {
      username,
      action,
      gameId,
      joinCode,
      timestamp: Date.now(),
    });
  },
});

// Get activity log (admin only)
export const getActivityLog = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query("activityLog").order("desc").take(100);
    return logs;
  },
});

// Get user's games
export const getUserGames = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    // Get games created by user
    const createdGames = await ctx.db
      .query("games")
      .withIndex("by_creator", (q) => q.eq("createdBy", username))
      .collect();
    
    // Get games joined by user
    const allGames = await ctx.db.query("games").collect();
    const joinedGames = allGames.filter((game) =>
      game.players?.some((p) => p.name.toLowerCase() === username.toLowerCase())
    );
    
    // Combine and dedupe
    const gameMap = new Map();
    for (const game of [...createdGames, ...joinedGames]) {
      gameMap.set(game._id, game);
    }
    
    return Array.from(gameMap.values());
  },
});

