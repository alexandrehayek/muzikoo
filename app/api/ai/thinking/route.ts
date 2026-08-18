// /app/api/ai/thinking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { prompt, currentTrack } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        text: `**Archordion Musicologist AI**\n\nTo enable live AI analysis and musicology insights, please configure your \`GEMINI_API_KEY\` in your environment settings.\n\n*Current track context:* ${currentTrack ? `${currentTrack.title} by ${currentTrack.artist}` : 'None'}`
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Build a rich system instruction to shape the AI as a world-class Musicologist,
    // blending MusicBrainz deep structure and ListenBrainz insights
    const systemInstruction = `You are "Archordion AI", a world-class music scholar, musicologist, and interactive listening companion.
You are connected to the live MusicBrainz and ListenBrainz schemas.
Your replies should be deeply informative, sophisticated, and engaging, incorporating histories of genres, record labels, movements, and production notes.
Do NOT use unrequested metadata, system ports, or raw code blocks unless asked.
Use markdown to format your replies beautifully with headers and bullet points.`;

    const userPrompt = currentTrack
      ? `[The user is currently listening to "${currentTrack.title}" by "${currentTrack.artist}" (Genre: ${currentTrack.genre || 'Unknown'}, MusicBrainz ID: ${currentTrack.id})]\n\nUser request: ${prompt}`
      : prompt;

    try {
      // Try gemini-3.1-pro-preview with ThinkingLevel.HIGH first
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: userPrompt,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });
      return NextResponse.json({ text: response.text });
    } catch (modelErr) {
      console.warn('Primary model failed, attempting fallback to gemini-3.6-flash:', modelErr);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
        },
      });
      return NextResponse.json({ text: fallbackResponse.text });
    }
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message || 'Error generating AI content' }, { status: 500 });
  }
}

