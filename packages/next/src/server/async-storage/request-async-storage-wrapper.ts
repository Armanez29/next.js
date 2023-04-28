import type { tryGetPreviewData as TryGetPreviewData } from '../api-utils/node'
import type { BaseNextRequest, BaseNextResponse } from '../base-http'
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'http'
import type { AsyncLocalStorage } from 'async_hooks'
import type { PreviewData } from '../../../types'
import type { RequestStore } from '../../client/components/request-async-storage'
import type { RenderOpts } from '../app-render/types'
import type { AsyncStorageWrapper } from './async-storage-wrapper'
import type { NextRequest } from '../web/spec-extension/request'

import { FLIGHT_PARAMETERS } from '../../client/components/app-router-headers'
import {
  HeadersAdapter,
  type ReadonlyHeaders,
} from '../web/spec-extension/adapters/headers'
import {
  MutableRequestCookiesAdapter,
  RequestCookiesAdapter,
  type ReadonlyRequestCookies,
} from '../web/spec-extension/adapters/request-cookies'
import { RequestCookies, ResponseCookies } from '../web/spec-extension/cookies'
import { __ApiPreviewProps } from '../api-utils'
import { DraftMode } from './draft-mode'

function getHeaders(headers: Headers | IncomingHttpHeaders): ReadonlyHeaders {
  const cleaned = HeadersAdapter.from(headers)
  for (const param of FLIGHT_PARAMETERS) {
    cleaned.delete(param.toString().toLowerCase())
  }

  return HeadersAdapter.seal(cleaned)
}

function getCookies(
  headers: Headers | IncomingHttpHeaders
): ReadonlyRequestCookies {
  const cookies = new RequestCookies(HeadersAdapter.from(headers))
  return RequestCookiesAdapter.seal(cookies)
}

function getMutableCookies(
  headers: Headers | IncomingHttpHeaders,
  res: ServerResponse | BaseNextResponse | undefined
): ResponseCookies {
  const cookies = new RequestCookies(HeadersAdapter.from(headers))
  return MutableRequestCookiesAdapter.seal(cookies, res)
}

/**
 * Tries to get the preview data on the request for the given route. This
 * isn't enabled in the edge runtime yet.
 */
const tryGetPreviewData: typeof TryGetPreviewData | null =
  process.env.NEXT_RUNTIME !== 'edge'
    ? require('../api-utils/node').tryGetPreviewData
    : null

export type RequestContext = {
  req: IncomingMessage | BaseNextRequest | NextRequest
  res?: ServerResponse | BaseNextResponse
  renderOpts?: RenderOpts
}

export const RequestAsyncStorageWrapper: AsyncStorageWrapper<
  RequestStore,
  RequestContext
> = {
  /**
   * Wrap the callback with the given store so it can access the underlying
   * store using hooks.
   *
   * @param storage underlying storage object returned by the module
   * @param context context to seed the store
   * @param callback function to call within the scope of the context
   * @returns the result returned by the callback
   */
  wrap<Result>(
    storage: AsyncLocalStorage<RequestStore>,
    { req, res, renderOpts }: RequestContext,
    callback: (store: RequestStore) => Result
  ): Result {
    let previewProps: __ApiPreviewProps | undefined = undefined

    if (renderOpts && 'previewProps' in renderOpts) {
      // TODO: investigate why previewProps isn't on RenderOpts
      previewProps = (renderOpts as any).previewProps
    }

    // Reads of this are cached on the `req` object, so this should resolve
    // instantly. There's no need to pass this data down from a previous
    // invoke.
    const previewData: PreviewData =
      previewProps && tryGetPreviewData && res
        ? tryGetPreviewData(req, res, previewProps)
        : false

    const cache: {
      headers?: ReadonlyHeaders
      cookies?: ReadonlyRequestCookies
      mutableCookies?: ResponseCookies
      draftMode?: DraftMode
    } = {}

    const store: RequestStore = {
      get headers() {
        if (!cache.headers) {
          // Seal the headers object that'll freeze out any methods that could
          // mutate the underlying data.
          cache.headers = getHeaders(req.headers)
        }

        return cache.headers
      },
      get cookies() {
        if (!cache.cookies) {
          // Seal the cookies object that'll freeze out any methods that could
          // mutate the underlying data.
          cache.cookies = getCookies(req.headers)
        }

        return cache.cookies
      },
      get mutableCookies() {
        if (!cache.mutableCookies) {
          cache.mutableCookies = getMutableCookies(req.headers, res)
        }
        return cache.mutableCookies
      },
      previewData,
      get draftMode() {
        if (!cache.draftMode) {
          cache.draftMode = new DraftMode(
            previewProps,
            req,
            this.cookies,
            this.mutableCookies
          )
        }

        return cache.draftMode
      },
    }

    return storage.run(store, callback, store)
  },
}
