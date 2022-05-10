export default async function transformSource(this: any): Promise<string> {
  let { modules } = this.getOptions()
  if (!Array.isArray(modules)) {
    modules = modules ? [modules] : []
  }

  return (
    modules
      .map(
        (request: string) => `import(/* webpackMode: "eager" */ '${request}')`
      )
      .join(';') +
    `
    export const __next_rsc__ = {
      server: false,
      __webpack_require__
    };
    export default function RSC() {};`
  )
}
