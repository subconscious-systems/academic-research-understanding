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
      'Read **survey pages** by retrieving paginated content. Use pageIndex to get different sections (0=first 200k tokens, 1=next 200k tokens, etc). Only use for survey papers, not regular research papers. If the webpage_understanding tool fails, you can use this tool as well.',
    url: 'https://flexible-hedgehog-91.convex.site/tools',
    method: 'POST',
    timeout: 30,
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description:
            'The arxiv html url of the **survey paper**: https://arxiv.org/html/[PAPER_ID]',
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
name: arxiv-to-startup-agent
version: 1.2
meta:
  author: You
  description: >
    Focus on five core steps with flexible, branching reasoning trees.
    Validate an arXiv link, read and compare surveys and related work,
    find startups, and generate commercialization ideas.
    Any arXiv links should be normalized to the HTML format:
    Take the last path segment from the provided URL (including version),
    and append it to "https://arxiv.org/html/". For example:
    https://arxiv.org/pdf/2303.18223 → https://arxiv.org/html/2303.18223v16
  style:
    tone: concise, analytical, plain-language
    must:
      - cite sources for time-sensitive or external claims
      - state dates explicitly
      - be clear about uncertainty
      - do not reveal hidden chain-of-thought; output only conclusions and evidence
io:
  expected_input:
    arxiv_url: string
  output_schema:
    type: object
    properties:
      novelty_ranking:
        score_0_to_100: number
        explanation: string
      industries_broad: list[string]
      top_three_startup_ideas:
        type: list
        items:
          name: string
          headline: string
          industry: string
          business_model: string
          moat: list[string]
      citations: list[object] # {source, url, accessed_at, note}
constraints:
  musts:
    - Only accept inputs from arxiv.org (abs or pdf). Otherwise halt with message.
    - Never fabricate citations or data.
    - Prefer primary sources.
phases:
  - name: Preprocessing
    goal: Validate input and build initial context using the ArxivReaderTool
    tree:
      - node: validate_input
        action: ensure arxiv_url is arxiv.org; normalize to HTML form
        subtasks:
        - node: parse_metadata
          action: retrieve title, authors, year, abstract, arxiv_id
        - node: read_paper_fast
          action: pdf.parse sections ["Title","Authors","Abstract","Intro","Method","Results","Conclusion","References"]
        end subtask
      - node: generate_topics
        action: derive 5 to 10 primary topics from abstract, intro, methods
  - name: Read the survey papers
    goal: Map overlaps and potential novelty vs surveys
    tree:
      - node: find_surveys
        action: search arXiv, IEEE, ACM for surveys; for each primary topics find 3 surveys
      - node: compare_with_all_surveys
        subtasks: for each primary topic
        goal: find the novelty of the input paper among previous research in this topic
          subtasks: for each survey
            goal: read survey
            subtasks: for each page in the survey
            goal: read page
              - subnode: read page using the SurveyReaderTool, specifying the page index, then summarize relevant studies you found in this page with their approach and limitations.
              - subnode: compare the input paper with the summary for relevant studies, decide how novel is the input paper and explain the reason
            end subtask when hasNextPage is false
            aggregate the innovations made by the paper compared to existing work mentioned in the survey
          end subtask
        end subtask
        aggregate the differences you found between the paper and all surveys
      - node: deepen_if_needed
        condition: uncertainty on novelty or scope gaps
        action: branch to additional domain surveys or targeted sections
    output: novelty of the input paper and the information about the survey papers you researched.
  - name: Read the related papers
    goal: Understand subject matter and refine novelty
    tree:
      - node: discover_related
        action: use web search for benchmarks and adjacent methods
        subtasks
        - node: read_related
          action: ArxivReaderTool reads for selected related papers
        - node: subject_matter_understanding
          action: build methods map, datasets, metrics, strongest baselines with numbers
        - node: novelty_refinement
          action: compare original to related work, update overlaps and potential novel pieces
      - node: exploratory_branches
        action: optionally follow subtopics that clarify applications or novelty depth
  - name: Search relevant startups
    goal: Landscape scan
    tree:
      - node: query_space
        action: search for companies per primary topics and capabilities
        subtasks:
        - node: iterative search
        - node: ensure_coverage
          action: find at least 5 relevant startups with brief descriptions and urls
      - node: cluster
        action: group by subfield, buyer, or delivery model
  - name: Brainstore startup candidates
    goal: Synthesize commercialization options
    tree:
      - node: synthesize_6
        action: create 6 distinct industries where the paper's core tech and insights can be applied
      - node: industry challenge research
        goal: find the challenge in each industry that can be solved by the technology
        subtasks: for each industry
        - node: challenge-tech match
          action: think about industry problems and what the proposed technology can do, and then conclude with how the technology can help the industry
        end subtask
        summarize all challenge-tech matches
      - node: include_fields
        action: generate startup ideas
        subtasks: for each legit challenge-tech matches you find
        - node: business idea
          action: analyze target customer, problem, product, delivery, revenue model, moat hypothesis, 12 month milestones
      - node: choose_top_three
        action: select 3 most promising company ideas based on feasibility, novelty leverage, and GTM wedge.
answer:
  assemble:
    - novelty_ranking with score 0 to 100 and a concise explanation tied to surveys and related work
    - industries_broad ranked list
    - top_three_startup_ideas with name, headline, industry, business_model, moat
    - citations with ISO 8601 accessed_at timestamps
quality_gate:
  checks:
    - at_least_three_surveys: true
    - at_least_five_startups_found: true
    - six_candidates_generated: true
    - citations_present_for_recent_claims: true
    - clarity_pass: true
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
                  let content = parsed.choices?.[0]?.delta?.content;

                  // within content, cut out anything that comes after tool_result: in "" or '', replace with "" or ''
                  // Single quotes
                  content = content.replace(/'tool_result'\s*:\s*'(.*?)'/g, `'tool_result': ''`);

                  // Double quotes
                  content = content.replace(/"tool_result"\s*:\s*"(.*?)"/g, `"tool_result": ""`);
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
