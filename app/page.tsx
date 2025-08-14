'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { TreeView } from '@/components/ui/tree/TreeView';
import { parse } from 'partial-json';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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
      className={`font-mono text-2xl font-black transition-all duration-200 ${
        isAnimating ? 'scale-105' : 'scale-100'
      }`}
      style={{
        color: 'inherit',
        textShadow: 'inherit',
      }}
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-cyan-400 to-blue-500">
      {/* Retro Background Pattern */}
      <div className="absolute inset-0">
        {/* Pixel Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
            backgroundSize: '8px 8px',
          }}
        ></div>

        {/* Floating Stars */}
        <div
          className="absolute top-16 left-16 h-2 w-2 animate-pulse bg-yellow-300"
          style={{
            clipPath:
              'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
          }}
        ></div>
        <div
          className="absolute top-32 right-24 h-3 w-3 animate-pulse bg-yellow-200"
          style={{
            clipPath:
              'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
            animationDelay: '1s',
          }}
        ></div>
        <div
          className="absolute bottom-24 left-32 h-2 w-2 animate-pulse bg-yellow-400"
          style={{
            clipPath:
              'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
            animationDelay: '2s',
          }}
        ></div>
        <div
          className="absolute top-1/2 right-32 h-2 w-2 animate-pulse bg-yellow-300"
          style={{
            clipPath:
              'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
            animationDelay: '0.5s',
          }}
        ></div>
        <div
          className="absolute right-16 bottom-16 h-3 w-3 animate-pulse bg-yellow-200"
          style={{
            clipPath:
              'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
            animationDelay: '1.5s',
          }}
        ></div>

        {/* Pixel Clouds */}
        <div className="absolute top-20 left-1/4 opacity-30">
          <div className="relative">
            <div className="h-4 w-8 bg-white"></div>
            <div className="-mt-2 ml-2 h-4 w-12 bg-white"></div>
            <div className="-mt-2 ml-6 h-4 w-6 bg-white"></div>
          </div>
        </div>
        <div className="absolute top-40 right-1/3 opacity-30">
          <div className="relative">
            <div className="h-3 w-6 bg-white"></div>
            <div className="-mt-1 ml-1 h-3 w-8 bg-white"></div>
            <div className="-mt-1 ml-4 h-3 w-4 bg-white"></div>
          </div>
        </div>
      </div>

      {/* Top Right Button - Only show when not in report mode */}
      {!showReport && (
        <div className="absolute top-6 right-6 z-20">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="border-3 border-purple-400 bg-purple-300 px-4 py-2 text-sm font-black text-purple-800 uppercase transition-all duration-200 hover:bg-purple-200"
                style={{
                  fontFamily: 'monospace',
                  textShadow: '1px 1px 0 #9333ea',
                  boxShadow: '0 3px 0 #9333ea, 0 3px 6px rgba(0,0,0,0.2)',
                  imageRendering: 'pixelated',
                }}
                disabled
              >
                GIGARESEARCH SWARM COMING SOON
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="max-w-xs border-3 border-yellow-400 bg-yellow-300 p-3 font-black text-red-600"
              style={{
                fontFamily: 'monospace',
                textShadow: '1px 1px 0 #dc2626',
                boxShadow: '0 3px 0 #f59e0b, 0 3px 6px rgba(0,0,0,0.2)',
                imageRendering: 'pixelated',
              }}
            >
              <div className="text-xs leading-tight uppercase">
                SPAWN 100S OF AGENTS EXPLORING BILLIONS OF TOKENS TO DISCOVER THE MOST NOVEL
                RESEARCH OF THE DAY
                <br />
                <br />
                WE'RE WORKING ON IT BUT HIT ALL KINDS OF LIMITS...
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-12 text-center">
          {/* Retro Title with Pixel Border */}
          <div
            className="mx-auto mb-8 max-w-4xl border-4 border-yellow-400 bg-yellow-300 p-6"
            style={{
              boxShadow: `
              inset 0 0 0 2px #fbbf24,
              0 0 0 6px #f59e0b,
              0 8px 0 #d97706,
              0 8px 8px rgba(0,0,0,0.3)
            `,
              imageRendering: 'pixelated',
            }}
          >
            <h1
              className="text-4xl leading-none font-black tracking-wider text-red-600 md:text-6xl"
              style={{
                fontFamily: 'monospace',
                textShadow: '3px 3px 0 #dc2626, 6px 6px 0 #991b1b',
                imageRendering: 'pixelated',
              }}
            >
              ARXIV
              <br />
              <span className="text-red-700">GIGARESEARCH</span>
            </h1>
          </div>

          {/* Retro Subtitle */}
          <div
            className="mx-auto mb-6 max-w-2xl border-2 border-cyan-300 bg-cyan-200 p-4"
            style={{
              boxShadow: '0 4px 0 #0891b2, 0 4px 8px rgba(0,0,0,0.2)',
            }}
          >
            <p className="text-lg font-bold text-blue-900" style={{ fontFamily: 'monospace' }}>
              POWERED BY{' '}
              <a
                href="https://subconscious.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-900"
              >
                SUBCONSCIOUS.DEV
              </a>
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        {!showReport ? (
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Retro Paper Input Box */}
              <div
                className="border-4 border-yellow-400 bg-yellow-300 p-6"
                style={{
                  boxShadow: '0 6px 0 #f59e0b, 0 6px 12px rgba(0,0,0,0.3)',
                }}
              >
                <label
                  htmlFor="paper-input"
                  className="mb-4 block text-xl font-black text-red-600"
                  style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #dc2626' }}
                >
                  ENTER ARXIV PAPER URL
                </label>
                <div className="space-y-4">
                  <div
                    className="border-2 border-gray-800 bg-white p-1"
                    style={{
                      boxShadow: 'inset 2px 2px 0 #374151, inset -2px -2px 0 #f9fafb',
                    }}
                  >
                    <input
                      id="paper-input"
                      type="text"
                      value={paperInput}
                      onChange={(e) => {
                        setPaperInput(e.target.value);
                        // Clear error when user starts typing
                        if (urlError) setUrlError('');
                      }}
                      placeholder="ex. https://arxiv.org/html/1706.03762"
                      className={`w-full border-0 bg-transparent px-3 py-3 font-mono text-base outline-none ${
                        urlError ? 'text-red-600' : 'text-gray-900'
                      }`}
                      style={{ fontFamily: 'monospace' }}
                      disabled={isLoading}
                    />
                  </div>
                  {urlError && (
                    <div className="border-2 border-red-500 bg-red-400 p-2">
                      <p
                        className="text-sm font-bold text-white"
                        style={{ fontFamily: 'monospace' }}
                      >
                        ERROR: {urlError}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Retro Submit Button */}
              <button
                type="submit"
                disabled={!paperInput.trim() || isLoading}
                className="w-full border-4 border-green-400 bg-green-500 px-8 py-4 text-xl font-black text-white transition-all duration-200 hover:bg-green-400 disabled:cursor-not-allowed disabled:border-gray-500 disabled:bg-gray-400"
                style={{
                  fontFamily: 'monospace',
                  textShadow: '2px 2px 0 #15803d',
                  boxShadow: '0 6px 0 #16a34a, 0 6px 12px rgba(0,0,0,0.3)',
                  imageRendering: 'pixelated',
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="h-6 w-6 animate-spin border-4 border-white border-t-transparent"></div>
                    <span>ANALYZING PAPER...</span>
                  </div>
                ) : (
                  'ANALYZE PAPER'
                )}
              </button>
            </form>

            {/* Retro Demo Button */}
            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setPaperInput('https://arxiv.org/html/2507.16784');
                  // Clear any previous errors
                  setUrlError('');
                }}
                className="border-3 border-cyan-400 bg-cyan-300 px-6 py-3 text-sm font-bold text-blue-900 transition-all duration-200 hover:bg-cyan-200"
                style={{
                  fontFamily: 'monospace',
                  textShadow: '1px 1px 0 #0891b2',
                  boxShadow: '0 4px 0 #0891b2, 0 4px 8px rgba(0,0,0,0.2)',
                  imageRendering: 'pixelated',
                }}
              >
                NO PAPER? TRY OUR DEMO!
              </button>
            </div>
          </div>
        ) : (
          /* Retro Report Display - Full Screen */
          <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-cyan-400 to-blue-500 p-6">
            <div className="flex h-full max-w-none flex-col">
              {/* Retro Full Screen Header */}
              <div
                className="mb-4 border-4 border-yellow-400 bg-yellow-300 p-4"
                style={{
                  boxShadow: '0 6px 0 #f59e0b, 0 6px 12px rgba(0,0,0,0.3)',
                }}
              >
                <div className="mx-auto max-w-6xl">
                  {/* Top Row - Back Button and Title */}
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setShowReport(false);
                        setPaperInput('');
                        setAnalysisId(null);
                      }}
                      className="border-3 border-red-500 bg-red-400 px-4 py-2 font-bold text-white transition-all hover:bg-red-300"
                      style={{
                        fontFamily: 'monospace',
                        textShadow: '1px 1px 0 #dc2626',
                        boxShadow: '0 3px 0 #dc2626',
                      }}
                      title="Back to Start"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">←</span>
                        <span className="text-sm">BACK</span>
                      </div>
                    </button>

                    <h1
                      className="text-2xl font-black text-red-600"
                      style={{
                        fontFamily: 'monospace',
                        textShadow: '2px 2px 0 #dc2626',
                      }}
                    >
                      GIGARESEARCH ANALYSIS
                    </h1>

                    <div className="w-20"></div>
                  </div>

                  {/* Main Info Grid */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Token Count Card */}
                    <div
                      className="border-3 border-green-400 bg-green-300 p-4"
                      style={{
                        boxShadow: '0 4px 0 #16a34a, 0 4px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      <div className="text-center">
                        <div
                          className="text-sm font-black text-green-800 uppercase"
                          style={{ fontFamily: 'monospace' }}
                        >
                          TOKENS REVIEWED
                        </div>
                        <div className="mt-2">
                          <div
                            className="font-mono text-2xl font-black text-green-900"
                            style={{
                              textShadow: '1px 1px 0 #15803d',
                            }}
                          >
                            <AnimatedCounter value={paperAnalysis?.tokensRead || 0} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Paper Info Card */}
                    <div
                      className="border-3 border-blue-400 bg-blue-300 p-4"
                      style={{
                        boxShadow: '0 4px 0 #2563eb, 0 4px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      <div className="text-center">
                        <div
                          className="mb-2 text-sm font-black text-blue-800 uppercase"
                          style={{ fontFamily: 'monospace' }}
                        >
                          PAPER SOURCE
                        </div>
                        <a
                          href={paperInput}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block border-2 border-white bg-white px-3 py-1 font-bold text-blue-900 transition-colors hover:bg-blue-50"
                          style={{
                            fontFamily: 'monospace',
                            boxShadow: '0 2px 0 #1e40af',
                          }}
                          title={paperInput}
                        >
                          ARXIV PAPER →
                        </a>
                      </div>
                    </div>

                    {/* Status Card */}
                    <div
                      className="border-3 border-purple-400 bg-purple-300 p-4"
                      style={{
                        boxShadow: '0 4px 0 #9333ea, 0 4px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      <div className="text-center">
                        <div
                          className="mb-2 text-sm font-black text-purple-800 uppercase"
                          style={{ fontFamily: 'monospace' }}
                        >
                          STATUS
                        </div>
                        {paperAnalysis ? (
                          <div className="flex items-center justify-center space-x-2">
                            {paperAnalysis.status === 'pending' && (
                              <>
                                <div className="h-3 w-3 animate-pulse border border-yellow-700 bg-yellow-500"></div>
                                <span
                                  className="text-sm font-black text-yellow-800 uppercase"
                                  style={{ fontFamily: 'monospace' }}
                                >
                                  PENDING
                                </span>
                              </>
                            )}
                            {paperAnalysis.status === 'processing' && (
                              <>
                                <div className="h-3 w-3 animate-spin border border-blue-700 bg-blue-500"></div>
                                <span
                                  className="text-sm font-black text-blue-800 uppercase"
                                  style={{ fontFamily: 'monospace' }}
                                >
                                  PROCESSING
                                </span>
                              </>
                            )}
                            {paperAnalysis.status === 'completed' && (
                              <>
                                <div className="h-3 w-3 border border-green-700 bg-green-500"></div>
                                <span
                                  className="text-sm font-black text-green-800 uppercase"
                                  style={{ fontFamily: 'monospace' }}
                                >
                                  COMPLETED
                                </span>
                              </>
                            )}
                            {paperAnalysis.status === 'failed' && (
                              <>
                                <div className="h-3 w-3 border border-red-700 bg-red-500"></div>
                                <span
                                  className="text-sm font-black text-red-800 uppercase"
                                  style={{ fontFamily: 'monospace' }}
                                >
                                  FAILED
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span
                            className="text-sm font-black text-purple-800 uppercase"
                            style={{ fontFamily: 'monospace' }}
                          >
                            LOADING
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
                        <div className="flex items-center space-x-2">
                          <div className="h-3 w-3 animate-pulse border border-blue-700 bg-blue-500"></div>
                          <span
                            className="text-lg font-black text-blue-600 uppercase"
                            style={{ fontFamily: 'monospace' }}
                          >
                            STREAMING...
                          </span>
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

      {/* Retro Footer - Only show when not in report mode */}
      {!showReport && (
        <footer className="relative z-10 px-4 py-6">
          <div className="text-center">
            <div
              className="mx-auto max-w-lg border-2 border-white bg-white p-3"
              style={{
                boxShadow: '0 4px 0 #e5e7eb, 0 4px 8px rgba(0,0,0,0.2)',
              }}
            >
              <a
                className="font-bold text-blue-800 transition-colors duration-200 hover:text-blue-600"
                style={{ fontFamily: 'monospace' }}
                href="https://subconscious.dev"
                target="_blank"
                rel="noopener noreferrer"
              >
                LUX/COGNITION/MODAL HACKATHON 2025
                <br />
                POWERED BY SUBCONSCIOUS
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
