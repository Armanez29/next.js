import { ResponseCookies } from '../../../web/spec-extension/cookies'
import { getMutableCookieHeaders } from '../app-route/helpers/get-mutable-cookie-headers'

export function handleTemporaryRedirectResponse(
  url: string,
  mutableCookies: ResponseCookies
): Response {
  const headers = getMutableCookieHeaders(new Headers(), mutableCookies)
  headers.set('location', url)

  return new Response(null, {
    status: 302,
    statusText: 'Found',
    headers,
  })
}

export function handleBadRequestResponse(): Response {
  return new Response(null, {
    status: 400,
    statusText: 'Bad Request',
  })
}

export function handleNotFoundResponse(): Response {
  return new Response(null, {
    status: 404,
    statusText: 'Not Found',
  })
}

export function handleMethodNotAllowedResponse(): Response {
  return new Response(null, {
    status: 405,
    statusText: 'Method Not Allowed',
  })
}

export function handleInternalServerErrorResponse(): Response {
  return new Response(null, {
    status: 500,
    statusText: 'Internal Server Error',
  })
}
