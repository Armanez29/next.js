import webpack from 'webpack'
import MiniCssExtractPlugin from '../../../../plugins/mini-css-extract-plugin'

export function getClientStyleLoader({
  isDevelopment,
  assetPrefix,
}: {
  isDevelopment: boolean
  assetPrefix: string
}): webpack.RuleSetUseItem {
  return isDevelopment
    ? {
        loader: require.resolve('style-loader'),
        options: {
          // By default, style-loader injects CSS into the bottom
          // of <head>. This causes ordering problems between dev
          // and prod. To fix this, we render a <noscript> tag as
          // an anchor for the styles to be placed before. These
          // styles will be applied _before_ <style jsx global>.
          insert: function(element: Element) {
            // These elements should always exist. If they do not,
            // this code should fail.
            var anchorElement = document.querySelector(
              '#__next_css__DO_NOT_USE__'
            )!

            // Append each script element immediately after the
            // placholder. This preserves the ordering of CSS
            // modules relative to production.
            anchorElement.insertAdjacentElement('afterend', element);

            // Remember: this is development only code.
            //
            // After styles are injected, we need to remove the
            // <style> tags that set `body { display: none; }`.
            //
            // We use `requestAnimationFrame` as a way to defer
            // this operation since there may be multiple style
            // tags.
            ;(self.requestAnimationFrame || setTimeout)(function() {
              for (
                var x = document.querySelectorAll('[data-next-hide-fouc]'),
                  i = x.length;
                i--;

              ) {
                x[i].parentNode!.removeChild(x[i])
              }
            })
          },
        },
      }
    : {
        loader: MiniCssExtractPlugin.loader,
        options: { publicPath: `${assetPrefix}/_next/` },
      }
}
