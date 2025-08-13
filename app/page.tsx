'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

export default function Home() {
  const [paperInput, setPaperInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [analysisId, setAnalysisId] = useState<Id<'paperAnalyses'> | null>(null);

  // Convex hooks
  const createPaperAnalysis = useMutation(api.papers.createPaperAnalysis);
  const paperAnalysis = useQuery(
    api.papers.getPaperAnalysis,
    analysisId ? { id: analysisId } : 'skip',
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paperInput.trim()) return;

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
              that technical paper
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Upload or paste an arXiv paper link and get an AI-powered analysis that breaks down
            complex research into digestible insights.
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
                    onChange={(e) => setPaperInput(e.target.value)}
                    placeholder="https://arxiv.org/abs/1706.03762"
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg transition-all duration-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    disabled={isLoading}
                  />
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
          /* Report Display */
          <div className="w-full max-w-4xl">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
              <div className="mb-6">
                <button
                  onClick={() => {
                    setShowReport(false);
                    setPaperInput('');
                    setAnalysisId(null);
                  }}
                  className="mb-4 flex items-center space-x-2 font-medium text-blue-600 hover:text-blue-800"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  <span>Analyze another paper</span>
                </button>

                {/* Paper URL Display */}
                <div className="mb-4 rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">Paper URL:</h3>
                  <a
                    href={paperInput}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-blue-600 underline hover:text-blue-800"
                  >
                    {paperInput}
                  </a>
                </div>

                {/* Status Display */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-gray-700">Status:</span>
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

              {/* Content based on status */}
              {paperAnalysis?.response ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {paperAnalysis.status === 'completed'
                        ? 'Analysis Complete'
                        : 'Analysis in Progress'}
                    </h2>
                    {paperAnalysis.status === 'processing' &&
                      paperAnalysis.response?.isStreaming && (
                        <div className="flex items-center space-x-2 text-blue-600">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600"></div>
                          <span className="text-sm font-medium">Streaming...</span>
                        </div>
                      )}
                  </div>

                  <div className="rounded-lg bg-gray-50 p-6">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">
                      {paperAnalysis.status === 'completed'
                        ? 'Final Response:'
                        : 'Response (Live):'}
                    </h3>
                    <div className="max-h-96 overflow-auto rounded border bg-white p-4">
                      {paperAnalysis.response?.isStreaming ? (
                        // Show streaming content as plain text
                        <div className="text-sm whitespace-pre-wrap text-gray-700">
                          {paperAnalysis.response.content}
                          {paperAnalysis.status === 'processing' && (
                            <span className="ml-1 inline-block h-5 w-2 animate-pulse bg-blue-500"></span>
                          )}
                        </div>
                      ) : (
                        // Show final formatted JSON
                        <pre className="text-sm whitespace-pre-wrap text-gray-700">
                          {JSON.stringify(paperAnalysis.response, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="mb-4">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  </div>
                  <p className="text-gray-600">
                    {paperAnalysis?.status === 'pending' && 'Waiting to start processing...'}
                    {paperAnalysis?.status === 'processing' && 'AI is starting analysis...'}
                    {paperAnalysis?.status === 'failed' && 'Analysis failed. Please try again.'}
                    {!paperAnalysis && 'Loading analysis...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
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
    </div>
  );
}
