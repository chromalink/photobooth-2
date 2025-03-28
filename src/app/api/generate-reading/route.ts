import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import crypto from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 300; // 5 minutes timeout

type Role = "system" | "user" | "assistant";

interface ImageUrl {
  url: string;
  detail: "low" | "high" | "auto";
}

interface ContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
    detail: "low" | "high" | "auto";
  };
}

interface Message {
  role: Role;
  content: string | ContentPart[];
}

// Cache that auto-clears every 5 minutes
class AutoClearingCache<K, V> {
  private cache = new Map<K, V>();
  private lastClearTime = Date.now();
  private readonly clearIntervalMs: number;

  constructor(clearIntervalMs: number = 5 * 60 * 1000) { // Default 5 minutes
    this.clearIntervalMs = clearIntervalMs;
  }

  set(key: K, value: V): void {
    this.clearIfNeeded();
    this.cache.set(key, value);
  }

  get(key: K): V | undefined {
    this.clearIfNeeded();
    return this.cache.get(key);
  }

  has(key: K): boolean {
    this.clearIfNeeded();
    return this.cache.has(key);
  }

  private clearIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastClearTime > this.clearIntervalMs) {
      this.cache.clear();
      this.lastClearTime = now;
      console.log('\nCleared cache');
    }
  }
}

// Initialize caches with different timeouts
const requestCache = new AutoClearingCache<string, any>(5 * 60 * 1000); // 5 minutes
const readingCache = new AutoClearingCache<string, any>(60 * 60 * 1000); // 1 hour

// Track last request time and hash to prevent duplicates
const requestCacheMap = new Map<string, {
  timestamp: number;
  response: any;
}>();

// Keep track of recent requests to prevent duplicates
class RequestDeduplicator {
  private requests = new Map<string, { timestamp: number, reading: any }>();
  private readonly timeWindowMs = 2000; // 2 second window for deduplication

  add(imageHash: string, reading: any): void {
    this.cleanup();
    this.requests.set(imageHash, {
      timestamp: Date.now(),
      reading
    });
  }

  get(imageHash: string): any | null {
    this.cleanup();
    const entry = this.requests.get(imageHash);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age < this.timeWindowMs) {
      return entry.reading;
    }
    return null;
  }

  private cleanup(): void {
    const now = Date.now();
    // Convert Map.entries() to Array to avoid TypeScript iteration issues
    Array.from(this.requests.entries()).forEach(([hash, entry]) => {
      if (now - entry.timestamp > this.timeWindowMs) {
        this.requests.delete(hash);
      }
    });
  }
}

const deduplicator = new RequestDeduplicator();

// Request queue to ensure sequential processing
class RequestQueue {
  private processing = false;
  private queue: Array<() => Promise<void>> = [];

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processNext();
    });
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const task = this.queue.shift();
    
    try {
      await task?.();
    } finally {
      this.processing = false;
      this.processNext();
    }
  }
}

const requestQueue = new RequestQueue();

