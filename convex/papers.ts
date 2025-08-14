import { internal } from './_generated/api';
import { query, internalMutation, mutation } from './_generated/server';
import { v } from 'convex/values';

// Create a new paper analysis request
export const createPaperAnalysis = mutation({
  args: {
    paperUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const analysisId = await ctx.db.insert('paperAnalyses', {
      paperUrl: args.paperUrl,
      status: 'pending',
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.actions.processPaper, { paperId: analysisId });

    return analysisId;
  },
});

// Get all paper analyses
export const getAllPaperAnalyses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('paperAnalyses').order('desc').collect();
  },
});

// Get a specific analysis by ID
export const getPaperAnalysis = query({
  args: { id: v.id('paperAnalyses') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update analysis status (for when processing is complete)
export const updatePaperAnalysisStatus = internalMutation({
  args: {
    id: v.id('paperAnalyses'),
    status: v.string(),
    response: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      response: args.response,
      updatedAt: Date.now(),
    });
  },
});

// Update paper with OpenAI response
export const updatePaperWithResponse = internalMutation({
  args: {
    id: v.id('paperAnalyses'),
    response: v.any(),
    status: v.string(),
    tokensRead: v.optional(v.number()),
    answer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      response: args.response,
      status: args.status,
      tokensRead: args.tokensRead,
      answer: args.answer,
      updatedAt: Date.now(),
    });
  },
});
