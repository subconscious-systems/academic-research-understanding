import { internalAction } from './_generated/server';
import { internal, api } from './_generated/api';
import { v } from 'convex/values';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const processPaper = internalAction({
  args: {
    paperId: v.id('paperAnalyses'),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: boolean; paperId: string; response?: unknown; error?: string }> => {
    try {
      // Get the paper object from the database
      const paper = await ctx.runQuery(api.papers.getPaperAnalysis, {
        id: args.paperId,
      });

      if (!paper) {
        throw new Error(`Paper with ID ${args.paperId} not found`);
      }

      if (!paper.paperUrl) {
        throw new Error('Paper URL is missing');
      }

      // Update status to processing
      await ctx.runMutation(internal.papers.updatePaperAnalysisStatus, {
        id: args.paperId,
        status: 'processing',
      });

      // Call OpenAI API to process the paper URL
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an academic research assistant. You will be given a URL to an academic paper. 
            Please analyze the paper and provide a comprehensive summary including:
            1. Title and authors
            2. Main research question/hypothesis
            3. Methodology used
            4. Key findings and results
            5. Conclusions and implications
            6. Limitations and future work
            
            Format your response as a structured JSON object with these sections.`,
          },
          {
            role: 'user',
            content: `Please analyze the academic paper at this URL: ${paper.paperUrl}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const response: string | null = completion.choices[0]?.message?.content;

      if (!response) {
        throw new Error('No response received from OpenAI');
      }

      // Parse the response as JSON if possible
      let parsedResponse: unknown;
      try {
        parsedResponse = JSON.parse(response);
      } catch {
        // If JSON parsing fails, store as plain text
        parsedResponse = { content: response };
      }

      // Save the response to the paper record
      await ctx.runMutation(internal.papers.updatePaperWithResponse, {
        id: args.paperId,
        response: parsedResponse,
        status: 'completed',
        tokensRead: completion.usage?.total_tokens || 0,
      });

      return {
        success: true,
        paperId: args.paperId,
        response: parsedResponse,
      };
    } catch (error) {
      // Update status to failed and save error
      await ctx.runMutation(internal.papers.updatePaperAnalysisStatus, {
        id: args.paperId,
        status: 'failed',
      });

      console.error('Error processing paper:', error);

      return {
        success: false,
        paperId: args.paperId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});
