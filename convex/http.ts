import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';

const http = httpRouter();

http.route({
  path: '/analyze',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    try {
      // Parse the request body
      const body = await request.json();

      // Extract the paper URL or data from the request
      const { paperUrl } = body;

      if (!paperUrl) {
        return new Response(JSON.stringify({ error: 'paperUrl is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Store the analysis request in the database
      const analysisId = await ctx.runMutation(internal.papers.createPaperAnalysis, {
        paperUrl,
      });

      // Return success response with the analysis ID
      return new Response(
        JSON.stringify({
          success: true,
          analysisId,
          message: 'Paper analysis request received',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        },
      );
    } catch (error) {
      console.error('Error processing analysis request:', error);

      return new Response(
        JSON.stringify({
          error: 'Failed to process analysis request',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }),
});

// Handle CORS preflight requests
http.route({
  path: '/analyze',
  method: 'OPTIONS',
  handler: httpAction(async () => {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }),
});

export default http;
