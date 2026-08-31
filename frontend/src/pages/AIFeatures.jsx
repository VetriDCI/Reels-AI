import React, { useState } from 'react';
import { Sparkles, Languages, Shield, MessageCircle, Image } from 'lucide-react';
import { aiAPI } from '../services/aiApi';

function AIFeatures() {
  const [activeFeature, setActiveFeature] = useState(null);
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const features = [
    {
      id: 'caption',
      name: 'AI Caption',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      description: 'Generate catchy captions'
    },
    {
      id: 'translate',
      name: 'AI Translate',
      icon: Languages,
      color: 'from-blue-500 to-cyan-500',
      description: 'Translate to any language'
    },
    {
      id: 'moderate',
      name: 'Content Safety',
      icon: Shield,
      color: 'from-green-500 to-emerald-500',
      description: 'Check content guidelines'
    },
    {
      id: 'chat',
      name: 'AI Assistant',
      icon: MessageCircle,
      color: 'from-orange-500 to-red-500',
      description: 'Chat with AI helper'
    },
    {
      id: 'image',
      name: 'Image Tips',
      icon: Image,
      color: 'from-indigo-500 to-purple-500',
      description: 'Photo enhancement tips'
    }
  ];

  const handleFeatureClick = async (feature) => {
    setActiveFeature(feature.id);
    setResult('');
    setInputText('');
  };

  const handleSubmit = async () => {
    if (!inputText) return;
    
    setLoading(true);
    try {
      let response;
      
      switch (activeFeature) {
        case 'caption':
          response = await aiAPI.generateCaption({ context: inputText });
          setResult(response.data.data.caption);
          break;
        case 'translate':
          response = await aiAPI.translate({ text: inputText, targetLanguage: 'ta' });
          setResult(response.data.data.translatedText);
          break;
        case 'moderate':
          response = await aiAPI.moderate({ content: inputText });
          setResult(response.data.data.isSafe ? '✅ Safe to post' : '⚠️ ' + response.data.data.reason);
          break;
        case 'chat':
          response = await aiAPI.chat({ message: inputText });
          setResult(response.data.data.response);
          break;
        case 'image':
          response = await aiAPI.chat({ message: `Give photo enhancement tips for: ${inputText}` });
          setResult(response.data.data.response);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('AI feature error:', error);
      setResult('Failed to process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 px-4 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Features</h2>
      
      {/* Feature Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => handleFeatureClick(feature)}
            className={`bg-gradient-to-br ${feature.color} rounded-xl p-6 text-white text-left transition-transform hover:scale-105`}
          >
            <feature.icon className="w-8 h-8 mb-3" />
            <h3 className="font-semibold text-lg">{feature.name}</h3>
            <p className="text-sm opacity-90 mt-1">{feature.description}</p>
          </button>
        ))}
      </div>

      {/* Active Feature Interface */}
      {activeFeature && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-4">
            {features.find(f => f.id === activeFeature)?.name}
          </h3>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter your text here..."
            className="w-full h-32 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          
          <button
            onClick={handleSubmit}
            disabled={loading || !inputText}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Generate'}
          </button>

          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Result:</h4>
              <p className="text-gray-700">{result}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AIFeatures;