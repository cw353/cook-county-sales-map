const map = new L.Map('map', {
  center: { lat: 41.76388, lng: -87.74898 },
  zoom: 9.5,
  zoomDelta: 0.5,
  zoomSnap: 0.5,
  zoomControl: false,
  attributionControl: false,
});
L.control.attribution({ position: "bottomright" })
  .addAttribution("&copy; <a href='https://github.com/cw353/'>Claire Wagner</a>")
  .addTo(map);

const osmtiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "<a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
}).addTo(map);

const usd_formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const count_formatter = new Intl.NumberFormat('en-US');

const numeric_value = function (value) {
  const parsed = parseFloat(value);
  return parsed;
}
const numeric_display = function (value, formatter) {
  return value ? formatter.format(value) : "unknown";
}

class Feature {
  constructor(label, get_value, display, d3_format) {
    this.label = label;
    this.get_value = get_value;
    this.display = display;
    this.d3_format = d3_format;
  }
  getLabel() {
    return this.label;
  }
  getValue(val) {
    return this.get_value(val);
  }
  getD3Format() {
    return this.d3_format;
  }
  display(val) {
    return this.get_display(val);
  }
}
class USDFeature extends Feature {
  constructor(label) {
    super(label, numeric_value, (val) => numeric_display(val, usd_formatter), ":$,");
  }
}
class CountFeature extends Feature {
  constructor(label) {
    super(label, numeric_value, (val) => numeric_display(val, count_formatter), ":,");
  }
}

function getFeatureValue(props, data) {
  const featureKey = props.nbhd_code;
  const val = data[featureKey] && data[featureKey][state.year] ? data[featureKey][state.year][state.stat] : null;
  return state._statProps.getValue ? state._statProps.getValue(val) : val;
}

// Get colors and limits for a choropleth map
// PRECONDITION: all data that will be displayed on the map has been rounded to the nearest integer.
/* Portions of this function are based on https://github.com/timwis/leaflet-choropleth (MIT License) */
function getChoroplethProps(layer, data, getValue, options = null) {
  // overwrite default options with provided options (if any)
  // note: opts.steps is the number of intervals that the function will aim to create,
  // but depending on the range of the data, a smaller number of intervals may be returned
  const opts = Object.assign({
    mode: 'q', steps: 10, scale: 'viridis'
  }, options);
  const values = [];
  layer.eachLayer(function (sublayer) {
    values.push(getValue(sublayer.feature.properties, data));
  });
  // get opts.steps limits and opts.steps-1 colors from chroma
  // (truncate limits under the assumption that all data has been rounded to the nearest integer to simplify interpretation)
  const chromaLimits = chroma.limits(values, opts.mode, opts.steps).map((limit) => Math.trunc(limit));
  const chromaColors = chroma.scale(opts.scale).colors(chromaLimits.length - 1);
  // keep only non-duplicated limits (and their corresponding colors)
  // if a value is less than or equal to limits[i+1], it should receive the color colors[i]
  const limits = [chromaLimits[0]];
  const colors = [];
  for (let i = 0; i < chromaLimits.length - 1; i++) {
    if (chromaLimits[i + 1] !== limits[limits.length - 1]) {
      limits.push(chromaLimits[i + 1]);
      colors.push(chromaColors[i]);
    }
  }
  return [limits, colors];
}

const propertyClasses = {
  2: { name: "Major Class 2", desc: "Residential" },
  3: { name: "Major Class 3", desc: "Multi-Family" },
  9: { name: "Major Class 9", desc: "Class 3 Multi-Family Residential Real Estate Incentive" },
};

const saleStats = {
  mean: new USDFeature("Average Sale Price"),
  median: new USDFeature("Median Sale Price"),
  min: new USDFeature("Minimum Sale Price"),
  max: new USDFeature("Maximum Sale Price"),
  count: new CountFeature("Number of Sales"),
};

