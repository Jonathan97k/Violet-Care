// Vercel Serverless Function: AI Chat Proxy
// Securely forwards requests to OpenRouter API
// This keeps the API key safe on the server side

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: { message: 'Method not allowed' } }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'AI assistant is not configured. Please add OPENROUTER_API_KEY to Vercel environment variables.',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();

    // Validate request body
    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: { message: 'Invalid request: messages array required' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Forward to OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.get('origin') || 'https://violet-care.vercel.app',
        'X-Title': 'VioletCare',
      },
      body: JSON.stringify({
        model: body.model || 'google/gemini-2.0-flash-exp:free',
        messages: body.messages,
        temperature: body.temperature || 0.7,
        max_tokens: body.max_tokens || 1000,
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: error.message || 'Failed to process AI request',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
