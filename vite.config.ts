import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { ITEMS } from './src/demoData'
import { handleCarryProfileRequest, OpenAIResponsesProvider, readJsonBody } from './server/carryProfile'

function carryProfileApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'carry-profile-api',
    configureServer(server) {
      server.middlewares.use('/api/carry-profile', async (request, response) => {
        response.setHeader('Content-Type', 'application/json')
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.end(JSON.stringify({ error: 'Method not allowed.' }))
          return
        }

        try {
          const body = await readJsonBody(request)
          const result = await handleCarryProfileRequest(
            body,
            ITEMS,
            new OpenAIResponsesProvider(env.OPENAI_API_KEY, env.OPENAI_MODEL, env.OPENAI_BASE_URL),
          )
          response.statusCode = result.status
          response.end(JSON.stringify(result.body))
        } catch {
          response.statusCode = 400
          response.end(JSON.stringify({ error: 'Carry profile request could not be read.' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), carryProfileApiPlugin(env)],
  }
})
