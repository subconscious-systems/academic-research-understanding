import { internalAction } from './_generated/server';
import { internal, api } from './_generated/api';
import { v } from 'convex/values';
import { FunctionDefinition } from 'openai/resources';

const tools: FunctionDefinition[] = [
  {
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
] as unknown as FunctionDefinition[];

const systemPrompt = `
You are Tim. You are a helpful assistant.
Following this agent workflow:
<agent_loop>
name: arxiv-to-startup-agent
version: 1.0
meta:
  author: You
  description: >
    Takes an arXiv paper URL, identifies the research gap and commercial value,
    maps to concrete business problems, and proposes 3 startup opportunities
    with revenue model, competition, and growth potential.
  style:
    tone: concise, analytical, plain-language
    avoid:
      - chain-of-thought exposition
      - purple prose
      - filler
    must:
      - cite sources when using the web
      - state dates explicitly when relevant
      - be clear about uncertainty
io:
  expected_input:
    arxiv_url: string
    user_constraints:
      optional:
        - target_industries: list[string]
        - geography: string
        - pricing_hint: string
        - risk_tolerance: enum[low,medium,high]
        - exclude_models: list[string]
  output_schema:
    type: object
    properties:
      paper:
        title: string
        authors: list[string]
        year: integer
        arxiv_id: string
        summary: string
        key_claims: list[string]
      research_gap:
        type: object
        properties:
          gap_type: enum[performance,capability,access,usability,other]
          evidence: list[string] # short bullet points with citations
          baseline_comparison: string
      industrial_applications: list[string] # ranked; with brief 1-liners + citations
      business_problems:
        primary: list[string]
        secondary: list[string]
      commercial_value:
        tam_sam_som:
          tam: string
          sam: string
          som: string
          methodology_note: string
        value_drivers: list[string] # e.g., cost↓, speed↑, accuracy↑, compliance
        blockers: list[string]      # e.g., data access, regulation, IP
      startup_ideas:
        type: list
        items:
          name: string
          core_tech: string
          target_customer: string
          problem_statement: string
          product:
            description: string
            delivery: enum[SaaS,API,OnPrem,HW+SW,Services+SW]
          revenue_model: list[string] # e.g., tiered SaaS, per-API-call, license + support
          pricing_back_of_envelope: string # quick math & assumptions
          competition:
            current_alternatives: list[string]
            differentiators: list[string]
            moat_hypotheses: list[string]
          go_to_market: list[string]
          risks_mitigations:
            risks: list[string]
            mitigations: list[string]
          growth:
            short_term: list[string]
            long_term: list[string]
          milestones_12mo: list[string]
      citations: list[object] # {source, url, accessed_at, note}
      appendix:
        related_work: list[string]
        key_metrics_to_validate: list[string]
        evaluation_plan: list[string]
constraints:
  max_iterations: 6
  timebox_seconds: 120
  musts:
    - Never fabricate citations or data.
    - Prefer primary sources (paper, official repos, docs).
    - Use absolute dates (e.g., "2025-08-13") when referring to “today/now.”
    - If confidence is low, say so and propose how to validate.
    - Do not reveal hidden reasoning; provide just conclusions and brief rationale.
  stop_conditions:
    - output_schema fully populated OR
    - iteration budget exhausted
tools:
  - name: SearchTool
    description: help you search information on Google.
    args: { query: string, a natural language query for the search engine. }
  - name: ReaderTool
    description: Read the content of general webpages using url with a goal.
    args: { url: string, The URL of the webpage to read. goal: string, The goal of reading the webpage. }
  - name: ArxivReaderTool
    description: Read an arxiv paper with the paper link on arxiv and find it's main points.
    args: { arxiv_url: string, The URL of the arxiv paper to read. }
memory:
  write:
    - key: recent_sources
      when: after_step: "Research aggregation"
      value: top 10 sources with titles, URLs, dates
  read:
    - key: recent_sources
rubric:
  evidence:
    - Every factual, time-sensitive claim has a citation.
    - Comparisons to baseline are specific (datasets, metrics, cost).
  reasoning:
    - Gap classification aligns with evidence from paper + benchmarks.
    - Commercial value ties to quantified pain (even if rough).
  ideas:
    - Each idea maps 1:1 to a business problem.
    - Clear economic buyer and GTM wedge.
    - Moat is plausible (IP, data, workflows, distribution).
  clarity:
    - Jargon minimized; acronyms expanded once.
    - Bullet-first with short paragraphs.
loop:
  - step: Parse Input
    action: >
      Validate arxiv_url; normalize; capture user constraints.
    on_error: halt_with_message
  - step: Retrieve Paper
    call: arxiv.metadata
    with: { url_or_id: {arxiv_url} }
    then:
      - call: pdf.parse
        with: { url: {paper.pdf_url}, sections: ["Title","Authors","Abstract","Introduction","Method","Experiments","Results","Conclusion","References"] }
      - extract:
          title: $.Title
          authors: $.Authors
          abstract: $.Abstract
          year: detect_from_pdf_or_metadata
      - summarize:
          summary: 5-7 sentence plain-language brief of abstract+conclusion
          key_claims: 3-5 bullets with metric or capability
  - step: Related Research & Applications
    call: scholarly.find_related
    with: { title: {title}, abstract: {abstract}, limit: 12 }
    then:
      - call: web.search
        with:
          query: "{title} applications industry case study"
          recency_days: 3650
      - aggregate:
          industrial_applications: ranked list with one-liners + source
  - step: Identify Research Gap
    action: >
      Compare paper claims vs state of the art (SOTA) using related work; classify gap_type.
    evidence:
      - benchmarks, ablations, or cost/speed deltas
    output:
      research_gap:
        gap_type: one_of[performance,capability,access,usability,other]
        evidence: 3-6 short bullets (each ends with [#])
        baseline_comparison: 1-2 sentences with numbers if available
  - step: Map to Business Problems
    action: >
      For each top industrial application, articulate concrete pains (who, where, consequence, cost).
    output:
      business_problems:
        primary: 3-6 bullets
        secondary: 3-6 bullets
  - step: Commercial Value Sizing
    action: >
      Use market.size_estimator + calc for back-of-envelope TAM/SAM/SOM; note assumptions.
    output:
      commercial_value:
        tam_sam_som: filled
        value_drivers: 3-5 bullets
        blockers: 3-5 bullets (regulatory, data, integration, IP)
  - step: Generate Startup Ideas (x3)
    for_each: i in [1..3]
    action: >
      Convert a high-value business problem into a startup concept with core tech from the paper.
    include:
      - delivery model (SaaS/API/OnPrem/HW+SW/Services+SW)
      - pricing math (calc)
      - competition (competitor.lookup + web.search)
      - moat hypotheses (data network effects, workflow lock-in, IP)
      - growth paths (adjacent markets, up/down-market)
      - 12-month milestones
    ensure:
      - Each idea solves a distinct problem or targets a distinct ICP (ideal customer profile).
  - step: Quality Gate
    checks:
      - citations_present_for_recent_claims: true
      - no_fabrication: true
      - clarity_pass: true
      - output_schema_complete_or_reasoned_gaps: true
    if_fail:
      - refine_explanations
      - add_citations
      - simplify_language
  - step: Produce Output
    action: >
      Emit JSON object conforming to output_schema. Keep prose compact; bullets preferred.
    note:
      - Include "accessed_at" timestamps (ISO 8601) for each citation.
      - If data is missing, state “Unknown” and add a validation plan in appendix.
examples:
  - name: minimal_run
    input:
      arxiv_url: "https://arxiv.org/abs/2401.00001" or "https://arxiv.org/pdf/2401.00001"
    output_note: >
      The agent will return a research report with 3 startup ideas,
      each with revenue model, competition, and growth, plus citations.
Answer:
  - detailed articulation of each startup idea, including the following information:
    - company name
    - headline
    - industry
    - business model
    - moat againt other companies
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

      console.log('tools', tools);
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
            content: `Please analyze the academic paper at this URL: ${paper.paperUrl}`,
          },
        ],
        stream: true,
        top_p: 0.95,
        temperature: 0.3,
        tools: [
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
            description:
              "Read an arxiv paper with the paper link on arxiv and find it's main points.",
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
        ],
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

      // Process the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();

              if (data === '[DONE]') {
                break;
              }

              try {
                const parsed = JSON.parse(data);
                console.log('chunk', parsed);

                const content = parsed.choices?.[0]?.delta?.content;
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
                if (parsed.usage?.total_tokens) {
                  totalTokens = parsed.usage.total_tokens;
                }
              } catch (parseError) {
                // Skip malformed JSON chunks
                console.warn('Failed to parse chunk:', data, parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
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
