"use client";

import { useState } from "react";
import { analyzeShortQuery, generateShortQueryResponse, buildFollowUpResponse } from "@/lib/ai/atelier-short-query-handler";
import { motion } from "framer-motion";

export default function TestShortQueries() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);

  // Example short queries
  const exampleQueries = [
    // 2-3 words
    { query: "navy suit", description: "Product specific" },
    { query: "wedding guest", description: "Occasion" },
    { query: "first suit", description: "Beginner" },
    { query: "interview tomorrow", description: "Urgent" },
    { query: "prom suit", description: "Occasion specific" },
    { query: "too expensive", description: "Budget concern" },
    { query: "tie help", description: "Accessory" },
    { query: "what's trending", description: "Trends" },
    
    // 4-5 words
    { query: "blue suit brown shoes", description: "Combination check" },
    { query: "need suit by friday", description: "Urgent purchase" },
    { query: "black tie event help", description: "Formal occasion" },
    { query: "suit doesn't fit right", description: "Fit issue" },
    
    // 6-7 words
    { query: "what color tie with navy suit", description: "Specific styling" },
    { query: "how much should I spend suit", description: "Budget guidance" },
    { query: "best suit color for brown skin", description: "Personal recommendation" },
    
    // Vague queries
    { query: "help me", description: "Very vague" },
    { query: "nice stuff", description: "Unclear intent" },
    { query: "something formal", description: "Needs clarification" }
  ];

  const analyzeQuery = (inputQuery: string) => {
    const intent = analyzeShortQuery(inputQuery);
    const response = generateShortQueryResponse(intent);
    const followUp = buildFollowUpResponse(inputQuery, intent);
    
    setResults({
      query: inputQuery,
      wordCount: inputQuery.trim().split(/\s+/).length,
      intent,
      response,
      followUp
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-burgundy text-white p-6">
        <h1 className="text-3xl font-bold mb-2">Short Query Intelligence Test</h1>
        <p className="text-lg">AI that understands customers who use 2-7 words</p>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test a Short Query</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try: 'navy suit' or 'wedding tomorrow help'"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy"
            />
            <button
              onClick={() => analyzeQuery(query)}
              disabled={!query.trim()}
              className="px-6 py-2 bg-burgundy text-white rounded-lg hover:bg-burgundy-dark disabled:opacity-50"
            >
              Analyze
            </button>
          </div>
          
          {/* Example Queries */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-2">Click to test:</p>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((ex) => (
                <button
                  key={ex.query}
                  onClick={() => {
                    setQuery(ex.query);
                    analyzeQuery(ex.query);
                  }}
                  className="group relative px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                >
                  {ex.query}
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {ex.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Intent Analysis */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Intent Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Query</p>
                  <p className="font-medium">{results.query}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Word Count</p>
                  <p className="font-medium">{results.wordCount} words</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Detected Intent</p>
                  <p className="font-medium text-burgundy">{results.intent.intent}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-burgundy h-2 rounded-full"
                        style={{ width: `${results.intent.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{results.intent.confidence}%</span>
                  </div>
                </div>
              </div>
              
              {/* Expanded Query */}
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-1">AI Understanding:</p>
                <p className="text-sm italic">"{results.intent.expandedQuery}"</p>
              </div>
              
              {/* Context */}
              {results.intent.context && Object.keys(results.intent.context).length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Detected Context:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(results.intent.context).map(([key, value]) => (
                      <span key={key} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Response Generation */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">AI Response</h3>
              
              {/* Initial Response */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Initial Response:</p>
                <div className="p-4 bg-burgundy text-white rounded-lg">
                  <p>{results.response.response}</p>
                </div>
              </div>
              
              {/* Follow-up Response */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Contextual Follow-up:</p>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p>{results.followUp}</p>
                </div>
              </div>
              
              {/* Quick Actions */}
              {results.response.quickActions && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Suggested Quick Actions:</p>
                  <div className="flex flex-wrap gap-2">
                    {results.response.quickActions.map((action: string) => (
                      <button key={action} className="px-3 py-1 bg-white border border-burgundy text-burgundy rounded-lg hover:bg-burgundy hover:text-white transition-colors text-sm">
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Follow-up Questions */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Clarifying Questions:</p>
                <div className="space-y-1">
                  {results.intent.suggestedFollowUps.map((q: string) => (
                    <div key={q} className="flex items-start gap-2">
                      <span className="text-burgundy">•</span>
                      <span className="text-sm">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Clarification Needed */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-gray-600">Clarification Needed:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  results.response.clarificationNeeded 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {results.response.clarificationNeeded ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* Intelligence Breakdown */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">How It Works</h3>
              <div className="space-y-2 text-sm">
                <p>✅ <strong>Pattern Matching:</strong> Recognizes common 2-7 word patterns</p>
                <p>✅ <strong>Intent Detection:</strong> Identifies urgent, budget, occasion, product queries</p>
                <p>✅ <strong>Context Extraction:</strong> Pulls out category, urgency, price range, style</p>
                <p>✅ <strong>Query Expansion:</strong> Converts short input into full understanding</p>
                <p>✅ <strong>Smart Follow-ups:</strong> Asks the right clarifying questions</p>
                <p>✅ <strong>Quick Actions:</strong> Provides immediate actionable options</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}