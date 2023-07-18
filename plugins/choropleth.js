L.choropleth = function (geojson, opts) {
  opts = opts || {}

  // Set default options in case any weren't passed
  _.defaults(opts, {
    valueProperty: 'value',
    scale: ['white', 'red'],
    steps: 5,
    mode: 'q'
  })

  // Save what the user passed as the style property for later use (since we're overriding it)
  var userStyle = opts.style

  // Calculate limits
  var values = geojson.features.map(
    typeof opts.valueProperty === 'function' ?
    opts.valueProperty :
    function (item) {
      return item.properties[opts.valueProperty]
    })
  var limits = chroma.limits(values, opts.mode, opts.steps)

  // Create color buckets
  var colors = (opts.colors && opts.colors.length === limits.length ?
                opts.colors :
                chroma.scale(opts.scale).colors(limits.length-1))

  return L.geoJson(geojson, _.extend(opts, {
    limits: limits,
    colors: colors,
    style: function (feature) {
      var style = {}
      var featureValue

      if (typeof opts.valueProperty === 'function') {
        featureValue = opts.valueProperty(feature)
      } else {
        featureValue = feature.properties[opts.valueProperty]
      }

      if (!isNaN(featureValue)) {
        // Find the bucket/step/limit that this value is less than and give it that color
        for (var i = 0; i < limits.length-1; i++) {
          if (featureValue <= limits[i+1]) {
            style.fillColor = colors[i]
            break
          }
        }
      } else {
        style.fillColor = null;
      }

      // Return this style, but include the user-defined style if it was passed
      switch (typeof userStyle) {
        case 'function':
          return _.defaults(style, userStyle(feature))
        case 'object':
          return _.defaults(style, userStyle)
        default:
          return style
      }
    }
  }))
}
