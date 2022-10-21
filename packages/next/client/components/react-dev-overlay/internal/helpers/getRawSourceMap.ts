import dataUriToBuffer, {
  MimeBuffer,
} from 'next/dist/compiled/data-uri-to-buffer'
import type { EncodedSourceMap } from 'next/dist/compiled/@jridgewell/source-map'
import { getSourceMapUrl } from './getSourceMapUrl'

export function getRawSourceMap(fileContents: string): EncodedSourceMap | null {
  const sourceUrl = getSourceMapUrl(fileContents)
  if (!sourceUrl?.startsWith('data:')) {
    return null
  }

  let buffer: MimeBuffer
  try {
    // @ts-expect-error TODO-APP: fix type.
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
