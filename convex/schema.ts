import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  paperAnalyses: defineTable({
    paperUrl: v.string(),
    status: v.string(), // "pending", "processing", "completed", "failed"
    createdAt: v.number(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
    response: v.optional(v.any()), // JSON string containing subconscious response
    result: v.optional(v.any()), // JSON string containing analysis results
    tokensRead: v.optional(v.number()),
    sources: v.optional(v.array(v.string())),
  }).index('by_status', ['status']),
});
