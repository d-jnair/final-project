// filepath: main.js
// Single–file main.js
// Features:
//   • Top dropdown: choose continent (Africa, N. America, S. America, Asia, Oceania, Europe)
//   • Bottom-left dropdown: optional country filter within that continent
//   • Month slider + play / reset controls
//   • FRP-only fire visualization (no brightness toggle), with legend
// Requires in index.html:
//   - <svg id="map"></svg>
//   - <canvas id="dots"></canvas>
//   - <select id="continent-selector"></select>
//   - <span id="month-label"></span>
//   - <input id="month-slider" type="range" min="1" max="12" step="1">
//   - <button id="play-btn"></button>
//   - <button id="reset-btn"></button>
// And d3 + topojson-client scripts loaded.

console.log("Main JS is running!");

// ---------- DOM + layout ----------
const svg = (typeof d3 !== "undefined") ? d3.select("#map") : null;
const canvas = document.getElementById("dots");
const ctx = canvas ? canvas.getContext("2d") : null;

if (svg) {
  svg
    .style("position", "absolute")
    .style("top", "0px")
    .style("left", "0px")
    .style("width", "100%")
    .style("height", "100%");
}

if (canvas) {
  canvas.style.position = "absolute";
  canvas.style.top = "0px";
  canvas.style.left = "0px";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
}

// ---------- Data: continents / countries ----------
const CONTINENT_DATA = {
  "Africa": [
    "Algeria","Angola","Benin","Botswana","Burkina Faso","Burundi","Cameroon",
    "Cape Verde","Central African Republic","Chad","Comoros","Cote d Ivoire",
    "Democratic Republic of the Congo","Djibouti","Egypt","Equatorial Guinea",
    "Eritrea","Ethiopia","Gabon","Ghana","Guinea-Bissau","Guinea","Kenya",
    "Lesotho","Liberia","Libya","Madagascar","Malawi","Mali","Mauritania",
    "Mauritius","Mayotte","Morocco","Mozambique","Namibia","Niger","Nigeria",
    "Congo","Reunion","Rwanda","Saint Helena","Sao Tome and Principe",
    "Senegal","Seychelles","Sierra Leone","Somalia","South Africa",
    "South Sudan","Sudan","eSwatini","Tanzania","The Gambia","Togo",
    "Tunisia","Uganda","Zambia","Zimbabwe"
  ],
  "North America": [
    "Antigua and Barbuda","Aruba","Bahamas","Barbados","Belize","Canada",
    "Cayman Islands","Costa Rica","Cuba","Curacao","Dominica",
    "Dominican Republic","El Salvador","Greenland","Guadeloupe","Guatemala",
    "Haiti","Honduras","Jamaica","Martinique","Mexico","Montserrat",
    "Nicaragua","Panama","Puerto Rico","Saint Kitts and Nevis","Saint Lucia",
    "Saint Vincent and the Grenadines","Trinidad and Tobago",
    "United States of America","United States Minor Outlying Islands"
  ],
  "South America": [
    "Argentina","Bolivia","Brazil","Chile","Colombia","Ecuador",
    "French Guiana","Guyana","Paraguay","Peru","Suriname","Uruguay","Venezuela"
  ],
  "Asia": [
    "Afghanistan","Armenia","Azerbaijan","Bahrain","Bangladesh","Bhutan","Brunei",
    "Cambodia","China","Cyprus","North Korea","Georgia","Hong Kong","India",
    "Indonesia","Iran","Iraq","Israel","Japan","Jordan","Kazakhstan","Kuwait",
    "Kyrgyzstan","Laos","Lebanon","Malaysia","Maldives","Mongolia","Myanmar",
    "Nepal","Oman","Pakistan","Palestine","Philippines","Qatar","South Korea",
    "Saudi Arabia","Singapore","Sri Lanka","Syria","Taiwan","Tajikistan",
    "Thailand","Timor-Leste","Turkey","Turkmenistan","United Arab Emirates",
    "Uzbekistan","Vietnam","Yemen"
  ],
  "Oceania": [
    "American Samoa","Australia","Fiji","French Polynesia","Guam",
    "Heard I and McDonald Islands","New Caledonia","New Zealand",
    "Northern Mariana Islands","Papua New Guinea","Samoa",
    "Solomon Islands","Tonga","Vanuatu"
  ],
  "Europe": [
    "Albania","Andorra","Austria","Belarus","Belgium","Bosnia and Herzegovina",
    "Bulgaria","Croatia","Czech Republic","Denmark","Estonia","Finland","France",
    "Germany","Greece","Hungary","Iceland","Ireland","Italy","Kosovo","Latvia",
    "Lithuania","Luxembourg","Macedonia","Malta","Moldova","Montenegro",
    "Netherlands","Norway","Poland","Portugal","Romania","Russia","Serbia",
    "Slovakia","Slovenia","Spain","Sweden","Switzerland","Ukraine",
    "United Kingdom"
  ]
};

