import { ImapClient, type ImapConfig } from './client'
import { socketTransport } from './transport'

export {
  ImapClient,
  uidSet,
  type FetchedMessage,
  type ImapConfig,
  type MailboxInfo,
  type SelectResult,
  type SpecialUse,
  type Transport,
  type TransportFactory,
} from './client'
export { Atom, ImapError, formatInternalDate, parseInternalDate, type ImapValue } from './parser'
export { decodeMailboxName, encodeMailboxName } from './utf7'
export { socketTransport } from './transport'

/** Connexion IMAP authentifiée par une socket des Workers ; penser à `logout()`. */
export function connectImap(config: ImapConfig): Promise<ImapClient> {
  return ImapClient.connect(config, socketTransport)
}
