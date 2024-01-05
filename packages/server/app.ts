import { createServer } from 'http'
import cors from '@fastify/cors'
import Fastify from 'fastify'
import {
  ZodTypeProvider,
  serializerCompiler,
  validatorCompiler
} from 'fastify-type-provider-zod'
import { proxyRouters } from './proxy'
import { createSocketServer } from './socket'

const server = createServer()

const app = Fastify({
  serverFactory: (handler) => server.on('request', handler),
  logger: true
}).withTypeProvider<ZodTypeProvider>()

app.register(cors)
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

createSocketServer(server)

app.register(proxyRouters)

const start = async () => {
  try {
    await app.listen({ port: 3000 })
    const address = app.server.address()
    app.log.info(`server listening on ${address}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
