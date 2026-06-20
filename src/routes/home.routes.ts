import { Hono } from 'hono'
import * as HomeController from '../controllers/home.controller'
import type { CloudflareBindings } from '../types/bindings'

const homeRoutes = new Hono<{ Bindings: CloudflareBindings }>()

homeRoutes.get('/', HomeController.index)

export default homeRoutes
