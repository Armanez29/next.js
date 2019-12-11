import { match } from 'path-to-regexp'

export default (customRoute = false) => {
  return (path: string) => {
    const matcher = match(path, {
      sensitive: false,
      delimiter: '/',
      ...(customRoute ? { strict: true } : undefined),
      decode: decodeParam,
    })

    return (pathname: string | null | undefined, params?: any) => {
      const res = pathname == null ? false : matcher(pathname)
      if (!res) {
        return false
      }
      return { ...params, ...res.params }
    }
  }
}

function decodeParam(param: string) {
  try {
    return decodeURIComponent(param)
  } catch (_) {
    const err = new Error('failed to decode param')
    // @ts-ignore DECODE_FAILED is handled
    err.code = 'DECODE_FAILED'
    throw err
  }
}
