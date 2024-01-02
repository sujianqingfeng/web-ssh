import { createServer } from 'http'
import cors from '@fastify/cors'
import Fastify, { FastifyInstance } from 'fastify'
import { createSocketServer } from './socket'

const server = createServer()

const fastify: FastifyInstance = Fastify({
  serverFactory: (handler) => server.on('request', handler)
})

createSocketServer(server)

fastify.register(cors)

fastify.get('/', async (request, reply) => {
  return 'hello world'
})

const start = async () => {
  try {
    await fastify.listen({ port: 3000 })

    const address = fastify.server.address()
    const port = typeof address === 'string' ? address : address?.port
    console.log('🚀 ~ file: app.ts:29 ~ start ~ port:', port)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
