const DEFAULT_MODEL = 'gemini-1.5-flash';
const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

const callGemini = async ({ prompt, systemPrompt, model = DEFAULT_MODEL }) => {
  const { GOOGLE_API_KEY } = process.env;

  if (!GOOGLE_API_KEY) {
    return null;
  }

  const url = `${API_ENDPOINT}/${model}:generateContent?key=${GOOGLE_API_KEY}`;

  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  return candidate?.trim() || null;
};

const fallbackResponse = (prompt) => {
  const templateResponse = [
    '• Quantified accomplishment that highlights impact and includes key metrics.',
    '• Action-oriented statement describing responsibilities and outcomes.',
    '• Collaboration or leadership example showcasing soft skills.',
  ];

  return [
    'AI key unavailable. Returning a template response.',
    `Input preview: ${prompt.slice(0, 120)}${prompt.length > 120 ? '...' : ''}`,
    '',
    ...templateResponse,
  ].join('\n');
};

const generateImprovedContent = async (req, res) => {
  const { prompt, context, model } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    const systemPrompt =
      context ||
      'You are an expert technical resume writer. Rewrite the provided content to be concise, outcome-focused, and ATS-friendly. Return only bullet points.';

    const aiResponse = await callGemini({ prompt, systemPrompt, model });

    if (!aiResponse) {
      return res.json({ content: fallbackResponse(prompt), isFallback: true });
    }

    return res.json({ content: aiResponse, isFallback: false });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate AI content', error: error.message });
  }
};

const generatePortfolioIntro = async (req, res) => {
  const { skills = [], profession, tone = 'professional' } = req.body;

  if (!profession) {
    return res.status(400).json({ message: 'Profession is required' });
  }

  const prompt = [
    `Profession: ${profession}`,
    `Tone: ${tone}`,
    skills.length ? `Key skills: ${skills.join(', ')}` : '',
    '',
    'Write a concise 3-sentence professional bio suitable for portfolio landing page. Highlight differentiation and include subtle call-to-action.',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const systemPrompt = 'You craft concise, compelling personal bios for digital portfolios. Keep language friendly, confident, and jargon-light.';

    const aiResponse = await callGemini({ prompt, systemPrompt });

    if (!aiResponse) {
      return res.json({
        content: fallbackResponse(prompt),
        isFallback: true,
      });
    }

    return res.json({ content: aiResponse, isFallback: false });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate portfolio intro', error: error.message });
  }
};

module.exports = {
  generateImprovedContent,
  generatePortfolioIntro,
};
