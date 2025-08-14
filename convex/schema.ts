import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  paperAnalyses: defineTable({
    paperUrl: v.string(),
    status: v.string(), // "pending", "processing", "completed", "failed"
    createdAt: v.number(),
    title: v.optional(v.string()),
    answer: v.optional(v.string()), // the answer to the user's question
    response: v.optional(v.any()), // JSON string containing subconscious response
    result: v.optional(
      v.object({
        answer: v.string(),
        reasoning: v.string(),
      }),
    ), // JSON string containing analysis results
    updatedAt: v.optional(v.number()),
    tokensRead: v.optional(v.number()),
  }).index('by_status', ['status']),
});
