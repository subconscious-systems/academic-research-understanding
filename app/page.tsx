'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { TreeView } from '@/components/ui/tree/TreeView';
import { parse } from 'partial-json';

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
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Hero Section */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
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
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
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
                    placeholder="https://arxiv.org/abs/1706.03762"
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
                className="w-full transform rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:scale-100 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
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
          </div>
        ) : (
          /* Report Display - Full Screen */
          <div className="fixed inset-0 flex flex-col bg-white p-6">
            <div className="flex h-full max-w-none flex-col">
              {/* Full Screen Header */}
              <div className="mb-2 border-b border-gray-200 pb-6">
                <div className="flex items-center justify-between">
                  {/* Back Button - Small Arrow */}
                  <button
                    onClick={() => {
                      setShowReport(false);
                      setPaperInput('');
                      setAnalysisId(null);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
                    title="Back to Start"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                  </button>

                  {/* Center Section - Token Count (Emphasized), Paper, Status */}
                  <div className="flex flex-col items-center space-y-3">
                    {/* Token Count - Emphasized */}
                    <div className="flex items-center space-x-3 rounded-lg border border-blue-200 bg-blue-50 px-6 py-3">
                      <span className="text-lg font-semibold text-blue-700">Tokens Reviewed:</span>
                      <span className="font-mono text-2xl font-bold text-blue-900">
                        {paperAnalysis?.tokensRead
                          ? paperAnalysis.tokensRead.toLocaleString()
                          : '0'}
                      </span>
                    </div>

                    {/* Paper Link and Status Row */}
                    <div className="flex items-center space-x-8">
                      {/* Paper Link */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-500">Paper:</span>
                        <a
                          href={paperInput}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="max-w-md truncate text-blue-600 underline hover:text-blue-800"
                          title={paperInput}
                        >
                          {paperInput}
                        </a>
                      </div>

                      {/* Status */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        {paperAnalysis ? (
                          <div className="flex items-center space-x-2">
                            {paperAnalysis.status === 'pending' && (
                              <>
                                <div className="h-3 w-3 animate-pulse rounded-full bg-yellow-500"></div>
                                <span className="font-medium text-yellow-600">Pending</span>
                              </>
                            )}
                            {paperAnalysis.status === 'processing' && (
                              <>
                                <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-blue-600"></div>
                                <span className="font-medium text-blue-600">Processing</span>
                              </>
                            )}
                            {paperAnalysis.status === 'completed' && (
                              <>
                                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                <span className="font-medium text-green-600">Completed</span>
                              </>
                            )}
                            {paperAnalysis.status === 'failed' && (
                              <>
                                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                <span className="font-medium text-red-600">Failed</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">Loading...</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side Spacer */}
                  <div className="w-10"></div>
                </div>
              </div>

              {/* Streaming Output Section */}
              {paperAnalysis?.response ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="mb-2 flex flex-shrink-0 items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                      {paperAnalysis.status === 'completed'
                        ? 'Analysis Complete'
                        : 'Analysis in Progress'}
                    </h2>
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
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                          <h3 className="mb-4 text-xl font-semibold text-gray-900">Summary:</h3>
                          <div className="text-base leading-relaxed whitespace-pre-wrap text-gray-800">
                            {paperAnalysis.answer}
                          </div>
                        </div>
                        <details className="rounded-lg bg-white p-6 shadow-sm">
                          <summary className="cursor-pointer text-xl font-semibold text-gray-900 hover:text-blue-600">
                            Raw Response (Click to expand)
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
        <footer className="px-4 py-6">
          <div className="text-center">
            <a
              className="text-gray-500 transition-colors duration-200 hover:text-gray-700"
              href="https://subconscious.dev"
              target="_blank"
              rel="noopener noreferrer"
            >
              Powered by Subconscious
            </a>
          </div>
        </footer>
      )}
    </div>
  );
}
