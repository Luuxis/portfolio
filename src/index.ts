import { Hono } from 'hono'
import { registerRoutes } from './routes'
import type { CloudflareBindings } from './types/bindings'

const app = new Hono<{ Bindings: CloudflareBindings }>()

registerRoutes(app)

export default app