// For topojson name matching; using same names here
const CONTINENT_MAP = Object.assign({}, CONTINENT_DATA);

// ---------- Global state ----------
let allData = {};            // { continent: [rows...] }
let activeContinent = "Africa";
let activeCountry = null;    // null = all countries in continent
let activeMonth = 1;         // 1–12
const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const topSelect   = document.getElementById("continent-selector");
const monthSlider = document.getElementById("month-slider");
const playBtn     = document.getElementById("play-btn");
const resetBtn    = document.getElementById("reset-btn");
let playInterval  = null;

// ---------- Helper: CSV file paths ----------
function getFilePathsForContinent(continent) {
  const countries = CONTINENT_DATA[continent] || [];
  return countries.map(c =>
    `modis_2024_all_countries/modis/2024/modis_2024_${c.replace(/ /g, "_")}.csv`
  );
}

// ---------- Helper: FRP metric only ----------
function getMetricValue(row) {
  if (!row) return undefined;

  const frpKeys = [
    "FRP","frp","frp_val","frp50",
    "fire_radiative_power","frp_mw"
  ];

  for (const k of frpKeys) {
    if (Object.prototype.hasOwnProperty.call(row, k) &&
        row[k] !== "" && row[k] !== undefined) {
      const n = Number(row[k]);
      if (!Number.isNaN(n)) return n;
    }
  }
  return undefined;
}

// ---------- FRP legend ----------
function updateLegend(min, max) {
  const legend = document.getElementById("fire-legend");
  if (!legend) return;

  legend.innerHTML = "";

  const title = document.createElement("div");
  title.style.fontSize = "11px";
  title.style.marginBottom = "4px";
  title.textContent = "Fire Radiative Power (MW)";
  legend.appendChild(title);

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.gap = "4px";

  const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([min, max]);

  const steps = 5;
  for (let i = 0; i < steps; i++) {
    const v = min + (i / (steps - 1)) * (max - min);
    const swatch = document.createElement("div");
    swatch.style.width = "30px";
    swatch.style.height = "12px";
    swatch.style.background = color(v);
    swatch.style.border = "1px solid rgba(0,0,0,0.08)";
    row.appendChild(swatch);
  }

  legend.appendChild(row);
}

