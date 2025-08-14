'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { TreeView } from '@/components/ui/tree/TreeView';
import { parse } from 'partial-json';

// Animated Counter Component
function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      const increment = value > displayValue ? 1 : -1;
      const step = Math.abs(value - displayValue) / 20; // Animate over 20 steps

      let current = displayValue;
      const timer = setInterval(() => {
        current += increment * Math.ceil(step);
        if ((increment > 0 && current >= value) || (increment < 0 && current <= value)) {
          current = value;
          clearInterval(timer);
          setIsAnimating(false);
        }
        setDisplayValue(Math.round(current));
      }, 50); // Update every 50ms

      return () => clearInterval(timer);
    }
  }, [value, displayValue]);

  const formattedValue = displayValue.toLocaleString();

  return (
    <div
      className={`font-mono text-3xl font-bold text-blue-600 transition-all duration-200 ${
        isAnimating ? 'scale-105' : 'scale-100'
      }`}
    >
      {formattedValue.split('').map((char, index) => (
        <span
          key={`${index}-${char}`}
          className={`inline-block transition-all duration-300 ${
            isAnimating ? 'animate-pulse' : ''
          }`}
          style={{
            animationDelay: `${index * 50}ms`,
          }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}

export default function Home() {
  const [paperInput, setPaperInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [analysisId, setAnalysisId] = useState<Id<'paperAnalyses'> | null>(null);
  const [urlError, setUrlError] = useState('');

  // Convex hooks
  const createPaperAnalysis = useMutation(api.papers.createPaperAnalysis);
  const paperAnalysis = useQuery(
    api.papers.getPaperAnalysis,
    analysisId ? { id: analysisId } : 'skip',
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paperInput.trim()) return;

    // Clear any previous errors
    setUrlError('');

    // Validate URL contains arxiv.org
    if (!paperInput.trim().includes('arxiv.org')) {
      setUrlError('URL must contain "arxiv.org". Please enter a valid arXiv paper URL.');
      return;
    }

    setIsLoading(true);
    setShowReport(false);

    try {
      // Create paper analysis using Convex
      const newAnalysisId = await createPaperAnalysis({
        paperUrl: paperInput.trim(),
      });

      setAnalysisId(newAnalysisId);
      setShowReport(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error creating paper analysis:', error);
      setShowReport(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        {/* Grid Pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
            backgroundSize: '40px 40px',
          }}
        ></div>

        {/* Floating Geometric Shapes */}
        <div className="absolute top-20 left-10 h-32 w-32 animate-pulse rounded-full border-2 border-blue-200"></div>
        <div
          className="absolute top-40 right-20 h-24 w-24 rotate-45 animate-bounce border-2 border-gray-300"
          style={{ animationDuration: '3s' }}
        ></div>
        <div
          className="absolute bottom-32 left-1/4 h-20 w-20 animate-pulse rounded-lg border-2 border-blue-300"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute top-1/3 right-1/3 h-16 w-16 animate-ping rounded-full border-2 border-gray-200"
          style={{ animationDuration: '4s' }}
        ></div>
        <div
          className="absolute right-10 bottom-20 h-28 w-28 rotate-12 animate-bounce border-2 border-blue-100"
          style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}
        ></div>

        {/* Scattered Dots */}
        <div className="absolute top-16 left-1/3 h-3 w-3 animate-pulse rounded-full bg-blue-200"></div>
        <div
          className="absolute top-1/2 left-20 h-2 w-2 animate-ping rounded-full bg-gray-300"
          style={{ animationDuration: '3s' }}
        ></div>
        <div
          className="absolute right-1/4 bottom-40 h-4 w-4 animate-pulse rounded-full bg-blue-100"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute top-1/4 right-12 h-2 w-2 animate-ping rounded-full bg-gray-200"
          style={{ animationDuration: '2s' }}
        ></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-6 text-5xl leading-tight font-bold text-gray-900 md:text-6xl">
            We&apos;ll help you understand
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              deeply technical papers
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Paste an arXiv paper link and get an in-depth analysis that breaks down complex research
            and compares it to thousands of pages of other work.
          </p>
        </div>

        {/* Main Content Area */}
        {!showReport ? (
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Paper Input Box */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8">
                <label
                  htmlFor="paper-input"
                  className="mb-4 block text-lg font-semibold text-gray-900"
                >
                  Enter arXiv paper URL
                </label>
                <div className="space-y-4">
                  <input
                    id="paper-input"
                    type="text"
                    value={paperInput}
                    onChange={(e) => {
                      setPaperInput(e.target.value);
                      // Clear error when user starts typing
                      if (urlError) setUrlError('');
                    }}
                    placeholder="ex. https://arxiv.org/abs/1706.03762"
                    className={`w-full rounded-xl border-2 px-4 py-4 text-lg transition-all duration-200 outline-none ${
                      urlError
                        ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                    }`}
                    disabled={isLoading}
                  />
                  {urlError && <p className="mt-2 text-sm text-red-600">{urlError}</p>}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!paperInput.trim() || isLoading}
                className="w-full transform cursor-pointer rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-blue-700 disabled:scale-100 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-white"></div>
                    <span>Analyzing paper...</span>
                  </div>
                ) : (
                  'Analyze Paper'
                )}
              </button>
            </form>

            {/* Demo Button */}
            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setPaperInput('https://arxiv.org/abs/2507.16784');
                  // Clear any previous errors
                  setUrlError('');
                }}
                className="cursor-pointer rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-600 transition-colors duration-200 hover:border-blue-400 hover:text-blue-600"
              >
                Don&apos;t have a research paper ready? We&apos;ve got you covered.
              </button>
            </div>
          </div>
        ) : (
          /* Report Display - Full Screen */
          <div className="fixed inset-0 flex flex-col bg-white p-6">
            <div className="flex h-full max-w-none flex-col">
              {/* Full Screen Header */}
              <div className="mb-2 border-b border-gray-100 pb-4">
                <div className="mx-auto max-w-6xl">
                  {/* Top Row - Back Button and Title */}
                  <div className="mb-6 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setShowReport(false);
                        setPaperInput('');
                        setAnalysisId(null);
                      }}
                      className="flex items-center space-x-2 rounded-lg border border-gray-200 px-4 py-2 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800"
                      title="Back to Start"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                      <span className="text-sm font-medium">Back</span>
                    </button>

                    <h1 className="text-2xl font-bold text-gray-900">Research Analysis</h1>

                    <div className="w-20"></div>
                  </div>

                  {/* Main Info Grid */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Token Count Card */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                      <div className="text-center">
                        <div className="text-sm font-medium tracking-wide text-gray-500 uppercase">
                          Tokens Reviewed
                        </div>
                        <div className="mt-2">
                          <AnimatedCounter value={paperAnalysis?.tokensRead || 0} />
                        </div>
                      </div>
                    </div>

                    {/* Paper Info Card */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                      <div className="text-center">
                        <div className="mb-2 text-sm font-medium tracking-wide text-gray-500 uppercase">
                          Paper Source
                        </div>
                        <a
                          href={paperInput}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-blue-600 transition-colors hover:text-blue-800"
                          title={paperInput}
                        >
                          <span className="text-sm font-medium">arXiv Paper</span>
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>

                    {/* Status Card */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                      <div className="text-center">
                        <div className="mb-2 text-sm font-medium tracking-wide text-gray-500 uppercase">
                          Status
                        </div>
                        {paperAnalysis ? (
                          <div className="flex items-center justify-center space-x-2">
                            {paperAnalysis.status === 'pending' && (
                              <>
                                <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500"></div>
                                <span className="text-sm font-medium tracking-wide text-yellow-600 uppercase">
                                  Pending
                                </span>
                              </>
                            )}
                            {paperAnalysis.status === 'processing' && (
                              <>
                                <div className="h-2 w-2 animate-spin rounded-full border border-blue-600 border-t-transparent"></div>
                                <span className="text-sm font-medium tracking-wide text-blue-600 uppercase">
                                  Processing
                                </span>
                              </>
                            )}
                            {paperAnalysis.status === 'completed' && (
                              <>
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span className="text-sm font-medium tracking-wide text-green-600 uppercase">
                                  Completed
                                </span>
                              </>
                            )}
                            {paperAnalysis.status === 'failed' && (
                              <>
                                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                <span className="text-sm font-medium tracking-wide text-red-600 uppercase">
                                  Failed
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm font-medium tracking-wide text-gray-400 uppercase">
                            Loading
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Streaming Output Section */}
              {paperAnalysis?.response ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="mb-2 flex flex-shrink-0 items-center justify-between">
                    {paperAnalysis.status === 'processing' &&
                      paperAnalysis.response?.isStreaming && (
                        <div className="flex items-center space-x-2 text-blue-600">
                          <div className="h-3 w-3 animate-pulse rounded-full bg-blue-600"></div>
                          <span className="text-lg font-medium">Streaming...</span>
                        </div>
                      )}
                  </div>

                  {/* Scrollable Stream Output */}
                  <div className="flex-1 overflow-auto rounded-lg border-2 border-gray-200 bg-gray-50 p-6">
                    {paperAnalysis.response.isStreaming ? (
                      // Show streaming content as plain text
                      <div className="font-mono text-base leading-relaxed whitespace-pre-wrap text-gray-800">
                        <TreeView output={parse(paperAnalysis.response.content)} />
                      </div>
                    ) : (
                      // Show final formatted response
                      <div className="space-y-6">
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                          <h3 className="mb-4 text-xl font-semibold text-gray-900">Summary:</h3>
                          <div className="text-base leading-relaxed whitespace-pre-wrap text-gray-800">
                            {paperAnalysis.answer}
                          </div>
                        </div>
                        <details className="rounded-lg border border-gray-200 bg-white p-6">
                          <summary className="cursor-pointer text-xl font-semibold text-gray-900 hover:text-blue-600">
                            Raw Response with tool results pruned (Click to expand)
                          </summary>
                          <pre className="mt-4 overflow-auto text-sm whitespace-pre-wrap text-gray-700">
                            {JSON.stringify(paperAnalysis.response)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    </div>
                    <p className="text-lg text-gray-600">
                      {paperAnalysis?.status === 'pending' && 'Waiting to start processing...'}
                      {paperAnalysis?.status === 'processing' && 'AI is starting analysis...'}
                      {paperAnalysis?.status === 'failed' && 'Analysis failed. Please try again.'}
                      {!paperAnalysis && 'Loading analysis...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Only show when not in report mode */}
      {!showReport && (
        <footer className="relative z-10 px-4 py-6">
          <div className="text-center">
            <a
              className="text-gray-500 transition-colors duration-200 hover:text-gray-700"
              href="https://subconscious.dev"
              target="_blank"
              rel="noopener noreferrer"
            >
              Lux/Cognition/Modal Hackathon 2025 - Powered by Subconscious
            </a>
          </div>
        </footer>
      )}
    </div>
  );
}
