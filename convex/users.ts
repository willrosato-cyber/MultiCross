import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Initialize hardcoded users (run once)
export const initializeUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const existingWill = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "will"))
      .first();
    
    if (!existingWill) {
      await ctx.db.insert("users", {
        username: "will",
        password: "07312025",
        createdAt: Date.now(),
      });
    }

    const existingSara = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "sara"))
      .first();
    
    if (!existingSara) {
      await ctx.db.insert("users", {
        username: "sara",
        password: "07312025",
        createdAt: Date.now(),
      });
    }

    const existingHannah = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "hannah"))
      .first();
    
    if (!existingHannah) {
      await ctx.db.insert("users", {
        username: "hannah",
        password: "tenafly",
        createdAt: Date.now(),
      });
    }

    const existingJustin = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "justin"))
      .first();
    
    if (!existingJustin) {
      await ctx.db.insert("users", {
        username: "justin",
        password: "patek",
        createdAt: Date.now(),
      });
    }

    const existingDavid = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "david"))
      .first();
    
    if (!existingDavid) {
      await ctx.db.insert("users", {
        username: "david",
        password: "serra",
        createdAt: Date.now(),
      });
    }

    const existingBrett = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "brett"))
      .first();
    
    if (!existingBrett) {
      await ctx.db.insert("users", {
        username: "brett",
        password: "itsover",
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

// Delete a user account (admin only)
export const deleteUser = mutation({
  args: {
    username: v.string(),
    adminUsername: v.string(),
  },
  handler: async (ctx, { username, adminUsername }) => {
    // Only admin can delete users
    if (adminUsername.toLowerCase() !== "will") {
      throw new Error("Admin only");
    }
    
    // Don't allow deleting the admin account
    if (username.toLowerCase() === "will") {
      throw new Error("Cannot delete admin account");
    }
    
    // Find and delete the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    
    if (user) {
      await ctx.db.delete(user._id);
      return { success: true, username };
    }
    
    throw new Error("User not found");
  },
});

