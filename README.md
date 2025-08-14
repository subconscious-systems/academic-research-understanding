# ARXIV GIGARESEARCH

A retro-styled research analysis tool that helps you understand deeply technical papers by leveraging AI agents to break down complex research and compare it to vast amounts of academic literature.

## What ARXIV GIGARESEARCH Does

ARXIV GIGARESEARCH is built on top of [Subconscious](https://subconscious.dev), an AI platform that enables complex reasoning through structured task decomposition. When you input an arXiv paper URL, our system:

- **Analyzes complex research papers** using AI agents that can reason through multi-step problems
- **Performs deep literature analysis** by searching and comparing against thousands of pages of academic work
- **Provides structured insights** through a visual reasoning tree that shows how the AI breaks down the analysis
- **Delivers comprehensive summaries** that make technical papers accessible and understandable

## Subconscious API Integration

The backbone of ARXIV GIGARESEARCH is surprisingly simple: we just give the Subconscious platform prompts and tools and bam, we have a research agent.

### 1. **Two Hosted Tools**

- **SearchTool**: Enables the AI to search across vast academic databases and literature
- **ReaderTool**: Allows the AI to deeply understand and analyze web content and PDFs

### 2. **Smart Prompting**

- A carefully crafted prompt that instructs the AI on how to analyze research papers
- Guides the AI to break down complex problems into manageable subtasks
- Ensures comprehensive analysis that covers methodology, findings, and broader implications

That's it! Just **2 tools + 1 prompt = powerful research analysis agent**. The Subconscious platform handles all the complex orchestration, reasoning trees, and task management under the hood.

## Tech Stack & Frameworks

### Frontend & UI

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling for the retro pixel art aesthetic
- **Radix UI** - Accessible component primitives for tooltips and interactions
- **Lucide React** - Icon library for tool indicators

### Backend & Data

- **Convex** - Real-time database with two-way sync between client and server
- **Server Actions** - Direct API integration with Subconscious platform
- **Streaming Responses** - Real-time updates as the AI processes papers

### Development Tools

- **ESLint** - Code linting and quality
- **PostCSS** - CSS processing
- **pnpm** - Fast, efficient package management

### Deployment

- Optimized for **Vercel** deployment with automatic builds and previews

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

Originally built for the **Lux/Cognition/Modal Hackathon 2025**
