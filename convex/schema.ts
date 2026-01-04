import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  games: defineTable({
    gridPattern: v.array(v.array(v.number())),
    gridNumbers: v.array(v.array(v.number())),
    gridValues: v.array(v.array(v.string())),
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
    selectedCell: v.union(
      v.null(),
      v.object({
        row: v.number(),
        col: v.number(),
      })
    ),
    direction: v.union(v.literal("across"), v.literal("down")),
    joinCode: v.optional(v.string()),
    players: v.optional(v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        selectedCell: v.union(
          v.null(),
          v.object({
            row: v.number(),
            col: v.number(),
          })
        ),
        direction: v.union(v.literal("across"), v.literal("down")),
        color: v.string(),
      })
    )),
    createdAt: v.optional(v.number()),
    createdBy: v.optional(v.string()), // Username of creator
    updatedAt: v.optional(v.number()),
  }).index("by_join_code", ["joinCode"]).index("by_creator", ["createdBy"]),
  
  users: defineTable({
    username: v.string(),
    password: v.string(),
    createdAt: v.number(),
  }).index("by_username", ["username"]),
  
  activityLog: defineTable({
    username: v.string(),
    action: v.union(v.literal("login"), v.literal("game_created"), v.literal("game_joined")),
    gameId: v.optional(v.string()),
    joinCode: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_username", ["username"]).index("by_timestamp", ["timestamp"]),
});

