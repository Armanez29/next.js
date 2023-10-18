import type { IncomingMessage, ServerResponse } from 'http'
import type { StackFrame } from 'stacktrace-parser'
import type { ParsedUrlQuery } from 'querystring'
import type { OriginalStackFrameResponse } from './middleware'

import fs, { constants as FS } from 'fs/promises'
import url from 'url'
import { codeFrameColumns } from '@babel/code-frame'
import { launchEditor } from './internal/helpers/launchEditor'

interface Project {
  traceSource(stackFrame: RustStackFrame): Promise<
    | {
        frame: RustStackFrame
        source: string
      }
    | undefined
  >
}

interface RustStackFrame {
  file: string
  methodName: string | undefined
  line: number
  column: number | undefined
}

export async function createOriginalStackFrame(
  project: Project,
  frame: StackFrame
): Promise<OriginalStackFrameResponse | null> {
  const source = await project.traceSource({
    file: frame.file ?? '<unknown>',
    methodName: frame.methodName,
    line: frame.lineNumber ?? 0,
    column: frame.column ?? undefined,
  })

  if (!source) {
    return null
  }

  return {
    originalStackFrame: {
      file: source.frame.file,
      lineNumber: source.frame.line,
      column: source.frame.column ?? null,
      methodName: source.frame.methodName ?? frame.methodName,
      arguments: [],
    },
    originalCodeFrame: source.frame.file.includes('node_modules')
      ? null
      : codeFrameColumns(
          source.source,
          {
            start: {
              line: source.frame.line,
              column: source.frame.column ?? 0,
            },
          },
          { forceColor: true }
        ),
  }
}

function stackFrameFromQuery(query: ParsedUrlQuery): StackFrame {
  return {
    file: query.file as string,
    methodName: query.methodName as string,
    arguments: query.arguments as string[],
    lineNumber:
      typeof query.lineNumber === 'string'
        ? parseInt(query.lineNumber, 10)
        : null,
    column:
      typeof query.column === 'string' ? parseInt(query.column, 10) : null,
  }
}

export function getOverlayMiddleware(project: Project) {
  return async function (req: IncomingMessage, res: ServerResponse) {
    const { pathname, query } = url.parse(req.url!, true)
    if (pathname === '/__nextjs_original-stack-frame') {
      const frame = stackFrameFromQuery(query)
      let originalStackFrame
      try {
        originalStackFrame = await createOriginalStackFrame(project, frame)
      } catch (e: any) {
        res.statusCode = 500
        res.write(e.message)
        res.end()
        return
      }

      if (originalStackFrame === null) {
        res.statusCode = 404
        res.write('Unable to resolve sourcemap')
        res.end()
        return
      }

      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.write(Buffer.from(JSON.stringify(originalStackFrame)))
      res.end()
      return
    } else if (pathname === '/__nextjs_launch-editor') {
      const frame = stackFrameFromQuery(query)

      const filePath = frame.file?.toString()
      if (filePath === undefined) {
        res.statusCode = 400
        res.write('Bad Request')
        res.end()
        return
      }

      const fileExists = await fs.access(filePath, FS.F_OK).then(
        () => true,
        () => false
      )
      if (!fileExists) {
        res.statusCode = 204
        res.write('No Content')
        res.end()
        return
      }

      try {
        launchEditor(filePath, frame.lineNumber ?? 1, frame.column ?? 1)
      } catch (err) {
        console.log('Failed to launch editor:', err)
        res.statusCode = 500
        res.write('Internal Server Error')
        res.end()
        return
      }

      res.statusCode = 204
      res.end()
    }
  }
}
