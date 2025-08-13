'use client';

import { useState } from 'react';

export default function Home() {
  const [paperInput, setPaperInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paperInput.trim()) return;

    setIsLoading(true);
    setShowReport(false);

    // Simulate 5-second loading
    setTimeout(() => {
      setIsLoading(false);
      setShowReport(true);
    }, 5000);
  };

  const mockReport = {
    title: 'Understanding Transformer Architecture in Natural Language Processing',
    summary:
      'This paper introduces a novel approach to attention mechanisms in neural networks, demonstrating significant improvements in language understanding tasks.',
    keyFindings: [
      'Multi-head attention provides 23% improvement over traditional RNN approaches',
      'Self-attention mechanism reduces computational complexity by 40%',
      'Model achieves state-of-the-art results on GLUE benchmark',
    ],
    methodology:
      'The authors propose a transformer-based architecture that relies entirely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
    implications:
      'This work has significant implications for the field of NLP, providing a more efficient and effective approach to language modeling.',
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
                <h2 className="mb-4 text-3xl font-bold text-gray-900">{mockReport.title}</h2>
              </div>

              <div className="space-y-8">
                {/* Summary */}
                <div>
                  <h3 className="mb-3 text-xl font-semibold text-gray-900">Summary</h3>
                  <p className="leading-relaxed text-gray-700">{mockReport.summary}</p>
                </div>

                {/* Key Findings */}
                <div>
                  <h3 className="mb-3 text-xl font-semibold text-gray-900">Key Findings</h3>
                  <ul className="space-y-2">
                    {mockReport.keyFindings.map((finding, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                        <p className="text-gray-700">{finding}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Methodology */}
                <div>
                  <h3 className="mb-3 text-xl font-semibold text-gray-900">Methodology</h3>
                  <p className="leading-relaxed text-gray-700">{mockReport.methodology}</p>
                </div>

                {/* Implications */}
                <div>
                  <h3 className="mb-3 text-xl font-semibold text-gray-900">Implications</h3>
                  <p className="leading-relaxed text-gray-700">{mockReport.implications}</p>
                </div>
              </div>
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
