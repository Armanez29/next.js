import fetch from 'node-fetch'
import http from 'http'
import express from 'express'
import path from 'path'
import getPort from 'get-port'
import { spawn } from 'child_process'
import fkill from 'fkill'
import cheerio from 'cheerio'

// `next` here is the symlink in `test/node_modules/next` which points to the root directory.
// This is done so that requiring from `next` works.
// The reason we don't import the relative path `../../dist/<etc>` is that it would lead to inconsistent module singletons
import server from 'next/dist/server/next'
import build from 'next/dist/build'
import _export from 'next/dist/export'
import _pkg from 'next/package.json'

export const nextServer = server
export const nextBuild = build
export const nextExport = _export
export const pkg = _pkg

export function initNextServerScript (scriptPath, successRegexp, env) {
  return new Promise((resolve, reject) => {
    const instance = spawn('node', [scriptPath], { env })

    function handleStdout (data) {
      const message = data.toString()
      if (successRegexp.test(message)) {
        resolve(instance)
      }
      process.stdout.write(message)
    }

    function handleStderr (data) {
      process.stderr.write(data.toString())
    }

    instance.stdout.on('data', handleStdout)
    instance.stderr.on('data', handleStderr)

    instance.on('close', () => {
      instance.stdout.removeListener('data', handleStdout)
      instance.stderr.removeListener('data', handleStderr)
    })

    instance.on('error', (err) => {
      reject(err)
    })
  })
}

// Launch the app in dev mode.
export async function runNextDev (dir) {
  const port = await getPort({ port: 3000 })
  const cwd = path.dirname(require.resolve('next/package'))
  return new Promise((resolve, reject) => {
    const instance = spawn('node', ['dist/bin/next', dir, '-p', port], { cwd })

    function handleStdout (data) {
      const message = data.toString()
      if (/> Ready on/.test(message)) {
        resolve(createTestServerInstance(instance, port))
      }
      process.stdout.write(message)
    }

    function handleStderr (data) {
      process.stderr.write(data.toString())
    }

    instance.stdout.on('data', handleStdout)
    instance.stderr.on('data', handleStderr)

    instance.on('close', () => {
      instance.stdout.removeListener('data', handleStdout)
      instance.stderr.removeListener('data', handleStderr)
    })

    instance.on('error', reject)
  })
}

function createTestServerInstance (instance, port) {
  return {
    getURL (path = '/') {
      return `http://localhost:${port}${path}`
    },
    close () {
      return fkill(instance.pid)
    },
    fetch (path) {
      const url = this.getURL(path)
      return fetch(url)
    },
    fetchHTML (path) {
      return this
        .fetch(path)
        .then(res => res.text())
    },
    fetch$ (path) {
      return this
        .fetchHTML(path)
        .then(cheerio.load)
    }
  }
}

export async function startApp (app) {
  await app.prepare()
  const handler = app.getRequestHandler()
  const server = http.createServer(handler)
  server.__app = app

  await promiseCall(server, 'listen')
  return server
}

export async function stopApp (server) {
  if (server.__app) {
    await server.__app.close()
  }
  await promiseCall(server, 'close')
}

function promiseCall (obj, method, ...args) {
  return new Promise((resolve, reject) => {
    const newArgs = [
      ...args,
      function (err, res) {
        if (err) return reject(err)
        resolve(res)
      }
    ]

    obj[method](...newArgs)
  })
}

export async function startStaticServer (dir) {
  const app = express()
  const server = http.createServer(app)
  app.use(express.static(dir))

  await promiseCall(server, 'listen')
  return server
}
