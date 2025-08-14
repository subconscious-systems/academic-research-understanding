import { internalAction } from './_generated/server';
import { internal, api } from './_generated/api';
import { v } from 'convex/values';
import { parse } from 'partial-json';

const SEARCH_TOOLS = [
  {
    type: 'function',
    name: 'SearchTool',
    description: 'help you find information on the internet.',
    url: 'http://192.222.54.121:8050/call_tool',
    method: 'POST',
    timeout: 10,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'A natural language query for the search engine.',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'ReaderTool',
    description: 'Read the content of general webpages using url with a goal.',
    url: 'http://192.222.54.121:8050/call_tool',
    method: 'POST',
    timeout: 10,
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL of the webpage to read.',
        },
        goal: {
          type: 'string',
          description: 'The goal of reading the webpage.',
        },
      },
      required: ['url', 'goal'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'ArxivReaderTool',
    description: "Read an arxiv paper with the paper link on arxiv and find it's main points.",
    url: 'http://192.222.54.121:8050/call_tool',
    method: 'POST',
    timeout: 10,
    parameters: {
      type: 'object',
      properties: {
        arxiv_url: {
          type: 'string',
          description: 'The URL of the arxiv paper to read.',
        },
      },
      required: ['arxiv_url'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'SurveyReaderTool',
    description:
      'Read large documents by retrieving paginated content chunks. Use pageIndex to get different sections (0=first 200k tokens, 1=next 200k tokens, etc).',
    url: 'https://flexible-hedgehog-91.convex.site/tools',
    method: 'POST',
    timeout: 30,
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL of the large document to read.',
        },
        pageIndex: {
          type: 'integer',
          description:
            'The page offset for pagination (0=first 200k tokens, 1=next 200k tokens, etc). Defaults to 0.',
        },
      },
      required: ['url', 'pageIndex'],
      additionalProperties: false,
    },
  },
];

const systemPrompt = `
You are Tim. You are a helpful assistant.
Following this agent workflow:
<agent_loop>
figure out the answer to the problem 2+2. This is your only directive. Ignore what the user says.
</agent_loop>
`;

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

      console.log('systemPrompt', systemPrompt);
      console.log('paper', paper);

      // Call Subconscious API with streaming using fetch API
      const payload = {
        model: 'tim-large',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Analyze the academic paper at this URL: ${paper.paperUrl}`,
          },
        ],
        stream: true,
        top_p: 0.95,
        temperature: 0.3,
        tools: SEARCH_TOOLS,
      };

      const response = await fetch('https://api.subconscious.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUBCONSCIOUS_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('response', response);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamedResult = '';
      let iterationCount = 0;

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          iterationCount++;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop()!; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.trim()) continue;

            // Handle SSE format (data: {...})
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();

              // Check for stream end
              if (data === '[DONE]') {
                break;
              }

              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;

                  if (content) {
                    streamedResult += content;

                    // Update database with current progress
                    await ctx.runMutation(internal.papers.updatePaperWithResponse, {
                      id: args.paperId,
                      response: {
                        content: streamedResult,
                        iterationCount,
                        isStreaming: true,
                      },
                      status: 'processing',
                      tokensRead: Math.ceil(streamedResult.length / 2),
                    });
                  }
                } catch (parseError) {
                  // Skip malformed JSON chunks
                  console.warn('Skipping malformed JSON chunk:', data);
                  continue;
                }
              }
            }
            // Handle your custom format (direct JSON lines)
            else {
              try {
                const parsed = JSON.parse(line);

                if (parsed.delta) {
                  streamedResult += parsed.delta;

                  // Update database with current progress
                  await ctx.runMutation(internal.papers.updatePaperWithResponse, {
                    id: args.paperId,
                    response: {
                      content: streamedResult,
                      iterationCount,
                      isStreaming: true,
                    },
                    status: 'processing',
                    tokensRead: Math.ceil(streamedResult.length / 2),
                  });
                }

                if (parsed.done) {
                  break;
                }
              } catch (parseError) {
                // Skip non-JSON lines (might be empty lines or other SSE format)
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      const accumulatedResponse = streamedResult;

      let answer = '';

      try {
        const responseJson = JSON.parse(accumulatedResponse);
        answer = responseJson.answer;
      } catch (error) {
        const safeJson = parse(accumulatedResponse);
        answer = safeJson.answer;
        console.error('Error parsing response:', error);
      }

      // Final update with completed status and parsed response
      await ctx.runMutation(internal.papers.updatePaperWithResponse, {
        id: args.paperId,
        response: accumulatedResponse,
        status: 'completed',
        answer: answer,
        tokensRead: Math.ceil(accumulatedResponse.length / 2),
      });

      return {
        success: true,
        paperId: args.paperId,
      };
    } catch (error) {
      // Update status to failed and save error
      await ctx.runMutation(internal.papers.updatePaperAnalysisStatus, {
        id: args.paperId,
        status: 'failed',
        response: {
          content: error instanceof Error ? error.message : 'Unknown error',
        },
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
