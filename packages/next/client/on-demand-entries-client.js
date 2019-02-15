/* global location, WebSocket */

import Router from 'next/router'
import fetch from 'unfetch'

const { hostname, protocol } = location
const isHttps = protocol.includes('https')

//
// Cannot use `wss` until we can spin up ws server with ssl certs
//
const wsProtocol = 'ws'
//
// If developing under https, use ws://localhost
//
const wsHostname = isHttps ? 'localhost' : hostname
const retryTime = 5000
let ws = null
let lastHref = null

export default async ({ assetPrefix }) => {
  Router.ready(() => {
    Router.events.on('routeChangeComplete', ping)
  })

  const setup = async (reconnect) => {
    if (ws && ws.readyState === ws.OPEN) {
      return Promise.resolve()
    }

    return new Promise(resolve => {
      ws = new WebSocket(`${wsProtocol}://${wsHostname}:${process.env.NEXT_WS_PORT}${process.env.NEXT_WS_PROXY_PATH}`)
      ws.onopen = () => resolve()
      ws.onclose = () => {
        setTimeout(async () => {
          // check if next restarted and we have to reload to get new port
          await fetch(`${assetPrefix}/_next/on-demand-entries-ping`)
            .then(res => res.status === 200 && location.reload())
            .catch(() => {})
          await setup(true)
          resolve()
        }, retryTime)
      }
      ws.onmessage = async ({ data }) => {
        const payload = JSON.parse(data)
        if (payload.invalid && lastHref !== location.href) {
          // Payload can be invalid even if the page does not exist.
          // So, we need to make sure it exists before reloading.
          const pageRes = await fetch(location.href, {
            credentials: 'omit'
          })
          if (pageRes.status === 200) {
            location.reload()
          } else {
            lastHref = location.href
          }
        }
      }
    })
  }
  await setup()

  async function ping () {
    if (ws.readyState === ws.OPEN) {
      ws.send(Router.pathname)
    }
  }

  let pingerTimeout
  async function runPinger () {
    // Will restart on the visibilitychange API below. For older browsers, this
    // will always be true and will always run, but support is fairly prevalent
    // at this point.
    while (!document.hidden) {
      await ping()
      await new Promise(resolve => {
        pingerTimeout = setTimeout(resolve, 5000)
      })
    }
  }

  document.addEventListener(
    'visibilitychange',
    () => {
      if (!document.hidden) {
        runPinger()
      } else {
        clearTimeout(pingerTimeout)
      }
    },
    false
  )

  setTimeout(() => {
    runPinger().catch(err => {
      console.error(err)
    })
  }, 10000)
}