async function getPersonDescription(imageFile: File): Promise<string> {
  // Convert File to base64
  const imageArrayBuffer = await imageFile.arrayBuffer();
  const imageBase64 = Buffer.from(imageArrayBuffer).toString('base64');

  const prompt = `You are a satirical oracle in a fictional movie. Based on the photo, identify hypothetical accentuated red flags and give a funny sarcastic reading that pokes fun at their energy (are they The Power Climber,The One Who Never Works, The Office Influencer or Too Efficient to be Human). are they going to be promoted or fired. make red flags section longer than other sections. Try to guess their secret desire, hidden superpower, red flag, and future prediction. give them advice. Keep it entertaining. at the end: What facial expression does she/he/they have? IF they seem neutral facial expression, composed, yawn, boredom, angry, intense,sad = Corporate_Overlord, lively,exciting, wide smile,raised eyebrows = Star_Thought_Leader, relaxed and relaxed smile = Vacation_CEO; confused/ any other expression = The_Productivity_Cyborg? are they female/male/non-binary? keep it 150 words"  `;

  // Add retry logic
  const maxRetries = 3;
  let retryCount = 0;
  let description = "";
  
  while (retryCount < maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1} to get person description...`);
      
      const descriptionResponse = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an unhinged satirical oracle with a gift for decoding workplace energy and drama. Describe their Facial Expression, Body Language, Clothing, and Hair Style with a satirical playful dramatic conversational tone—each in 15 words or fewer. Identify their most alarming red flags (potential for drama) and accentuated corporate personality in each point. Then, indirectly assign them exactly one of these archetypes: Synergy Specialist ("You call every meeting a 'touch base' and genuinely believe in the power of icebreakers." Detected If: Big, open smile, animated hands, light/bright clothing, soft/voluminous hair). Workflow Wizard ("You have a color-coded spreadsheet for everything. People fear your pivot tables." Detected If: Mildly serious, still posture, neutral tones, tidy hair). Executive Oracle ("You don't take meetings, you take 'alignments.'" Detected If: Intense gaze, upright stance, dark colors, sleek hair, big phone). Middle Manager ("Knows Just Enough to Be Dangerous" Detected If: Slightly strained smile, neutral stance, muted blues/khakis, convenient haircut).  Engagement Risk ("Your enthusiasm levels are dangerously low." Detected If: No smile, arms crossed, dark/slightly disheveled clothing, messy hair). The Intern ("Eager, Overwhelmed, and Underpaid" Detected If: Nervous smile, wide eyes, overdressed/underdressed, slightly off hair). Then tell me: are they male or female? Keep the reading exactly 200 words`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "low"
                }
              }
            ]
          }
        ],
        model: "gpt-4o",
        max_tokens: 400,
        temperature: 0.7
      });
      
      description = descriptionResponse.choices[0].message.content?.trim() || "";
      
      // Check if the response contains facial expression, body language, etc.
      const hasRequiredContent = 
        description.toLowerCase().includes("facial expression") && 
        description.toLowerCase().includes("body language") &&
        !description.toLowerCase().includes("can't be analyzed") &&
        description.length > 50; // Arbitrary minimum length for a valid response
      
      if (hasRequiredContent) {
        console.log("Valid person description received");
        break; // Exit the retry loop if we got a valid response
      } else {
        console.warn("Invalid or incomplete person description received, retrying...");
        retryCount++;
        
        if (retryCount >= maxRetries) {
          console.error("Maximum retries reached for person description");
        } else {
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        }
      }
    } catch (error) {
      console.error("Error getting person description:", error);
      retryCount++;
      
      if (retryCount >= maxRetries) {
        console.error("Maximum retries reached after error");
        throw error; // Re-throw the error after max retries
      } else {
        // Wait a bit before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      }
    }
  }
  
  return description;
}

