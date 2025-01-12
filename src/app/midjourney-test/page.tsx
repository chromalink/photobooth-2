'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function MidjourneyTest() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialImage, setInitialImage] = useState('');
  const [upscaledImage, setUpscaledImage] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setInitialImage('');
    setUpscaledImage('');
    setMessage('');
    
    try {
      const response = await fetch('/api/midjourney-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      console.log('Midjourney Response:', data);
      
      if (data.initialResult) {
        setInitialImage(data.initialResult.imageUrl);
        setMessage(data.initialResult.message);
        
        if (data.upscaledResult) {
          setUpscaledImage(data.upscaledResult.imageUrl);
          setMessage(data.upscaledResult.message || data.initialResult.message);
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-black to-[#0e0e0e] text-white">
      <div className="container mx-auto p-4 h-full flex flex-col items-start">
        <div className="w-full max-w-2xl mx-auto">
          <h1 className="text-2xl mb-4">Midjourney Discord Test</h1>
          
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here (include image URL if needed)..."
                className="w-full p-2 border rounded text-black"
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >
              {isLoading ? 'Generating...' : 'Send to Midjourney'}
            </button>
          </form>

          {isLoading && (
            <div className="text-center py-2 mb-4">
              <div className="animate-pulse text-xl">Generating your image...</div>
              <div className="text-sm text-gray-500 mt-1">This may take up to 1-2 minutes</div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}

          {message && !isLoading && (
            <div className="bg-gray-100 p-3 rounded mb-4">
              <p className="text-sm text-gray-700">{message}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            {initialImage && !isLoading && (
              <div className="w-40">
                <h2 className="text-sm font-semibold mb-1">Initial Image</h2>
                <div className="relative w-40 h-40 border rounded overflow-hidden">
                  <Image
                    src={initialImage}
                    alt="Initial generation by Midjourney"
                    fill
                    className="object-contain"
                    sizes="160px"
                  />
                </div>
              </div>
            )}

            {upscaledImage && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Upscaled Image:</h3>
                <div className="relative w-[500px] h-[500px] border rounded overflow-hidden">
                  <Image
                    src={upscaledImage}
                    alt="Upscaled by Midjourney"
                    fill
                    className="object-contain"
                    sizes="500px"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
