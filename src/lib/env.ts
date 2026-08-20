export function getServerEnv() {
  return {
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL,
    openaiBaseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1/responses',
  }
}

export function getPublicEnv() {
  return {
    repositoryUrl: process.env.NEXT_PUBLIC_GITHUB_REPOSITORY_URL ?? 'https://github.com/ChimdumebiNebolisa/CarryOS',
  }
}
