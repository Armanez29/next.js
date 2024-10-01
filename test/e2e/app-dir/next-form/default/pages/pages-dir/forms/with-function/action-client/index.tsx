'use client'
import * as React from 'react'
import { useActionState, useState } from 'react'
import Form from 'next/form'
import { useRouter } from 'next/router'

export default function Page() {
  const destination = '/pages-dir/redirected-from-action'
  const router = useRouter()
  const [, dispatch, isPending] = useActionState(() => {
    const to = destination + '?' + new URLSearchParams({ query })
    router.push(to)
  }, undefined)

  const [query, setQuery] = useState('')
  return (
    <Form action={dispatch} id="search-form">
      <input
        name="query"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button type="submit" disabled={isPending}>
        Submit (client action)
      </button>
    </Form>
  )
}
