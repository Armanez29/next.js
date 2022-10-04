import { experimental_use as use } from 'react'
import Script from 'next/script'

import '../styles/global.css'
import './style.css'

export const config = {
  revalidate: 0,
}

async function getData() {
  return {
    world: 'world',
  }
}

export default function Root({ children }) {
  const { world } = use(getData())

  return (
    <html className="this-is-the-document-html">
      <head>
        <title>{`hello ${world}`}</title>
      </head>
      <body className="this-is-the-document-body">{children}</body>
      <Script strategy="beforeInteractive" src="/test.js" />
    </html>
  )
}
