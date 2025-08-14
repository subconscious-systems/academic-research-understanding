import { internalAction } from './_generated/server';
import { internal, api } from './_generated/api';
import { v } from 'convex/values';

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
  //   {
  //     type: 'function',
  //     name: 'SurveyReaderTool',
  //     description:
  //       'Read large documents by retrieving paginated content chunks. Use pageIndex to get different sections (0=first 200k tokens, 1=next 200k tokens, etc).',
  //     url: 'https://flexible-hedgehog-91.convex.site/tools',
  //     method: 'POST',
  //     timeout: 30,
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         url: {
  //           type: 'string',
  //           description: 'The URL of the large document to read.',
  //         },
  //         pageIndex: {
  //           type: 'integer',
  //           description:
  //             'The page offset for pagination (0=first 200k tokens, 1=next 200k tokens, etc). Defaults to 0.',
  //         },
  //       },
  //       required: ['url'],
  //       additionalProperties: false,
  //     },
  //   },
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
    goal: Validate input and build initial context
    tree:
      - node: validate_input
        action: ensure arxiv_url is arxiv.org; normalize to HTML form
      - node: parse_metadata
        action: retrieve title, authors, year, abstract, arxiv_id
      - node: read_paper_fast
        action: pdf.parse sections ["Title","Authors","Abstract","Intro","Method","Results","Conclusion","References"]
      - node: generate_topics
        action: derive 5 to 10 primary topics from abstract, intro, methods
      - node: list_references_top10
        action: extract 10 central references with title, venue, year, url, ids
      - node: find_surveys
        action: search arXiv, IEEE, ACM for surveys; collect at least 3 relevant surveys
  - name: Read the survey papers
    goal: Map overlaps and potential novelty vs surveys
    tree:
      - node: read_each_survey
        action: LargeDocumentTool read with token_window 200000 and stride 20000
      - node: map_against_original
        action: for each survey, record overlaps and potential novel components
      - node: deepen_if_needed
        condition: uncertainty on novelty or scope gaps
        action: branch to additional domain surveys or targeted sections
  - name: Read the related papers
    goal: Understand subject matter and refine novelty
    tree:
      - node: discover_related
        action: scholarly.find_related plus web search for benchmarks and adjacent methods
      - node: read_related
        action: LargeDocumentTool reads for selected related papers
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
      - node: ensure_coverage
        action: find at least 5 relevant startups with brief descriptions and urls
      - node: cluster
        action: group by subfield, buyer, or delivery model
  - name: Generate six startup candidates
    goal: Synthesize commercialization options
    tree:
      - node: synthesize_6
        action: create 6 distinct concepts using the paper’s core tech and insights
      - node: include_fields
        action: for each concept include target customer, problem, product, delivery, revenue model, moat hypothesis, 12 month milestones
      - node: choose_top_three
        action: select 3 most promising based on feasibility, novelty leverage, and GTM wedge
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

      let accumulatedResponse = '';
      let totalTokens = 0;
      let iterationCount = 0;

      // Simple streaming response processing
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          iterationCount++;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && !line.includes('[DONE]')) {
              const data = line.slice(6).trim();
              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    accumulatedResponse += content;
                  }
                  if (parsed.usage?.total_tokens) {
                    totalTokens = parsed.usage.total_tokens;
                  }
                } catch (parseError) {
                  // Skip malformed JSON chunks (common in streaming)
                  console.warn('Skipping malformed JSON chunk:', data.substring(0, 100));
                  continue;
                }
              }
            }
          }

          // Update database with current progress
          await ctx.runMutation(internal.papers.updatePaperWithResponse, {
            id: args.paperId,
            response: {
              content: accumulatedResponse,
              iterationCount,
              isStreaming: true,
            },
            status: 'processing',
            tokensRead: totalTokens,
          });
        }
      } finally {
        reader.releaseLock();
      }

      // Final update with completed status and parsed response
      await ctx.runMutation(internal.papers.updatePaperWithResponse, {
        id: args.paperId,
        response: accumulatedResponse,
        status: 'completed',
        tokensRead: totalTokens,
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