const initialPropertyClass = "2";
const initialStat = "mean";
const state = {
  layer: null,
  year: sales_years[0],
  propertyClass: initialPropertyClass,
  _propertyClassProps: propertyClasses[initialPropertyClass],
  featureKey: null,
  stat: initialStat,
  _statProps: saleStats[initialStat],
  choroplethData: sales_by_nbhd[initialPropertyClass],
  summaryData: sales_totals[initialPropertyClass],
  years: sales_years,
  _limits: null,
  _colors: null,
  opacity: 0.7,
};
function updateChoropleth() {
  // TODO: add caching for limits and colors?
  [state._limits, state._colors] = getChoroplethProps(state.layer, state.choroplethData, getFeatureValue);
  // update fill colors on map
  state.layer.setStyle(function (feature) {
    const val = getFeatureValue(feature.properties, state.choroplethData);
    let fillColor = null;
    if (val != null && !isNaN(val)) {
      for (let i = 0; i < state._limits.length - 1; i++) {
        if (val <= state._limits[i + 1]) {
          fillColor = state._colors[i];
          break;
        }
      }
    }
    return { fillColor: fillColor };
  });
}
/* This function is based on https://leafletjs.com/examples/choropleth/ (BSD 2-Clause "Simplified" License) */
function highlightFeature(layer) {
  layer.setStyle({
    weight: 5,
    color: 'black',
  }).bringToFront();
}
const defaultStyle = {
  color: '#fff',
  weight: 2,
};

// callbacks to be called when the corresponding prop in state is changed
// additional callbacks can be added by calling registerStateCallback
const stateCallbacks = {
  propertyClass: [
    function (val) {
      state._propertyClassProps = propertyClasses[val];
      state.summaryData = sales_totals[val];
      state.choroplethData = sales_by_nbhd[val];
    },
    updateChoropleth,
  ],
  year: [
    updateChoropleth
  ],
  stat: [
    function (val) {
      state._statProps = saleStats[val];
    },
    updateChoropleth
  ],
  featureKey: [
    function (val) {
      // reset all sublayers to default style
      state.layer.setStyle(defaultStyle);
      // highlight the feature that has been selected
      if (val != null) {
        for (const sublayer of state.layer.getLayers()) {
          if (sublayer.feature.properties.nbhd_code === val) {
            highlightFeature(sublayer);
            break;
          }
        };
      }
    },
  ],
  opacity: [
    function (val) {
      state.layer.setStyle({ opacity: val, fillOpacity: val });
    }
  ]
}

// Add a callback to stateCallbacks
function registerStateCallback(prop, callback) {
  if (stateCallbacks[prop] == null) {
    stateCallbacks[prop] = [];
  }
  stateCallbacks[prop].push(callback);
}

// Update state and call any associated callbacks
function updateState(prop, val) {
  state[prop] = val;
  if (prop in stateCallbacks) {
    stateCallbacks[prop].forEach(function (callback) { callback(val); })
  }
}

state.layer = L.geoJSON(
  neighborhoods,
  {
    attribution: "<a href='https://www.cookcountyassessor.com/'>Cook County Assessor's Office</a> (<a href='https://datacatalog.cookcountyil.gov/d/pcdw-pxtg'>Neighborhood Boundaries</a> & <a href='https://datacatalog.cookcountyil.gov/d/wvhk-k5uv'>Parcel Sales</a>)",
    style: Object.assign({ opacity: state.opacity, fillOpacity: state.opacity }, defaultStyle),
  }
).addTo(map);
state.layer.eachLayer(function (sublayer) {
  sublayer.on({
    click: function (e) {
      // stop event propagation so that clicks on this layer will not be handled
      // by the same event handler as clicks elsewhere on the map
      L.DomEvent.stopPropagation(e);
      const featureKey = sublayer.feature.properties.nbhd_code;
      // first click in a row selects this feature, second click in a row deselects it
      updateState("featureKey", state.featureKey === featureKey ? null : featureKey);
    },
  });
});

// if a feature has been selected, clicking on the map outside of the layer deselects it
map.on("click", function () {
  if (state.featureKey != null) {
    updateState("featureKey", null);
  }
});

