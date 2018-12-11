import {IncomingMessage, ServerResponse} from 'http'
import generateETag from 'etag'
import fresh from 'fresh'
import { isResSent } from '../lib/utils'

export function sendHTML (req: IncomingMessage, res: ServerResponse, html: string, { generateEtags }: {generateEtags: boolean}) {
  if (isResSent(res)) return
  const etag = generateEtags ? generateETag(
    html
      .replace(/<meta property="csp-nonce" content=".+"/gi, '<meta property="csp-nonce" content=""')
      .replace(/nonce=".+"/gi, 'nonce=""')
  ) : undefined

  if (fresh(req.headers, { etag })) {
    res.statusCode = 304
    res.end()
    return
  }

  if (etag) {
    res.setHeader('ETag', etag)
  }

  if (!res.getHeader('Content-Type')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
  }
  res.setHeader('Content-Length', Buffer.byteLength(html))
  res.end(req.method === 'HEAD' ? null : html)
}
