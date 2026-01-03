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
    updatedAt: v.optional(v.number()),
  }).index("by_join_code", ["joinCode"]),
});

