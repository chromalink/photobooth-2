import OpenAI from 'openai';

export const generateSpiritualReading = async (color: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate-reading', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ color }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate reading');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error generating spiritual reading:', error);
    throw new Error('Failed to generate spiritual reading');
  }
};