async function generateOracleReading(personDescription: string): Promise<string> {
  const prompt = `Based on this description, analyze the corporate personality and output in EXACTLY this format, in dramatic satirical tone:

Archetype: [one of: Synergy Specialist, Workflow Wizard, Executive Oracle, Middle Manager, Engagement Risk, The Intern]
General impression: [your 25-word summary]
HR memo: [your 15-word memo]
Final verdict: [your 15-word verdict]

IMPORTANT: The response MUST start with "Archetype:" followed by exactly one of the listed names.`;

  // Add retry logic
  const maxRetries = 3;
  let retryCount = 0;
  let response = "";
  
  while (retryCount < maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1} to generate oracle reading...`);
      
      const oracleResponse = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: personDescription
          }
        ],
        model: "gpt-4",
        max_tokens: 300,
        temperature: 0.9
      });
      
      response = oracleResponse.choices[0].message.content?.trim() || "";
      console.log('Raw OpenAI response:', response); // Debug log
      
      // Check if the response starts with "Archetype:" and contains one of the valid archetypes
      const validArchetypes = [
        "Synergy Specialist", 
        "Workflow Wizard", 
        "Executive Oracle", 
        "Middle Manager", 
        "Engagement Risk", 
        "The Intern"
      ];
      
      const hasValidFormat = response.startsWith("Archetype:") && 
        validArchetypes.some(archetype => 
          response.toLowerCase().includes(archetype.toLowerCase())
        );
      
      if (hasValidFormat) {
        console.log("Valid oracle reading received");
        break; // Exit the retry loop if we got a valid response
      } else {
        console.warn("Invalid or incomplete oracle reading received, retrying...");
        retryCount++;
        
        if (retryCount >= maxRetries) {
          console.error("Maximum retries reached for oracle reading");
        } else {
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        }
      }
    } catch (error) {
      console.error("Error generating oracle reading:", error);
      retryCount++;
      
      if (retryCount >= maxRetries) {
        console.error("Maximum retries reached after error");
        throw error; // Re-throw the error after max retries
      } else {
        // Wait a bit before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      }
    }
  }
  
  return response;
}

function extractCategory(oracleReading: string): string | null {
  console.log('Extracting category from:', oracleReading); // Debug log

  // Map of valid archetypes and their normalized versions
  const archetypeMap: Record<string, string> = {
    'synergy specialist': 'synergy_specialist',
    'workflow wizard': 'workflow_wizard',
    'executive oracle': 'executive_oracle',
    'middle manager': 'middle_manager',
    'engagement risk': 'engagement_risk',
    'the intern': 'the_intern'
  };

  // Extract everything after "Archetype:" until newline or end
  const archetypeMatch = oracleReading?.match(/^Archetype:\s*(.+?)(?=\n|$)/im);
  const rawArchetype = archetypeMatch?.[1]?.trim() || "";
  console.log('Raw extracted archetype:', rawArchetype);

  // Normalize the extracted archetype
  const normalizedInput = rawArchetype.toLowerCase().replace(/[™]/g, '').trim();
  console.log('Normalized input:', normalizedInput);

  // Look up the normalized version
  const mappedArchetype = archetypeMap[normalizedInput] as string | undefined;
  console.log('Mapped archetype:', mappedArchetype || 'not found');

  if (mappedArchetype) {
    return mappedArchetype;
  }

  console.log('No valid match found, defaulting to middle_manager');
  return 'middle_manager';
}

function extractName(oracleReading: string): string {
  return "Corporate Entity #" + Math.floor(Math.random() * 9000 + 1000);
}

function extractReading(oracleReading: string): string {
  // Remove the archetype line
  const withoutArchetype = oracleReading.replace(/^Archetype:.*?\n/, '').trim();
  return withoutArchetype || "No reading available";
}

// Global request lock to prevent parallel processing
let isProcessing = false;
let lastRequest: {
  hash: string;
  timestamp: number;
  response?: any;
} | null = null;

export async function POST(req: Request) {
  try {
    console.log('Generate reading route: POST request received');
    console.log('Content-Type:', req.headers.get('content-type'));

    const data = await req.json();
    const { image, hash } = data;

    if (!image || !hash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if this is a duplicate request within 10 seconds
    if (lastRequest && 
        lastRequest.hash === hash && 
        Date.now() - lastRequest.timestamp < 10000) {
      console.log('Returning cached response for recent request');
      return NextResponse.json(lastRequest.response || { error: 'Processing' });
    }

    // Check if we're already processing a request
    if (isProcessing) {
      console.log('Already processing a request, returning busy status');
      return NextResponse.json({ error: 'Processing' }, { status: 429 });
    }

    try {
      isProcessing = true;
      lastRequest = { hash, timestamp: Date.now() };

      console.log('Getting person description...');
      const personDescription = await getPersonDescription(
        new File([Buffer.from(image, 'base64')], 'image.jpg', { type: 'image/jpeg' })
      );
      console.log('Person description:', personDescription);
      
      // Check if we got a valid person description
      if (!personDescription || 
          personDescription.length < 50 || 
          personDescription.toLowerCase().includes("can't be analyzed")) {
        console.error('Invalid person description received');
        return NextResponse.json(
          { error: 'Failed to analyze image. Please try again.' },
          { status: 422 }
        );
      }

      console.log('Generating oracle reading...');
      const oracleReading = await generateOracleReading(personDescription);
      console.log('Oracle reading:', oracleReading);
      
      // Check if we got a valid oracle reading
      if (!oracleReading || 
          !oracleReading.startsWith("Archetype:")) {
        console.error('Invalid oracle reading received');
        return NextResponse.json(
          { error: 'Failed to generate reading. Please try again.' },
          { status: 422 }
        );
      }

      const category = extractCategory(oracleReading);
      
      // If category extraction failed, return an error
      if (!category) {
        console.error('Failed to extract category from oracle reading');
        return NextResponse.json(
          { error: 'Failed to process reading. Please try again.' },
          { status: 422 }
        );
      }

      const response = {
        success: true,
        category,
        name: extractName(oracleReading),
        reading: extractReading(oracleReading),
        description: personDescription || '' // Ensure we always send the description
      };

      // Cache the successful response
      lastRequest.response = response;

      return NextResponse.json(response);
    } finally {
      // Always release the lock
      isProcessing = false;
    }
  } catch (error) {
    console.error('Error in generate-reading:', error);
    return NextResponse.json(
      { error: 'Failed to generate reading' },
      { status: 500 }
    );
  }
}
