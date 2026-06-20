import { Hono } from 'hono'
import * as CvController from '../controllers/cv.controller'
import type { CloudflareBindings } from '../types/bindings'

const cvRoutes = new Hono<{ Bindings: CloudflareBindings }>()

cvRoutes.get('/', CvController.index)

export default cvRoutes
