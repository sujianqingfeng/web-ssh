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
import { parse } from 'node-html-parser'
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

      const domain = new URL(url).hostname
      console.log('🚀 ~ domain:', domain)

      const text = await fetch(url, {
        agent: new HttpsProxyAgent('http://127.0.0.1:7890')
      }).then((res) => {
        console.log('🚀 ~ res:', res)
        return res.text()
      })

      console.log('🚀 ~ file: proxy.ts:36 ~ text:', text)

      // parse(text)

      reply.type('text/html').send(text)
    }
  )
}
