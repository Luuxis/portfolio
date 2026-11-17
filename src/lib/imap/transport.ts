import { connect } from 'cloudflare:sockets'
import type { ImapConfig, Transport, TransportFactory } from './client'

/**
 * Transport par défaut : une socket TCP des Workers. TLS implicite (993),
 * STARTTLS (143, la socket est ouverte en « starttls » puis montée en TLS
 * après la commande), ou en clair pour un serveur local de développement.
 */
export const socketTransport: TransportFactory = (config: ImapConfig) => {
  const secureTransport = config.secure ? 'on' : config.startTls ? 'starttls' : 'off'
  const socket = connect({ hostname: config.host, port: config.port }, { secureTransport, allowHalfOpen: false })
  return wrap(socket, secureTransport === 'starttls', config.host)
}

function wrap(socket: Socket, canUpgrade: boolean, hostname: string): Transport {
  return {
    readable: socket.readable as ReadableStream<Uint8Array>,
    writable: socket.writable as WritableStream<Uint8Array>,
    startTls: canUpgrade ? () => wrap(socket.startTls({ expectedServerHostname: hostname }), false, hostname) : undefined,
    close: () => socket.close(),
  }
}
