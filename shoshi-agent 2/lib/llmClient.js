import { getModelConfig } from './modelRouter'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MAX_TOKENS = 1500

function normalizePrompt(prompt) {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('prompt is required')
  }

  return prompt.trim()
}

function buildMockText({ taskType, model, prompt }) {
  const preview = prompt.slice(0, 160)
  return `[MOCK:${taskType}:${model}]\n${preview}`
}

async function executeMockPrompt({ taskType, model, prompt }) {
  return {
    text: buildMockText({ taskType, model, prompt }),
    raw: null,
  }
}

async function executeAnthropicPrompt({ apiKey, model, prompt, maxTokens, temperature }) {
  const body = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  }

  if (typeof temperature === 'number') {
    body.temperature = temperature
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}))
    throw new Error(errorPayload?.error?.message || `Anthropic API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.content?.map(block => block.text || '').join('\n').trim() || '[応答なし]'

  return {
    text,
    raw: data,
  }
}

const PROVIDER_EXECUTORS = {
  anthropic: executeAnthropicPrompt,
  mock: executeMockPrompt,
}

export async function executeRawPrompt({
  provider = 'anthropic',
  model,
  prompt,
  maxTokens = DEFAULT_MAX_TOKENS,
  temperature,
  taskType = 'unknown',
} = {}) {
  const normalizedPrompt = normalizePrompt(prompt)
  const apiKey = process.env.ANTHROPIC_API_KEY
  const resolvedProvider = provider === 'mock' || !apiKey ? 'mock' : provider
  const executor = PROVIDER_EXECUTORS[resolvedProvider]

  if (!executor) {
    throw new Error(`Unsupported LLM provider: ${resolvedProvider}`)
  }

  const result = await executor({
    apiKey,
    model,
    prompt: normalizedPrompt,
    maxTokens,
    temperature,
    taskType,
  })

  return {
    ...result,
    taskType,
    provider: resolvedProvider,
    model,
    isMock: resolvedProvider === 'mock',
  }
}

export async function runTaskPrompt({
  taskType,
  prompt,
  maxTokens = DEFAULT_MAX_TOKENS,
  temperature,
} = {}) {
  const config = getModelConfig(taskType)

  return executeRawPrompt({
    ...config,
    prompt,
    maxTokens,
    temperature,
  })
}

// TODO: Add new provider executors here if the production LLM backend changes.
