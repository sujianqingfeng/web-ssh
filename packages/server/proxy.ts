import type {
  FastifyInstance,
  FastifyBaseLogger,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'
import { z } from 'zod'

type FastifyZod = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  FastifyBaseLogger,
  ZodTypeProvider
>

export async function proxyRouters(fastify: FastifyZod) {
  fastify.get(
    '/proxy',
    {
      schema: {
        querystring: z.object({
          url: z.string()
        })
      }
    },
    async (request, reply) => {
      const { url } = request.query
      console.log('🚀 ~ file: proxy.ts:19 ~ url:', url)

      const text = await fetch(url, {
        agent: new HttpsProxyAgent('http://127.0.0.1:7890')
      }).then((res) => res.text())

      console.log('🚀 ~ file: proxy.ts:36 ~ text:', text)
      reply.type('text/html').send(text)
    }
  )
}
