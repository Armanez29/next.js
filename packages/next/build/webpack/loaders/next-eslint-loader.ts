// @ts-ignore
import getOptions from './eslint-loader/get-options'
import cacheLoader from './eslint-loader/cache-loader'
import { loader } from 'webpack'
// eslint-disable-next-line import/no-extraneous-dependencies
import { RawSourceMap } from 'source-map'
import { Linter } from './eslint-loader/linter'

const fn: loader.Loader = function (
  content: string | Buffer,
  map?: RawSourceMap
) {
  const options = getOptions(this)
  const linter = new Linter(this, {
    ...options,
    cwd: this._compiler.options.context,
  })

  this.cacheable()

  // return early if cached
  // @ts-ignore
  if (options.cache) {
    cacheLoader(linter, content.toString(), map)
    return
  }
  const { report, ast } = linter.lint(content)
  report && linter.printOutput(report)
  /// @ts-ignore
  this.callback(null, content, map, { sharedBabelAST: ast })
}

export default fn
