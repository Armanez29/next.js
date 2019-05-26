import { getEventSourceWrapper } from './dev-error-overlay/eventsource'

export default function initializeBuildWatcher () {
  const shadowHost = document.getElementById('__next-build-watcher')
  if (!shadowHost) return
  let shadowRoot
  let prefix = ''

  if (shadowHost.attachShadow) {
    shadowRoot = shadowHost.attachShadow({ mode: 'open' })
  } else {
    // If attachShadow is undefined then the browser does not support
    // the Shadow DOM, we need to prefix all the names so there
    // will be no conflicts
    shadowRoot = shadowHost
    prefix = '__next-build-watcher-'
  }

  // Get the current style
  const style = shadowHost.getAttribute('data-buildwatcherstyle')

  // Container
  const container = createContainer(prefix)
  shadowRoot.appendChild(container)

  // CSS
  const css = createCss(style, prefix)
  shadowRoot.appendChild(css)

  // State
  let isVisible = false
  let isBuilding = false
  let timeoutId = null

  // Handle events
  const evtSource = getEventSourceWrapper({ path: '/_next/webpack-hmr', ondemand: 1 })
  evtSource.addMessageListener((event) => {
    // This is the heartbeat event
    if (event.data === '\uD83D\uDC93') {
      return
    }

    try {
      handleMessage(event)
    } catch { }
  })

  function handleMessage (event) {
    const obj = JSON.parse(event.data)

    switch (obj.action) {
      case 'building':
        timeoutId && clearTimeout(timeoutId)
        isVisible = true
        isBuilding = true
        updateContainer()
        break
      case 'built':
        isBuilding = false
        // Wait for the fade out transtion to complete
        timeoutId = setTimeout(() => {
          isVisible = false
          updateContainer()
        }, 100)
        updateContainer()
        break
    }
  }

  function updateContainer () {
    if (isBuilding) {
      container.classList.add(`${prefix}building`)
    } else {
      container.classList.remove(`${prefix}building`)
    }

    if (isVisible) {
      container.classList.add(`${prefix}visible`)
    } else {
      container.classList.remove(`${prefix}visible`)
    }
  }
}

function createContainer (prefix) {
  const container = document.createElement('div')
  container.setAttribute('id', `${prefix}container`)
  container.innerHTML = `
    <div id="${prefix}icon-wrapper">
      <svg
        width="114px"
        height="100px"
        viewBox="0 0 226 200"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            x1="114.720775%"
            y1="181.283245%"
            x2="39.5399306%"
            y2="100%"
            id="${prefix}linearGradient-1"
          >
            <stop stop-color="#FFFFFF" offset="0%" />
            <stop stop-color="#000000" offset="100%" />
          </linearGradient>
        </defs>
        <g id="${prefix}icon-group" fill="none" stroke="url(#${prefix}linearGradient-1)" stroke-width="18">
          <path d="M113,5.08219117 L4.28393801,197.5 L221.716062,197.5 L113,5.08219117 Z" />
        </g>
      </svg>
    </div>

    <span id="${prefix}building-text"></span>
  `

  return container
}

function createCss (style, prefix) {
  const css = document.createElement('style')
  css.textContent = `
    #${prefix}container {
      position: absolute;
      bottom: 10px;
      right: 30px;

      background: #fff;
      color: #000;
      font: initial;
      cursor: initial;
      letter-spacing: initial;
      text-shadow: initial;
      text-transform: initial;
      visibility: initial;

      padding: 8px 10px;
      align-items: center;
      box-shadow: 0 11px 40px 0 rgba(0, 0, 0, 0.25), 0 2px 10px 0 rgba(0, 0, 0, 0.12);

      display: none;
      opacity: 0;
      transition: opacity 0.1s ease, bottom 0.1s ease;
      animation: ${prefix}fade-in 0.1s ease-in-out;
    }

    #${prefix}container.${prefix}visible {
      display: flex;
    }

    #${prefix}container.${prefix}building {
      bottom: 20px;
      opacity: 1;
    }

    #${prefix}icon-wrapper {
      width: 16px;
      height: 16px;
    }

    #${prefix}icon-wrapper > svg {
      width: 100%;
      height: 100%;
    }

    #${prefix}building-text {
      font-family: monospace;
      margin-top: 2px;
      margin-left: 8px;
      display: ${style === 'minimalist' ? 'none' : 'block'};
    }

    #${prefix}building-text::after {
      content: 'Building...';
    }

    #${prefix}icon-group {
      animation: ${prefix}strokedash 1s ease-in-out both infinite;
    }

    @keyframes ${prefix}fade-in {
      from {
        bottom: 10px;
        opacity: 0;
      }
      to {
        bottom: 20px;
        opacity: 1;
      }
    }

    @keyframes ${prefix}strokedash {
      0% {
        stroke-dasharray: 0 226;
      }
      80%,
      100% {
        stroke-dasharray: 659 226;
      }
    }
  `

  return css
}
