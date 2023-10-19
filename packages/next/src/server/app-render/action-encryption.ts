/* eslint-disable import/no-extraneous-dependencies */
import 'server-only'

/* eslint-disable import/no-extraneous-dependencies */
import { renderToReadableStream } from 'react-server-dom-webpack/server.edge'
/* eslint-disable import/no-extraneous-dependencies */
import { createFromReadableStream } from 'react-server-dom-webpack/client.edge'

import { streamToString } from '../stream-utils/node-web-streams-helper'
import {
  arrayBufferToString,
  decrypt,
  encrypt,
  getActionEncryptionKey,
  getClientReferenceManifestSingleton,
  stringToUint8Array,
} from './action-encryption-utils'

async function decodeActionBoundArg(actionId: string, arg: string) {
  const key = await getActionEncryptionKey(actionId)
  if (typeof key === 'undefined') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `Missing encryption key in production. This is a bug in Next.js`
      )
    }

    // No encryption needed during development.
    return arg
  }

  const decoded = await decrypt(
    key,
    '__next_action__' + actionId,
    stringToUint8Array(atob(arg))
  )
  return arrayBufferToString(decoded)
}

async function encodeActionBoundArg(actionId: string, arg: string) {
  const key = await getActionEncryptionKey(actionId)
  if (typeof key === 'undefined') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `Missing encryption key in production. This is a bug in Next.js`
      )
    }

    // No encryption needed during development.
    return arg
  }

  const encoded = await encrypt(
    key,
    '__next_action__' + actionId,
    stringToUint8Array(arg)
  )
  return btoa(arrayBufferToString(encoded))
}

// Encrypts the action's bound args into a string.
export async function encryptActionBoundArgs(actionId: string, args: any[]) {
  const clientReferenceManifestSingleton = getClientReferenceManifestSingleton()

  // Using Flight to serialize the args into a string.
  const serialized = await streamToString(
    renderToReadableStream(args, clientReferenceManifestSingleton.clientModules)
  )

  // Encrypt the serialized string with the action id as the salt.
  const encryped = await encodeActionBoundArg(actionId, serialized)

  return encryped
}

// Decrypts the action's bound args from the encrypted string.
export async function decryptActionBoundArgs(
  actionId: string,
  encryped: Promise<string>
) {
  // Decrypt the serialized string with the action id as the salt.
  const decryped = await decodeActionBoundArg(actionId, await encryped)

  // Using Flight to deserialize the args from the string.
  const deserialized = await createFromReadableStream(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(decryped))
        controller.close()
      },
    }),
    {
      ssrManifest: {
        // TODO: We can't use the client reference manifest to resolve the modules
        // on the server side - instead they need to be recovered as the module
        // references (proxies) again.
        // For now, we'll just use an empty module map.
        moduleLoading: {},
        moduleMap: {},
      },
    }
  )

  return deserialized
}