/* Portions of this control are based on https://leafletjs.com/examples/choropleth/ (BSD 2-Clause "Simplified" License) */
const infoControl = L.control({ position: "topleft" });
infoControl.onAdd = function(map) {
  const container = L.DomUtil.create("div", "custom-control info container");
  container.setAttribute("id", "info-control");
  L.DomEvent.disableClickPropagation(container);
  L.DomEvent.disableScrollPropagation(container);
  this._headerDiv = L.DomUtil.create("div", "info header", container);
  this._contentsDiv = L.DomUtil.create("div", "info contents", container);
  return container;
};
infoControl.update = function () {
  // Add header
  this._headerDiv.innerHTML = state.featureKey == null ? "<h4>Summary of<br>All Assessor Neighborhoods</h4>" : `<h4>Details for<br>Assessor Neighborhood ${state.featureKey}</h4>`;
  // Add info about how to toggle view between summary of all areas and details of specific area
  if (state.featureKey == null) {
    this._contentsDiv.innerHTML = "<p class='italic'>Click on an area to see details.</p>";
  } else {
    this._contentsDiv.innerHTML = "<p class='italic'>Click on this area again to deselect it<br>(or click elsewhere on the map).</p>"
  }
  // Add data items
  const data = state.featureKey == null ? state.summaryData : state.choroplethData[state.featureKey];
  const items = [
    `<b>Year</b>: ${state.year}`,
    `<b>Property Class</b>: <a class='external' href='https://www.cookcountyassessor.com/form-document/codes-classification-property'>${state._propertyClassProps.name}</a>`
  ];
  for (const stat in saleStats) {
    const statProps = saleStats[stat];
    items.push(`<b>${statProps.getLabel()}</b>: ${statProps.display(data && data[state.year] ? data[state.year][stat] : null)}`);
  }
  this._contentsDiv.innerHTML += items.join("<br>");
  // Add link to source data
  let query = `https://datacatalog.cookcountyil.gov/resource/wvhk-k5uv.json?$where=starts_with(class, '${state.propertyClass}') AND year=${state.year}`;
  if (state.featureKey != null) {
    query += ` AND nbhd_code='${state.featureKey}'`;
  }
  query += "&$limit=1000000000";
  this._contentsDiv.innerHTML += `<p><a class='external' href="${query}">View source data</a></p>`;
};
for (const prop of ["propertyClass", "featureKey", "year", "stat"]) {
  registerStateCallback(prop, infoControl.update.bind(infoControl));
}

const nbhdOptGroups = Object.entries(townships_nbhds).map(function ([township, nbhds]) {
  return `<optgroup label='${township} Township'>` +
    nbhds.map(function (nbhd) { return `<option>${nbhd}</option>` }).join("") +
    "</optgroup>";
});

const dataSelectControl = L.control({ position: "topright" });
dataSelectControl.onAdd = function (map) {
  const container = L.DomUtil.create("div", "custom-control data-select container");
  container.setAttribute("id", "data-select-control");
  L.DomEvent.disableClickPropagation(container);
  L.DomEvent.disableScrollPropagation(container);
  this._headerDiv = L.DomUtil.create("div", "data-select header", container);
  this._contentsDiv = L.DomUtil.create("div", "data-select contents", container);
  this._headerDiv.innerHTML = "<h4>Select Data to Display</h4>";
  const selectClass = $("<select id='select-class'></select>")
    .html(Object.entries(propertyClasses).map(function ([propertyClass, props]) {
      return `<option value="${propertyClass}">${props.name} (${props.desc})</option>`;
    }))
    .val(state.propertyClass)
    .on("change", function (e) {
      updateState("propertyClass", e.target.value);
    });
  const selectNbhd = $("<select id='select-nbhd'></select>")
    .html([
      "<option>All Assessor Neighborhoods</option>",
      nbhdOptGroups,
    ])
    .val("All Assessor Neighborhoods")
    .on("change", function (e) {
      updateState("featureKey", e.target.value === "All Assessor Neighborhoods" ? null : e.target.value);
    });
  // ensure that the value of selectNbhd will always match state.featureKey
  registerStateCallback("featureKey", (val) => {
    const newVal = val === null ? "All Assessor Neighborhoods" : val;
    if (selectNbhd.val() !== newVal) {
      selectNbhd.val(newVal);
    }
  });
  const selectStat = $("<select id='select-stat'></select>")
    .html(Object.entries(saleStats).map(function ([stat, statProps]) {
      return `<option value="${stat}">${statProps.getLabel()}</option>`;
    }))
    .val(state.stat)
    .on("change", function (e) {
      updateState("stat", e.target.value);
    });
  $(this._contentsDiv).append([
    $("<div class='select-div'></div>").append([
      `<label for="select-stat">Select Property Class:</label>`,
      selectClass,
    ]),
    $("<div class='select-div'></div>").append([
      `<label for="select-nbhd">Select Assessor Neighborhood:</label>`,
      selectNbhd,
    ]),
    $("<div class='select-div'></div>").append([
      `<label for="select-stat">Select Statistic:</label>`,
      selectStat,
    ]),
  ]);
  return container;
}

