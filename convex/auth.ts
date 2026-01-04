import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// One-time session invalidation (for forcing re-login)
export const invalidateAllSessions = mutation({
  args: { adminUsername: v.string() },
  handler: async (ctx, { adminUsername }) => {
    // Only admin can do this
    if (adminUsername.toLowerCase() !== "will") {
      throw new Error("Admin only");
    }
    
    // Store the invalidation timestamp
    await ctx.db.insert("sessionControl", {
      invalidateAfter: Date.now(),
      reason: "One-time cleanup - users need to login with own credentials",
    });
    
    return { success: true, timestamp: Date.now() };
  },
});

// Check if current session is still valid
export const getSessionControl = query({
  args: {},
  handler: async (ctx) => {
    const control = await ctx.db
      .query("sessionControl")
      .order("desc")
      .first();
    
    return control;
  },
});

