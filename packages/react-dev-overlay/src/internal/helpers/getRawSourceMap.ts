import dataUriToBuffer, { MimeBuffer } from 'data-uri-to-buffer'
import type { EncodedSourceMap } from '@jridgewell/source-map'
import { getSourceMapUrl } from './getSourceMapUrl'

export function getRawSourceMap(fileContents: string): EncodedSourceMap | null {
  const sourceUrl = getSourceMapUrl(fileContents)
  if (!sourceUrl?.startsWith('data:')) {
    return null
  }

  let buffer: MimeBuffer
  try {
    buffer = dataUriToBuffer(sourceUrl)
  } catch (err) {
    console.error('Failed to parse source map URL:', err)
    return null
  }

  if (buffer.type !== 'application/json') {
    console.error(`Unknown source map type: ${buffer.typeFull}.`)
    return null
  }

  try {
    return JSON.parse(buffer.toString())
  } catch {
    console.error('Failed to parse source map.')
    return null
  }
}
