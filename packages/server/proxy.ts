import type {
  FastifyInstance,
  FastifyBaseLogger,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault
} from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { parse as contentTypeParse } from 'content-type'
import { HttpsProxyAgent } from 'https-proxy-agent'
import fetch from 'node-fetch'
import { parse } from 'node-html-parser'
import { z } from 'zod'
import { importReplace } from './utils'

type FastifyZod = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  FastifyBaseLogger,
  ZodTypeProvider
>

type ContentType = 'text/html' | 'text/javascript' | 'text/css'

function preprocessing({
  type,
  text,
  domain
}: {
  type: ContentType
  text: string
  domain: string
}) {
  const m: Record<ContentType, (text: string) => string> = {
    'text/html': (html: string) => {
      const root = parse(html)
      const links = root.querySelectorAll('link')
      links.forEach((link) => {
        const href = link.getAttribute('href')
        if (href?.startsWith('./')) {
          link.setAttribute(
            'href',
            `/proxy?url=https://${domain}${href.slice(1)}`
          )
        }
      })
      const scripts = root.querySelectorAll('script')

      scripts.forEach((script) => {
        const innerHTML = script.innerHTML
        if (innerHTML) {
          const newInnerHTML = importReplace(innerHTML, (p) => {
            if (p.startsWith('./')) {
              return `/proxy?url=https://${domain}${p.slice(1)}`
            }
          })

          script.innerHTML = newInnerHTML
          return
        }

        const src = script.getAttribute('src')
        console.log('🚀 ~ scripts.forEach ~ src:', src)
        if (src && !src.startsWith('http')) {
          script.setAttribute('src', `/proxy?url=${domain}`)
        }
      })

      return root.toString()
    },
    'text/css': (css: string) => {
      return css
    },
    'text/javascript': (js: string) => {
      return js
    }
  }

  const currentTypeFn = m[type]
  if (!currentTypeFn) {
    return ''
  }

  return currentTypeFn(text)
}

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

      const { contentType, text } = await fetch(url, {
        agent: new HttpsProxyAgent('http://127.0.0.1:7890')
      }).then(async (res) => {
        const contentType = res.headers.get('content-type')!
        return {
          contentType,
          text: await res.text()
        }
      })

      const { type } = contentTypeParse(contentType)
      console.log('🚀 ~ type:', type)

      const content = preprocessing({ type: type as ContentType, text, domain })
      // console.log('🚀 ~ content:', content)

      reply.type(contentType).send(content)
    }
  )
}
