import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';

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
      const analysisId = await ctx.runMutation(api.papers.createPaperAnalysis, {
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

// Paginated content retrieval endpoint
http.route({
  path: '/tools',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { tool_name, parameters } = body;

    if (!tool_name || !parameters) {
      return new Response(JSON.stringify({ error: 'tool_name and parameters are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (tool_name === 'SurveyReaderTool') {
      try {
        // Use the parameters from the already parsed body
        const { url, offset = 0 } = parameters;

        if (!url) {
          return new Response(JSON.stringify({ error: 'url is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (typeof offset !== 'number' || offset < 0) {
          return new Response(JSON.stringify({ error: 'offset must be a non-negative number' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Fetch content from the URL
        let content: string;
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
          }
          content = await response.text();
        } catch (fetchError) {
          return new Response(
            JSON.stringify({
              error: 'Failed to fetch content from URL',
              details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }

        // Estimate tokens using character count (2 characters ≈ 1 token)
        const totalTokens = Math.ceil(content.length / 2);

        // Calculate pagination
        const tokensPerPage = 200000; // 200k tokens per page
        const charsPerPage = tokensPerPage * 2; // 400k characters per page
        const startIndex = offset * charsPerPage;

        // Check if offset is out of bounds
        if (startIndex >= content.length) {
          return new Response(
            JSON.stringify({
              error: 'Out of bounds, reached end of large document',
              totalTokens,
              totalCharacters: content.length,
              requestedOffset: offset,
              maxOffset: Math.floor(content.length / charsPerPage),
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type',
              },
            },
          );
        }

        // Extract the character slice
        const endIndex = Math.min(startIndex + charsPerPage, content.length);
        const pageContent = content.slice(startIndex, endIndex);
        const actualTokens = Math.ceil(pageContent.length / 2);

        return new Response(
          JSON.stringify({
            success: true,
            content: pageContent,
            pagination: {
              offset,
              tokensPerPage,
              tokenCount: actualTokens,
              totalTokens,
              totalCharacters: content.length,
              hasNextPage: endIndex < content.length,
              nextOffset: endIndex < content.length ? offset + 1 : null,
            },
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
        console.error('Error processing content request:', error);

        return new Response(
          JSON.stringify({
            error: 'Failed to process content request',
            details: error instanceof Error ? error.message : 'Unknown error',
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          },
        );
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid tool name' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
});

// Handle CORS preflight requests for content endpoint
http.route({
  path: '/content',
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
