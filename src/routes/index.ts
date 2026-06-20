import { Hono } from 'hono'
import homeRoutes from './home.routes'
import * as CvController from '../controllers/cv.controller'
import type { CloudflareBindings } from '../types/bindings'

export function registerRoutes(app: Hono<{ Bindings: CloudflareBindings }>) {
  app.route('/', homeRoutes)
  app.get('/cv.pdf', CvController.pdf)
}
