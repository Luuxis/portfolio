import { Hono } from 'hono'
import { scheduled } from './cron'
import { registerRoutes } from './routes'
import type { CloudflareBindings } from './types/bindings'

const app = new Hono<{ Bindings: CloudflareBindings }>()

registerRoutes(app)

export default {
  fetch: app.fetch,
  scheduled(controller, env, ctx) {
    ctx.waitUntil(scheduled(controller, env))
  },
} satisfies ExportedHandler<CloudflareBindings>