/* Portions of this control are based on https://leafletjs.com/examples/choropleth/ (BSD 2-Clause "Simplified" License) */
const legend = L.control({ position: "bottomleft" });
legend.onAdd = function (map) {
  const container = L.DomUtil.create("div", "custom-control legend");
  L.DomEvent.disableClickPropagation(container);
  L.DomEvent.disableScrollPropagation(container);
  return container;
}
legend.update = function (colors = null, labels = null, title = "Legend") {
  if (colors == null || labels == null || colors.length !== labels.length) {
    this._container.innerHTML = "";
  } else {
    this._container.innerHTML = `<h4>${title}</h4>`;
    for (let i = 0; i < colors.length; i++) {
      this._container.innerHTML += `<i style="background: ${colors[i]}"></i> ${labels[i]}<br>`;
    }
  }
};
const updateLegend = function () {
  const display_func = null;
  const labels = ["unknown"];
  for (let i = 0; i < state._colors.length; i++) {
    const lower_limit = i === 0 ? state._limits[i] : state._limits[i] + 1;
    const upper_limit = state._limits[i + 1];
    let label = state._statProps.display(lower_limit);
    if (upper_limit !== lower_limit) {
      label += " &ndash; " + state._statProps.display(upper_limit);
    }
    labels.push(label);
  }
  legend.update([null].concat(state._colors), labels, state._statProps.getLabel());
}
for (const prop of ["propertyClass", "year", "stat"]) {
  registerStateCallback(prop, updateLegend);
}

const graphControl = L.control({ position: "topright" });
graphControl.onAdd = function (map) {
  const container = L.DomUtil.create("div", "custom-control graph");
  for (const div of ["_titleDiv", "_scatterDiv", "_selectDiv"]) {
    this[div] = L.DomUtil.create("div", "graph-subdiv", container);
  }
  // the main trace (trace 0) is controlled by alterations to state.featureKey
  // the extra traces (traces 1 through this._numExtraTraces-1) are controlled by select elements
  this._numExtraTraces = 2; // number of extra traces
  this._extraNbhds = new Array(this._numExtraTraces).fill(null); // track neighborhoods for extra traces
  this._initPlot();
  // add select elements to select neighborhoods for extra traces
  for (let i = 0; i < this._numExtraTraces; i++) {
    $(this._selectDiv).append(
      $("<div class='select-div'></div>").append([
        `<label class='italic' for="select-trace${i + 2}">Add ${i + 2}${i + 2 === 2 ? "nd" : i + 2 === 3 ? "rd" : "th"} neighborhood to graph:</label>`,
        $(`<select id='select-trace${i + 2}'></select>`)
          .html([
            "<option>None</option>",
            "<option>All Assessor Neighborhoods</option>",
            nbhdOptGroups,
          ])
          .val("None")
          .on("change", (e) => {
            const val = e.target.value;
            if (val === "None") {
              this._extraNbhds[i] = null;
              this._hideTrace(i + 1);
            } else {
              this._extraNbhds[i] = val;
              this._updateTrace(val, i + 1);
            }
          })
      ])
    );

  }
  this.updateTitle();
  this.updateMainTrace();
  L.DomEvent.disableClickPropagation(container);
  L.DomEvent.disableScrollPropagation(container);
  return container;
};
graphControl._initPlot = function () {
  const numTraces = 1 + this._numExtraTraces;
  const traces = new Array(numTraces);
  for (let i = 0; i < 1 + numTraces; i++) {
    traces[i] = ({
      x: [], y: [],
      visible: false, // initially hidden
      showlegend: true,
      hoverlabel: { align: "left" },
    });
  }
  const layout = {
    width: 350, height: 225,
    margin: { b: 0, l: 50, r: 35, t: 35 },
    xaxis: { automargin: true, title: { text: "YEAR", font: { size: 11, }, standoff: 0, }, tickfont: { size: 10 }, dtick: 2, range: [state.years[0] - 0.75, state.years[state.years.length - 1] + 0.75] },
    yaxis: { automargin: true, title: { font: { size: 11, } }, tickfont: { size: 10 } },
    title: { font: { family: "Arial", size: 13, color: "#555" } },
    legend: { orientation: "h", y: -0.25, yanchor: "top", x: 0.5, xanchor: "center" },
    hovermode: "x unified",
    paper_bgcolor: 'rgba(255,255,255,0.8)',
    plot_bgcolor: 'rgba(255,255,255,0)',
    modebar: { orientation: 'v', remove: ["select2d", "lasso2d",] },
  };
  Plotly.newPlot(this._scatterDiv,
    traces,
    layout,
    {
      scrollZoom: true,
      displayModeBar: true,
      displaylogo: false,
      toImageButtonOptions: { filename: 'cook_county_sales_scatterplot' }
    }
  );
}
graphControl.updateTitle = function () {
  this._titleDiv.innerHTML = `<h4>Trends in Major Class ${state.propertyClass} Property Sales<br>for Cook County Assessor Neighborhoods</h4>`;
}
graphControl._hideTrace = function (traceIndex) {
  Plotly.update(this._scatterDiv, { visible: false, }, {}, [traceIndex]);
}
graphControl._updateTrace = function (nbhd, traceIndex) {
  const data = nbhd === "All Assessor Neighborhoods" ? state.summaryData : state.choroplethData[nbhd];
  const x = [];
  const y = [];
  // plot only non-null data points
  for (const year of state.years) {
    if (data && data[year]) {
      x.push(year);
      y.push(data[year][state.stat]);
    }
  }
  // if no data was found, populate x and y with null
  // to trick plotly into showing this trace on the legend
  if (x.length === 0) {
    x.push(null);
    y.push(null);
  }
  const ylabel = state._statProps.getLabel();
  const dataProps = {
    x: [x], y: [y],
    visible: true, // make visible if hidden
    name: nbhd === "All Assessor Neighborhoods" ? "overall" : nbhd,
    hovertemplate: `%{y${state._statProps.getD3Format()}}`,
  };
  const layoutProps = {
    'yaxis.title.text': ylabel.toUpperCase(),
    'title.text': `Yearly Trend in ${ylabel}`,
  };
  Plotly.update(this._scatterDiv, dataProps, layoutProps, [traceIndex]);
}
graphControl.updateMainTrace = function () {
  this._updateTrace(state.featureKey == null ? "All Assessor Neighborhoods" : state.featureKey, 0);
}
graphControl.updateExtraTraces = function () {
  for (let i = 0; i < this._numExtraTraces; i++) {
    if (this._extraNbhds[i] != null) {
      this._updateTrace(this._extraNbhds[i], i + 1);
    }
  }
}
registerStateCallback("featureKey", graphControl.updateMainTrace.bind(graphControl));
registerStateCallback("propertyClass", graphControl.updateTitle.bind(graphControl));
for (const prop of ["propertyClass", "stat"]) {
  registerStateCallback(prop, function() {
    graphControl.updateMainTrace.bind(graphControl).call();
    graphControl.updateExtraTraces.bind(graphControl).call();
  });
}

