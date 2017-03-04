module.exports = {
  webpack: function (config) {
    config.resolve.alias = {
      'react': 'preact-compat/dist/preact-compat',
      'react-dom': 'preact-compat/dist/preact-compat'
    }

    // Disable uglify. This has been fixed in https://github.com/developit/preact-compat/issues/155.
    // Can be removed once there is a new preact-compat release.
    config.plugins = config.plugins.filter((plugin) => {
      if (plugin.constructor.name === 'UglifyJsPlugin') {
        return false
      } else {
        return true
      }
    })
    return config
  }
}
