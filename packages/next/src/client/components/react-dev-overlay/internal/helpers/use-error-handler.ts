import { useEffect } from 'react'
import { attachHydrationErrorState } from './attach-hydration-error-state'
import { isNextRouterError } from '../../../is-next-router-error'
import { storeHydrationErrorStateFromConsoleArgs } from './hydration-error-info'
import { formatConsoleArgs } from '../../../../lib/console'
import isError from '../../../../../lib/is-error'
import { createUnhandledError } from './console-error'
import { enqueueConsecutiveDedupedError } from './enqueue-client-error'
import { stripAfterReactBottomFrame } from './stitched-error'

export type ErrorHandler = (error: Error) => void

const errorQueue: Array<Error> = []
const errorHandlers: Array<ErrorHandler> = []
const rejectionQueue: Array<Error> = []
const rejectionHandlers: Array<ErrorHandler> = []

export function handleClientError(
  originError: unknown,
  consoleErrorArgs: any[],
  originStack?: string
) {
  let error: Error
  if (!originError || !isError(originError)) {
    // If it's not an error, format the args into an error
    const formattedErrorMessage = formatConsoleArgs(consoleErrorArgs)
    error = createUnhandledError(formattedErrorMessage)
    // When the originStack is provided, strip the stack after the react-bottom-stack-frame
    if (originStack) {
      error.stack = stripAfterReactBottomFrame(originStack)
    }
  } else {
    error = originError
  }

  storeHydrationErrorStateFromConsoleArgs(...consoleErrorArgs)
  attachHydrationErrorState(error)

  enqueueConsecutiveDedupedError(errorQueue, error)
  for (const handler of errorHandlers) {
    handler(error)
  }
}

export function useErrorHandler(
  handleOnUnhandledError: ErrorHandler,
  handleOnUnhandledRejection: ErrorHandler
) {
  useEffect(() => {
    // Handle queued errors.
    errorQueue.forEach(handleOnUnhandledError)
    rejectionQueue.forEach(handleOnUnhandledRejection)

    // Listen to new errors.
    errorHandlers.push(handleOnUnhandledError)
    rejectionHandlers.push(handleOnUnhandledRejection)

    return () => {
      // Remove listeners.
      errorHandlers.splice(errorHandlers.indexOf(handleOnUnhandledError), 1)
      rejectionHandlers.splice(
        rejectionHandlers.indexOf(handleOnUnhandledRejection),
        1
      )
    }
  }, [handleOnUnhandledError, handleOnUnhandledRejection])
}

function onUnhandledError(event: WindowEventMap['error']): void | boolean {
  if (isNextRouterError(event.error)) {
    event.preventDefault()
    return false
  }
  handleClientError(event.error, [])
}

function onUnhandledRejection(ev: WindowEventMap['unhandledrejection']): void {
  const reason = ev?.reason
  if (isNextRouterError(reason)) {
    ev.preventDefault()
    return
  }

  let error = reason
  if (error && !isError(error)) {
    error = createUnhandledError(error + '')
  }

  rejectionQueue.push(error)
  for (const handler of rejectionHandlers) {
    handler(error)
  }
}

export function handleGlobalErrors() {
  if (typeof window !== 'undefined') {
    try {
      // Increase the number of stack frames on the client
      Error.stackTraceLimit = 50
    } catch {}

    window.addEventListener('error', onUnhandledError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
  }
}