// ---------- Top-right FRP info box ----------
(function createFRPBox() {
  if (document.getElementById("fire-mode-ui")) return;

  const box = document.createElement("div");
  box.id = "fire-mode-ui";
  box.style.position = "absolute";
  box.style.top = "10px";
  box.style.right = "10px";
  box.style.background = "rgba(255,255,255,0.96)";
  box.style.padding = "8px";
  box.style.borderRadius = "6px";
  box.style.font = "12px sans-serif";
  box.style.zIndex = 10050;
  box.style.boxShadow = "0 1px 8px rgba(0,0,0,0.12)";
  box.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px">Fire Radiative Power</div>
    <div id="fire-legend" style="margin-top:4px;"></div>
  `;
  document.body.appendChild(box);
})();

// ---------- Bottom-left country dropdown ----------
(function createCountryDropdown() {
  if (document.getElementById("country-select")) return;

  const sel = document.createElement("select");
  sel.id = "country-select";
  sel.style.position = "absolute";
  sel.style.left = "12px";
  sel.style.bottom = "12px";
  sel.style.padding = "8px 10px";
  sel.style.borderRadius = "6px";
  sel.style.border = "2px solid #2b6cb0";
  sel.style.background = "#fff";
  sel.style.zIndex = 10050;
  sel.title = "Filter by country";
  document.body.appendChild(sel);

  sel.addEventListener("change", function () {
    const v = this.value;
    activeCountry = v || null;

    // Make sure activeContinent matches this country
    if (activeCountry) {
      for (const cont of Object.keys(CONTINENT_DATA)) {
        if (CONTINENT_DATA[cont].includes(activeCountry)) {
          activeContinent = cont;
          if (topSelect) topSelect.value = cont;
          break;
        }
      }
    }

    // Reset month to January when switching countries
    activeMonth = 1;
    if (monthSlider) monthSlider.value = 1;
    const label = document.getElementById("month-label");
    if (label) label.innerText = "Month: " + monthNames[activeMonth - 1];

    drawMap();
  });

  // Make globally accessible for continent switches
  window.updateCountryDropdown = function (continent) {
    const s = document.getElementById("country-select");
    if (!s) return;

    s.innerHTML = "";
    const allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = "All countries";
    s.appendChild(allOpt);

    const list = CONTINENT_DATA[continent] || [];
    list.forEach(c => {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      s.appendChild(o);
    });

    s.value = "";
    s.style.display = list.length ? "inline-block" : "none";
  };

  window.updateCountryDropdown(activeContinent);
})();

// ---------- Top continent dropdown: ONLY 6 regions ----------
function populateRegionDropdown() {
  if (!topSelect) return;

  topSelect.innerHTML = "";
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "Select continent...";
  topSelect.appendChild(defaultOpt);

  ["Africa","North America","South America","Asia","Oceania","Europe"]
    .forEach(cont => {
      const opt = document.createElement("option");
      opt.value = cont;
      opt.textContent = cont;
      topSelect.appendChild(opt);
    });

  topSelect.onchange = function () {
    const v = this.value;
    if (!v) return;
    filterMap(v); // continent name
  };
}

// Called whenever top dropdown changes continent
window.filterMap = function (continentName) {
  if (!Object.prototype.hasOwnProperty.call(CONTINENT_DATA, continentName)) return;

  activeContinent = continentName;
  activeCountry = null;

  // Reset month to January
  activeMonth = 1;
  if (monthSlider) monthSlider.value = 1;
  const label = document.getElementById("month-label");
  if (label) label.innerText = "Month: " + monthNames[activeMonth - 1];

  if (typeof window.updateCountryDropdown === "function") {
    window.updateCountryDropdown(activeContinent);
  }

  drawMap();
};

// ---------- Draw fire dots ----------
function drawFireDots(data) {
  if (!ctx || !window.currentProjection) return;

  const projection = window.currentProjection;
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Make canvas pixel-perfect
  canvas.width  = Math.round(w * window.devicePixelRatio);
  canvas.height = Math.round(h * window.devicePixelRatio);
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const vals = data
    .map(d => getMetricValue(d))
    .filter(v => Number.isFinite(v));

  const min = vals.length ? d3.min(vals) : 0;
  const max = vals.length ? d3.max(vals) : 1;

  const colorScale  = d3.scaleSequential(d3.interpolateYlOrRd).domain([min, max]);
  const radiusScale = d3.scaleSqrt().domain([min, max]).range([0.7, 4.0]);

  updateLegend(min, max);

  ctx.globalCompositeOperation = "source-over";

  for (const d of data) {
    const lon = +d.longitude;
    const lat = +d.latitude;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;

    const p = projection([lon, lat]);
    if (!p || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;

    const v = getMetricValue(d);
    const r = Number.isFinite(v) ? radiusScale(v) : 1.0;

    ctx.beginPath();
    ctx.fillStyle = Number.isFinite(v)
      ? colorScale(v)
      : "rgba(180,180,180,0.5)";
    ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- Draw map + dots ----------
function drawMap() {
  const width  = window.innerWidth;
  const height = window.innerHeight;
  if (svg) svg.attr("width", width).attr("height", height);

  const continentRows = allData[activeContinent] || [];
  const filtered = continentRows.filter(d => {
    const month = d.acq_date
      ? (new Date(d.acq_date).getMonth() + 1)
      : activeMonth;
    if (month !== activeMonth) return false;
    if (!activeCountry) return true;
    const name = d.country || "";
    return name === activeCountry || name === activeCountry.replace(/_/g, " ");
  });

  d3.json("https://unpkg.com/world-atlas@2/countries-50m.json")
    .then(world => {
      const features = topojson.feature(world, world.objects.countries).features;

      // Countries to draw for this continent
      let namesToDraw = CONTINENT_MAP[activeContinent] || [];

      if (activeCountry) {
        const match = features.find(f => {
          const n = f.properties && f.properties.name;
          if (!n) return false;
          return (
            n === activeCountry ||
            n === activeCountry.replace(/_/g, " ") ||
            n.includes(activeCountry)
          );
        });
        namesToDraw = match && match.properties && match.properties.name
          ? [match.properties.name]
          : [activeCountry];
      }

      let mapFeatures = features.filter(f =>
        namesToDraw.includes(f.properties.name)
      );

      if (!mapFeatures.length) {
        // Fallback to continent-level features if country matching fails
        mapFeatures = features.filter(f =>
          (CONTINENT_MAP[activeContinent] || []).includes(f.properties.name)
        );
      }

      if (!mapFeatures.length) {
        console.warn("No map features found for", activeContinent, activeCountry);
        return;
      }

      const collection = { type: "FeatureCollection", features: mapFeatures };
      const projection = d3.geoMercator().fitSize([width, height], collection);
      const path = d3.geoPath().projection(projection);

      if (svg) {
        svg.selectAll("*").remove();
        svg.append("g")
          .attr("id", "continent-layer")
          .selectAll("path")
          .data(mapFeatures)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("fill", "#e6e6e6")
          .attr("stroke", "#555")
          .attr("stroke-width", 0.6);
      }

      window.currentProjection = projection;
      drawFireDots(filtered);
    })
    .catch(err => {
      console.error("MAP LOAD ERROR:", err);
    });
}

// ---------- CSV loading ----------
function loadContinentData(continent) {
  const files     = getFilePathsForContinent(continent);
  const countries = CONTINENT_DATA[continent] || [];

  const promises = files.map((file, i) =>
    d3.csv(file)
      .then(rows =>
        rows.map(r => Object.assign({}, r, { country: countries[i] }))
      )
      .catch(err => {
        console.warn("Failed to load", file, err);
        return [];
      })
  );

  return Promise.all(promises).then(arrs => arrs.flat());
}

const continentPromises = Object.keys(CONTINENT_DATA).map(cont =>
  loadContinentData(cont).then(data => ({ cont, data }))
);

Promise.all(continentPromises)
  .then(results => {
    results.forEach(r => {
      allData[r.cont] = r.data;
    });
    console.log(
      "Loaded rows:",
      Object.keys(allData)
        .map(k => `${k}: ${(allData[k] || []).length}`)
        .join(", ")
    );

    populateRegionDropdown();
    if (window.updateCountryDropdown) window.updateCountryDropdown(activeContinent);
    drawMap();
  })
  .catch(err => {
    console.error("LOAD ERROR:", err);
    populateRegionDropdown();
    if (window.updateCountryDropdown) window.updateCountryDropdown(activeContinent);
    drawMap();
  });

// ---------- Controls: play / reset / slider ----------
if (playBtn) {
  playBtn.addEventListener("click", () => {
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
      playBtn.textContent = "▶️";
      return;
    }
    playBtn.textContent = "⏸️";
    playInterval = setInterval(() => {
      activeMonth += 1;
      if (activeMonth > 12) activeMonth = 1;
      if (monthSlider) monthSlider.value = activeMonth;
      const label = document.getElementById("month-label");
      if (label) label.innerText = "Month: " + monthNames[activeMonth - 1];
      drawMap();
    }, 1000);
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
      if (playBtn) playBtn.textContent = "▶️";
    }
    activeMonth = 1;
    if (monthSlider) monthSlider.value = 1;
    const label = document.getElementById("month-label");
    if (label) label.innerText = "Month: " + monthNames[0];
    drawMap();
  });
}

if (monthSlider) {
  monthSlider.addEventListener("input", function () {
    activeMonth = +this.value;
    const label = document.getElementById("month-label");
    if (label) label.innerText = "Month: " + monthNames[activeMonth - 1];
    drawMap();
  });
}

// ---------- Resize + initial ----------
window.addEventListener("resize", drawMap);
populateRegionDropdown();
if (window.updateCountryDropdown) window.updateCountryDropdown(activeContinent);
drawMap();
