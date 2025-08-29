"use client";

import { useState } from "react";
import { CONVERSATIONAL_AI, ConversationFlow } from "@/lib/ai/atelier-conversational";
import { generateAtelierResponse } from "@/lib/ai/atelier-fashion-expert";
import { generateAdvancedResponse } from "@/lib/ai/atelier-advanced-training";

export default function TestConversational() {
  const [query, setQuery] = useState("How should I wear a navy suit?");
  const [flow] = useState(new ConversationFlow());

  const examples = [
    "How should I wear a navy suit?",
    "What's good for a wedding?",
    "Help me find my style",
    "First suit advice?",
    "Color matching tips",
    "Business casual help",
    "Budget recommendations",
    "What's trending?"
  ];

  const getResponses = (q: string) => {
    // Track message for flow
    flow.trackMessage();
    const style = flow.getResponseStyle();

    // Get original responses
    const expert = generateAtelierResponse(q);
    const advanced = generateAdvancedResponse(q);
    
    // Get conversational versions
    const brief = CONVERSATIONAL_AI.adjustResponseLength(expert.response, 'brief');
    const natural = CONVERSATIONAL_AI.adjustResponseLength(expert.response, 'natural');
    const detailed = CONVERSATIONAL_AI.adjustResponseLength(expert.response, 'detailed');
    
    // Get template response if available
    const template = CONVERSATIONAL_AI.buildConversationalResponse(q, style);

    return {
      original: expert.response,
      wordCount: expert.response.split(' ').length,
      brief,
      briefCount: brief.split(' ').length,
      natural,
      naturalCount: natural.split(' ').length,
      detailed,
      detailedCount: detailed.split(' ').length,
      template,
      templateCount: template.split(' ').length,
      confidence: Math.max(expert.confidence, advanced.confidence)
    };
  };

  const responses = getResponses(query);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Atelier AI Conversational Style Comparison</h1>
        
        {/* Query Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Select or type a question:</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 p-2 border rounded"
              placeholder="Type your fashion question..."
            />
            <button
              onClick={() => flow.reset()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reset Flow
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setQuery(ex)}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Response Comparison */}
        <div className="space-y-6">
          {/* Original Response */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-semibold text-red-600">❌ Original (Too Long)</h2>
              <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded">
                {responses.wordCount} words
              </span>
            </div>
            <p className="text-gray-700 leading-relaxed">{responses.original}</p>
            <div className="mt-3 text-sm text-gray-500">
              Issue: Too formal, professor-like, not conversational
            </div>
          </div>

          {/* Template Response */}
          <div className="bg-white p-6 rounded-lg shadow border-2 border-green-500">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-semibold text-green-600">✅ Template (Best)</h2>
              <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                {responses.templateCount} words
              </span>
            </div>
            <p className="text-gray-700 leading-relaxed">{responses.template}</p>
            <div className="mt-3 text-sm text-gray-500">
              Natural, friendly, actionable advice with personality
            </div>
          </div>

          {/* Brief Version */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-semibold">Brief (15-25 words)</h2>
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {responses.briefCount} words
              </span>
            </div>
            <p className="text-gray-700 leading-relaxed">{responses.brief}</p>
            <div className="mt-3 text-sm text-gray-500">
              Quick, punchy response for initial interaction
            </div>
          </div>

          {/* Natural Version */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-semibold">Natural (25-45 words)</h2>
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {responses.naturalCount} words
              </span>
            </div>
            <p className="text-gray-700 leading-relaxed">{responses.natural}</p>
            <div className="mt-3 text-sm text-gray-500">
              Conversational depth without overwhelming
            </div>
          </div>

          {/* Detailed Version */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-semibold">Detailed (45-80 words)</h2>
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {responses.detailedCount} words
              </span>
            </div>
            <p className="text-gray-700 leading-relaxed">{responses.detailed}</p>
            <div className="mt-3 text-sm text-gray-500">
              For deep-dive conversations after rapport is built
            </div>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="mt-8 bg-burgundy text-white p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Confidence: {responses.confidence}%</h3>
          <p>The AI can answer this question with high expertise and multiple response styles.</p>
        </div>

        {/* Conversational Guidelines */}
        <div className="mt-8 bg-gray-100 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Conversational Guidelines Applied:</h3>
          <ul className="space-y-2 text-sm">
            <li>✅ <strong>First response:</strong> 15-25 words, friendly and welcoming</li>
            <li>✅ <strong>Follow-up:</strong> 25-45 words, more detail but still natural</li>
            <li>✅ <strong>Deep dive:</strong> 45-80 words for complex explanations</li>
            <li>✅ <strong>Use contractions:</strong> "It's" not "It is"</li>
            <li>✅ <strong>Personal touch:</strong> "Here's what I think..." or "My advice?"</li>
            <li>✅ <strong>Analogies:</strong> "Think of it like..." makes concepts relatable</li>
            <li>✅ <strong>Questions:</strong> End with engagement like "Make sense?"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}