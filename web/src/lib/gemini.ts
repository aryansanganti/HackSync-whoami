import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    console.warn('Gemini API key is not defined in environment variables.');
}
const genAI = new GoogleGenerativeAI(apiKey || '');

export const textModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
export const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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
            await rateLimit();
            console.log(`Attempt ${attempt + 1}/${maxRetries}`);

            if (onRetry && attempt > 0) {
                onRetry(attempt + 1, maxRetries);
            }

            return await operation();
        } catch (error: any) {
            lastError = error;
            console.error(`Attempt ${attempt + 1} failed:`, error?.message || String(error));

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

            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
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
                data: imageBase64.replace(/^data:[^;]+;base64,/, ''),
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
                const result = await visionModel.generateContent([prompt, imagePart as any]);
                return (await result.response).text();
            },
            3,
            1000,
            (attempt, maxAttempts) => {
                if (onProgress) {
                    onProgress(`🔄 AI service busy, retrying... (${attempt}/${maxAttempts})`, attempt, maxAttempts);
                }
            }
        );

        console.log('Gemini response:', text);

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
                const result = await textModel.generateContent(prompt);
                return (await result.response).text();
            },
            3,
            1000,
            (attempt, maxAttempts) => {
                if (onProgress) {
                    onProgress(`🔄 AI service busy, retrying text analysis... (${attempt}/${maxAttempts})`, attempt, maxAttempts);
                }
            }
        );

        console.log('Gemini text response:', text);

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

        return {
            category: 'Other',
            description: userText,
            urgency: 'medium'
        };
    }
}
