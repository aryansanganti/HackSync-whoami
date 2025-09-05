import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('Gemini API key is not defined in environment variables.');
}
const genAI = new GoogleGenerativeAI(apiKey);

export const textModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// REST fallback for React Native where SDK fetch can fail
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';

async function restGenerateText(prompt: string): Promise<string> {
  const url = `${GEMINI_ENDPOINT}/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gemini REST text error ${res.status}: ${body}`);
  }
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Empty response from Gemini REST text');
  return text as string;
}

async function restGenerateVision(prompt: string, imageBase64: string): Promise<string> {
  const url = `${GEMINI_ENDPOINT}/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inline_data: { mime_type: 'image/jpeg', data: cleanBase64 } }
          ]
        }
      ]
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gemini REST vision error ${res.status}: ${body}`);
  }
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Empty response from Gemini REST vision');
  return text as string;
}

// Rate limiting configuration
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

// Utility function for rate limiting
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

// Utility function for retry logic with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  onRetry?: (attempt: number, maxRetries: number) => void
): Promise<T> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Apply rate limiting before each attempt
      await rateLimit();

      console.log(`Attempt ${attempt + 1}/${maxRetries}`);

      // Notify about retry attempt
      if (onRetry && attempt > 0) {
        onRetry(attempt + 1, maxRetries);
      }

      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed:`, error?.message || String(error));

      // Check if this is a retryable error
      const msg = (error?.message || '').toLowerCase();
      const isRetryable = msg.includes('503') ||
        msg.includes('overloaded') ||
        msg.includes('429') ||
        msg.includes('quota exceeded') ||
        msg.includes('network request failed') ||
        msg.includes('network error') ||
        msg.includes('failed to fetch');

      if (!isRetryable || attempt === maxRetries - 1) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Test function to verify API key is working
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const text = await retryWithBackoff(async () => {
      try {
        const sdkRes = await textModel.generateContent('Say "API working" if you can read this.');
        return (await sdkRes.response).text();
      } catch (e: any) {
        console.warn('SDK failed, using REST fallback for test:', e?.message || e);
        return await restGenerateText('Say "API working" if you can read this.');
      }
    });
    console.log('Gemini test response:', text);
    return text.toLowerCase().includes('api working');
  } catch (error: any) {
    console.error('Gemini connection test failed:', error);

    // Provide user-friendly error messages
    if (error.message?.includes('503') || error.message?.includes('overloaded')) {
      console.error('Gemini API is currently overloaded. Please try again in a few minutes.');
    } else if (error.message?.includes('429')) {
      console.error('Rate limit exceeded. Please wait before making more requests.');
    } else if (error.message?.includes('API key')) {
      console.error('Invalid API key. Please check your Gemini API key configuration.');
    }

    return false;
  }
}

export async function analyzeCivicIssue(
  imageBase64: string,
  onProgress?: (message: string, attempt?: number, maxAttempts?: number) => void
): Promise<{
  category: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  confidence: number;
}> {
  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg'
      }
    };

    const prompt = `
      Analyze this image and identify if it shows a civic issue. If it does, provide:
      1. Category: Choose from [Road Damage, Street Light, Garbage, Water Leak, Traffic Signal, Pothole, Street Sign, Other]
      2. Description: A brief description of the issue
      3. Urgency: low, medium, or high based on safety and impact
      4. Confidence: 0-100 score of how confident you are this is a civic issue
      
      If this is not a civic issue, return category as "Not Applicable" and confidence as 0.
      
      Respond in JSON format only:
      {
        "category": "string",
        "description": "string", 
        "urgency": "low|medium|high",
        "confidence": number
      }
    `;

    const text = await retryWithBackoff(
      async () => {
        try {
          const sdkRes = await visionModel.generateContent([prompt, imagePart as any]);
          return (await sdkRes.response).text();
        } catch (e: any) {
          console.warn('SDK vision failed, using REST fallback:', e?.message || e);
          return await restGenerateVision(prompt, imageBase64);
        }
      },
      3,
      1000,
      (attempt, maxAttempts) => {
        if (onProgress) {
          onProgress(`🔄 AI service busy, retrying... (${attempt}/${maxAttempts})`, attempt, maxAttempts);
        }
      }
    );

    console.log('Gemini response:', text); // For debugging

    // Clean the response text and extract JSON
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsedResult = JSON.parse(jsonMatch[0]);
      return {
        category: parsedResult.category || 'Other',
        description: parsedResult.description || 'Unable to analyze image',
        urgency: parsedResult.urgency || 'medium',
        confidence: typeof parsedResult.confidence === 'number' ? parsedResult.confidence : 0
      };
    }

    throw new Error('Invalid response format');
  } catch (error: any) {
    console.error('Error analyzing image:', error);

    // Provide user-friendly error messages based on error type
    let errorMessage = 'Unable to analyze image - please try again';

    if (error.message?.includes('503') || error.message?.includes('overloaded')) {
      errorMessage = 'AI service is currently busy. Please try again in a few minutes.';
    } else if (error.message?.includes('429')) {
      errorMessage = 'Too many requests. Please wait a moment before trying again.';
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    }

    return {
      category: 'Other',
      description: errorMessage,
      urgency: 'medium',
      confidence: 0
    };
  }
}

// Function to generate issue description from text
export async function generateIssueDescription(
  userText: string,
  onProgress?: (message: string, attempt?: number, maxAttempts?: number) => void
): Promise<{
  category: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
}> {
  try {
    const prompt = `
      Analyze this civic issue description and provide:
      1. Category: Choose from [Road Damage, Street Light, Garbage, Water Leak, Traffic Signal, Pothole, Street Sign, Other]
      2. Description: A clear, detailed description of the issue
      3. Urgency: low, medium, or high based on safety and impact
      
      User description: "${userText}"
      
      Respond in JSON format only:
      {
        "category": "string",
        "description": "string",
        "urgency": "low|medium|high"
      }
    `;

    const text = await retryWithBackoff(
      async () => {
        try {
          const sdkRes = await textModel.generateContent(prompt);
          return (await sdkRes.response).text();
        } catch (e: any) {
          console.warn('SDK text failed, using REST fallback:', e?.message || e);
          return await restGenerateText(prompt);
        }
      },
      3,
      1000,
      (attempt, maxAttempts) => {
        if (onProgress) {
          onProgress(`🔄 AI service busy, retrying text analysis... (${attempt}/${maxAttempts})`, attempt, maxAttempts);
        }
      }
    );

    console.log('Gemini text response:', text); // For debugging

    // Clean the response text and extract JSON
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsedResult = JSON.parse(jsonMatch[0]);
      return {
        category: parsedResult.category || 'Other',
        description: parsedResult.description || userText,
        urgency: parsedResult.urgency || 'medium'
      };
    }

    throw new Error('Invalid response format');
  } catch (error: any) {
    console.error('Error generating description:', error);

    // Return fallback values with original user text
    return {
      category: 'Other',
      description: userText,
      urgency: 'medium'
    };
  }
} 