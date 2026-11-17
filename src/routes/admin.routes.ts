import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { HTTPException } from 'hono/http-exception'
import type { AdminEnv } from '../controllers/admin/_shared'
import * as Auth from '../controllers/admin/auth.controller'
import * as Clients from '../controllers/admin/clients.controller'
import * as Cv from '../controllers/admin/cv.controller'
import * as Dashboard from '../controllers/admin/dashboard.controller'
import * as Documents from '../controllers/admin/documents.controller'
import * as Mails from '../controllers/admin/mails.controller'
import * as Settings from '../controllers/admin/settings.controller'
import { adminHeaders, adminServices, requireAdmin } from '../middlewares/admin'

const admin = new Hono<AdminEnv>()

admin.use('*', adminHeaders)
// Formulaires postés depuis l'admin uniquement (en-tête Origin), en plus du cookie SameSite=Strict.
admin.use('*', csrf())
admin.use('*', adminServices)

admin.get('/connexion', Auth.loginPage)
admin.post('/connexion', Auth.login)
admin.post('/deconnexion', Auth.logout)

admin.use('*', requireAdmin)

admin.get('/', Dashboard.index)

admin.get('/clients', Clients.list)
admin.get('/clients/nouveau', Clients.newForm)
admin.post('/clients', Clients.create)
admin.get('/clients/:id', Clients.show)
admin.get('/clients/:id/modifier', Clients.editForm)
admin.post('/clients/:id', Clients.update)
admin.post('/clients/:id/archive', Clients.archive)
admin.post('/clients/:id/supprimer', Clients.remove)

admin.get('/devis', Documents.list('quote'))
admin.get('/devis/nouveau', Documents.newForm('quote'))
admin.get('/factures', Documents.list('invoice'))
admin.get('/factures/nouvelle', Documents.newForm('invoice'))
admin.post('/documents', Documents.create)
admin.get('/documents/:id', Documents.show)
admin.post('/documents/:id', Documents.update)
admin.get('/documents/:id/modifier', Documents.editForm)
admin.get('/documents/:id/apercu', Documents.preview)
admin.get('/documents/:id/pdf', Documents.pdf)
admin.get('/documents/:id/envoyer', Documents.composeForm)
admin.post('/documents/:id/envoyer', Documents.send)
admin.post('/documents/:id/emettre', Documents.issue)
admin.post('/documents/:id/supprimer', Documents.remove)
admin.post('/documents/:id/payee', Documents.paid)
admin.post('/documents/:id/impayee', Documents.unpaid)
admin.post('/documents/:id/reponse', Documents.outcome)
admin.post('/documents/:id/facturer', Documents.derive('invoice'))
admin.post('/documents/:id/avoir', Documents.derive('credit_note'))
admin.post('/documents/:id/dupliquer', Documents.derive('same'))

admin.get('/mails', Mails.list)
admin.post('/mails', Mails.send)
admin.get('/mails/nouveau', Mails.composeForm)
admin.post('/mails/synchroniser', Mails.sync)
admin.post('/mails/supprimer', Mails.removeMany)
admin.get('/mails/:id', Mails.show)
admin.get('/mails/:id/html', Mails.html)
admin.get('/mails/:id/brut', Mails.raw)
admin.get('/mails/:id/pieces/:index', Mails.attachment)
admin.post('/mails/:id/non-lu', Mails.markUnread)
admin.post('/mails/:id/client', Mails.linkClient)
admin.post('/mails/:id/supprimer', Mails.remove)

admin.get('/cv', Cv.editor)
admin.post('/cv', Cv.save)
admin.get('/cv/apercu', Cv.preview)
admin.post('/cv/apercu', Cv.preview)
admin.post('/cv/versions/:id/restaurer', Cv.restore)

admin.get('/reglages', (c) => c.redirect('/admin/reglages/emetteur'))
admin.post('/reglages/emetteur', Settings.saveIssuer)
admin.post('/reglages/facturation', Settings.saveBilling)
admin.post('/reglages/modeles', Settings.saveTemplates)
admin.post('/reglages/messagerie', Settings.saveMail)
admin.post('/reglages/securite/totp', Settings.totpStart)
admin.post('/reglages/securite/totp/confirmer', Settings.totpConfirm)
admin.post('/reglages/securite/totp/desactiver', Settings.totpDisable)
admin.post('/reglages/securite/sessions', Settings.revokeSessions)
admin.get('/reglages/:section', (c) => Settings.show(c))

admin.onError((error, c) => {
  // Refus du contrôle d'origine (csrf) et autres refus voulus : leur propre réponse.
  if (error instanceof HTTPException) return error.getResponse()
  console.error('admin :', error)
  // Drizzle enveloppe l'erreur de D1 : la vraie raison est dans `cause`.
  const cause = error instanceof Error && error.cause instanceof Error ? `\nCause : ${error.cause.message}` : ''
  return c.text(`Erreur : ${error instanceof Error ? error.message : String(error)}${cause}`, 500)
})

export default admin
