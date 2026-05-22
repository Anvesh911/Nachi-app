// src/services/aiService.ts
// Converted from Flutter AiSummaryService → fetch-based OpenAI call

import { ConversationSummary } from './types';

const SYSTEM_PROMPT = `You are a personal conversation analyzer. Given a transcript, extract:
1. keyPoints: 3-5 key points discussed
2. promises: tasks or commitments made by either party  
3. dates: specific dates, times, or deadlines mentioned
4. reminders: important things to remember
5. tone: emotional tone in 2-3 words (e.g. "Warm & planning-focused")
6. toneEmoji: single emoji representing tone

Respond ONLY with valid JSON:
{"keyPoints":[],"promises":[],"dates":[],"reminders":[],"tone":"","toneEmoji":""}`;

export async function generateSummary(
  transcript: string,
  apiKey: string
): Promise<ConversationSummary> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Transcript:\n${transcript}` },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '{}';
    return JSON.parse(content) as ConversationSummary;
  } catch (e) {
    console.error('AI summary error:', e);
    return {
      keyPoints: ['Summary generation failed — review transcript manually'],
      promises: [],
      dates: [],
      reminders: ['Review this conversation manually'],
      tone: 'Unknown',
      toneEmoji: '💬',
    };
  }
}

export async function transcribeWithWhisper(
  audioFilePath: string,
  apiKey: string
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: audioFilePath,
      name: 'audio.m4a',
      type: 'audio/m4a',
    } as any);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    const data = await response.json();
    return data.text ?? 'Transcription failed.';
  } catch (e) {
    return `Transcription error: ${e}`;
  }
}
