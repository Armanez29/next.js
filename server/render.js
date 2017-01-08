import { join } from 'path'
import { createElement } from 'react'
import { renderToString, renderToStaticMarkup } from 'react-dom/server'
import send from 'send'
import accepts from 'accepts'
import requireModule from './require'
import resolvePath from './resolve'
import readPage from './read-page'
import { Router } from '../lib/router'
import Head, { defaultHead } from '../lib/head'
import App from '../lib/app'

export async function render (req, res, pathname, query, opts) {
  const html = await renderToHTML(req, res, pathname, opts)
  sendHTML(res, html)
}

export function renderToHTML (req, res, pathname, query, opts) {
  return doRender(req, res, pathname, query, opts)
}

export async function renderError (err, req, res, pathname, query, opts) {
  const html = await renderErrorToHTML(err, req, res, query, opts)
  sendHTML(res, html)
}

export function renderErrorToHTML (err, req, res, pathname, query, opts = {}) {
  const page = err && opts.dev ? '/_error-debug' : '/_error'
  return doRender(req, res, pathname, query, { ...opts, err, page })
}

async function doRender (req, res, pathname, query, {
  err,
  page,
  dir = process.cwd(),
  dev = false,
  staticMarkup = false
} = {}) {
  page = page || pathname
  let [Component, Document] = await Promise.all([
    requireModule(join(dir, '.next', 'dist', 'pages', page)),
    requireModule(join(dir, '.next', 'dist', 'pages', '_document'))
  ])
  Component = Component.default || Component
  Document = Document.default || Document
  const ctx = { err, req, res, pathname, query }

  const [
    props,
    component,
    errorComponent
  ] = await Promise.all([
    Component.getInitialProps ? Component.getInitialProps(ctx) : {},
    readPage(join(dir, '.next', 'bundles', 'pages', page)),
    readPage(join(dir, '.next', 'bundles', 'pages', dev ? '_error-debug' : '_error'))
  ])

  // the response might be finshed on the getinitialprops call
  if (res.finished) return

  const renderPage = () => {
    const app = createElement(App, {
      Component,
      props,
      router: new Router(pathname, query)
    })

    const render = staticMarkup ? renderToStaticMarkup : renderToString

    let html
    let head
    try {
      html = render(app)
    } finally {
      head = Head.rewind() || defaultHead()
    }
    return { html, head }
  }

  const docProps = await Document.getInitialProps({ ...ctx, renderPage })

  const doc = createElement(Document, {
    __NEXT_DATA__: {
      component,
      errorComponent,
      props,
      pathname,
      query,
      err: (err && dev) ? errorToJSON(err) : null
    },
    dev,
    staticMarkup,
    ...docProps
  })

  return '<!DOCTYPE html>' + renderToStaticMarkup(doc)
}

export async function renderJSON (req, res, page, { dir = process.cwd(), supportedEncodings } = {}) {
  const pagePath = await resolvePath(join(dir, '.next', 'bundles', 'pages', page))
  return serveStaticWithCompression(req, res, pagePath, supportedEncodings)
}

export async function renderErrorJSON (err, req, res, { dir = process.cwd(), dev = false } = {}) {
  const page = err && dev ? '/_error-debug' : '/_error'
  const component = await readPage(join(dir, '.next', 'bundles', 'pages', page))

  sendJSON(res, {
    component,
    err: err && dev ? errorToJSON(err) : null
  })
}

export function sendHTML (res, html) {
  if (res.finished) return

  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Content-Length', Buffer.byteLength(html))
  res.end(html)
}

export function sendJSON (res, obj) {
  if (res.finished) return

  const json = JSON.stringify(obj)
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Length', Buffer.byteLength(json))
  res.end(json)
}

function errorToJSON (err) {
  const { name, message, stack } = err
  const json = { name, message, stack }

  if (name === 'ModuleBuildError') {
    // webpack compilation error
    const { module: { rawRequest } } = err
    json.module = { rawRequest }
  }

  return json
}

export async function serveStaticWithCompression (req, res, path, supportedEncodings) {
  const acceptingEncodings = accepts(req).encodings()
  const encoding = supportedEncodings.find((e) => acceptingEncodings.indexOf(e) >= 0)

  if (!encoding) {
    return serveStatic(req, res, path)
  }

  try {
    const compressedPath = `${path}.${encoding}`
    res.setHeader('Content-Encoding', encoding)
    await serveStatic(req, res, compressedPath)
  } catch (ex) {
    if (ex.code === 'ENOENT') {
      res.removeHeader('Content-Encoding')
      return serveStatic(req, res, path)
    }
    throw ex
  }
}

export function serveStatic (req, res, path) {
  return new Promise((resolve, reject) => {
    send(req, path)
    .on('error', reject)
    .pipe(res)
    .on('finish', resolve)
  })
}
