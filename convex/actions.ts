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

      // Call OpenAI API with streaming to process the paper URL
      const stream = await openai.chat.completions.create({
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
        stream: true,
      });

      let accumulatedResponse = '';
      let totalTokens = 0;

      // Process the stream and update the database with each chunk
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          accumulatedResponse += content;

          // Update the database with the current accumulated response
          await ctx.runMutation(internal.papers.updatePaperWithResponse, {
            id: args.paperId,
            response: { content: accumulatedResponse, isStreaming: true },
            status: 'processing',
            tokensRead: totalTokens,
          });
        }

        // Track token usage if available
        if (chunk.usage?.total_tokens) {
          totalTokens = chunk.usage.total_tokens;
        }
      }

      if (!accumulatedResponse) {
        throw new Error('No response received from OpenAI');
      }

      // Try to parse the final response as JSON
      let parsedResponse: unknown;
      try {
        parsedResponse = JSON.parse(accumulatedResponse);
      } catch {
        // If JSON parsing fails, store as plain text
        parsedResponse = { content: accumulatedResponse };
      }

      // Final update with completed status and parsed response
      await ctx.runMutation(internal.papers.updatePaperWithResponse, {
        id: args.paperId,
        response: parsedResponse,
        status: 'completed',
        tokensRead: totalTokens,
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