const opacityControl = L.control.opacity(
  { "<div class='opacity-control-label'>Layer Opacity</div>": state.layer },
  {
    position: "bottomleft",
    initialOpacity: state.opacity,
    updateOpacity: (layer, opacity) => updateState("opacity", opacity),
  },
);

const timelineControl = L.control.timelineSlider({
  initializeChange: true, // run changeMap when timeline is first loaded
  position: "bottomright",
  timelineItems: state.years,
  changeMap: function ({ label, index, map }) {
    updateState("year", label);
  }
});

/* This control is based on https://github.com/cw353/hei-map-project/blob/main/code/map/map_controls.js (MIT License) */
const geocoderControl = L.Control.geocoder({
  placeholder: "Search for a location...",
  errorMessage: "No results found.",
  showUniqueResult: false,
  defaultMarkGeocode: false,
  position: "topright",
  collapsed: false,
}).on("markgeocode", function (e) {
  if (e.geocode && e.geocode.center) {
    map.setView(e.geocode.center, map.getMaxZoom());
    const div = L.DomUtil.create("div", "center");
    div.innerHTML = e.geocode.html;
    L.popup().setLatLng(e.geocode.center).setContent(div).openOn(map);
  }
});

// add controls in order
// note that adding timelineSlider sets state.year to state.years[0] and thus initializes the rest of the map

// topleft
new L.Control.Bookmarks({ position: "topleft" }).addTo(map);
L.Control.zoomHome({ position: "topleft", zoomHomeTitle: "Zoom to default view" }).addTo(map);
infoControl.addTo(map);
// bottomleft
opacityControl.addTo(map);
legend.addTo(map);
// topright
dataSelectControl.addTo(map);
graphControl.addTo(map);
geocoderControl.addTo(map);
// bottomright
timelineControl.addTo(map); // bottomright

// disable event propagation for geocoder control
L.DomEvent.disableClickPropagation(geocoderControl._container);
L.DomEvent.disableScrollPropagation(geocoderControl._container);