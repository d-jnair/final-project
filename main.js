console.log("Main JS is running!");

// ---------- PAGE TITLE (UI ONLY) ----------
(function createPageTitle() {
  if (document.getElementById("page-title")) return;

  const title = document.createElement("div");
  title.id = "page-title";
  title.textContent = "African Wildfire Activity (2024 MODIS)";
  title.style.position = "absolute";
  title.style.top = "10px";
  title.style.left = "50%";
  title.style.transform = "translateX(-50%)";
  title.style.padding = "6px 14px";
  title.style.fontSize = "20px";
  title.style.fontWeight = "600";
  title.style.fontFamily = "system-ui, -apple-system, sans-serif";
  title.style.background = "rgba(255,255,255,0.9)";
  title.style.borderRadius = "8px";
  title.style.border = "1px solid #ccc";
  title.style.zIndex = "9999";

  document.body.appendChild(title);
})();
// ---------------------------------------------------------------

// Grab SVG + canvas
const svg = d3.select("#map");
const canvas = document.getElementById("dots");
const ctx = canvas.getContext("2d");

// AFRICA-ONLY COUNTRY LISTS (CSV names + topojson names)
const AFRICA_COUNTRIES = [
  "Algeria","Angola","Benin","Botswana","Burkina Faso","Burundi","Cameroon","Cape Verde",
  "Central African Republic","Chad","Comoros","Cote d Ivoire","Democratic Republic of the Congo",
  "Djibouti","Egypt","Equatorial Guinea","Eritrea","Ethiopia","Gabon","Ghana","Guinea-Bissau",
  "Guinea","Kenya","Lesotho","Liberia","Libya","Madagascar","Malawi","Mali","Mauritania",
  "Mauritius","Mayotte","Morocco","Mozambique","Namibia","Niger","Nigeria","Congo",
  "Reunion","Rwanda","Saint Helena","Sao Tome and Principe","Senegal","Seychelles",
  "Sierra Leone","Somalia","South Africa","South Sudan","Sudan","eSwatini","Tanzania",
  "The Gambia","Togo","Tunisia","Uganda","Zambia","Zimbabwe"
];

const AFRICA_COUNTRIES_TOPO = [
  "Algeria","Angola","Benin","Botswana","Burkina Faso","Burundi","Cameroon","Cape Verde",
  "Central African Rep.","Chad","Comoros","Côte d'Ivoire","Dem. Rep. Congo",
  "Djibouti","Egypt","Eq. Guinea","Eritrea","Ethiopia","Gabon","Ghana","Guinea-Bissau",
  "Guinea","Kenya","Lesotho","Liberia","Libya","Madagascar","Malawi","Mali","Mauritania",
  "Mauritius","Mayotte","Morocco","Mozambique","Namibia","Niger","Nigeria","Congo",
  "Reunion","Rwanda","Saint Helena","Sao Tome and Principe","Senegal","Seychelles",
  "Sierra Leone","Somalia","South Africa","S. Sudan","Sudan","eSwatini","Tanzania",
  "Gambia","Togo","Tunisia","Uganda","Zambia","Zimbabwe","W. Sahara","Somaliland"
];

const COUNTRY_NAME_FIX = {
  "Dem. Rep. Congo": "Democratic Republic of the Congo",
  "Central African Rep.": "Central African Republic",
  "Eq. Guinea": "Equatorial Guinea",
  "S. Sudan": "South Sudan",
  "W. Sahara": "West Sahara",
  "Gambia": "The Gambia"
};

let allData = {};            // allData["Africa"]
let activeMonth = 1;
let showRegionFRP = false;

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

let playInterval = null;
const monthSlider = document.getElementById("month-slider");
const playBtn = document.getElementById("play-btn");
const resetBtn = document.getElementById("reset-btn");

// ----------------- REGION FRP TOGGLE BUTTON -----------------
(function createRegionToggle() {
  if (document.getElementById("frp-region-toggle")) return;
  const btn = document.createElement("button");
  btn.id = "frp-region-toggle";
  btn.textContent = "Region FRP: off";
  btn.style.position = "absolute";
  btn.style.top = "50px";
  btn.style.left = "10px";
  btn.style.zIndex = 9999;
  btn.style.padding = "6px 10px";
  btn.style.borderRadius = "6px";
  btn.style.border = "1px solid #444";
  btn.style.background = "rgba(255,255,255,0.9)";
  btn.style.cursor = "pointer";
  btn.style.fontSize = "12px";
  document.body.appendChild(btn);

  btn.addEventListener("click", () => {
    showRegionFRP = !showRegionFRP;
    btn.textContent = showRegionFRP ? "Region FRP: on" : "Region FRP: off";
    drawMap();
  });
})();
// -------------------------------------------------------------

// Play / pause
playBtn.addEventListener("click", () => {
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
    playBtn.textContent = "▶️";
  } else {
    playBtn.textContent = "⏸️";
    playInterval = setInterval(() => {
      activeMonth += 1;
      if (activeMonth > 12) activeMonth = 1;
      monthSlider.value = activeMonth;
      document.getElementById("month-label").innerText =
        "Month: " + monthNames[activeMonth - 1] + " 2024";
      drawMap();
    }, 1000);
  }
});

// Reset
resetBtn.addEventListener("click", () => {
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
    playBtn.textContent = "▶️";
  }
  activeMonth = 1;
  monthSlider.value = 1;
  document.getElementById("month-label").innerText = "Month: January 2024";
  drawMap();
});

// Slider manual change
monthSlider.addEventListener("input", function () {
  activeMonth = +this.value;
  document.getElementById("month-label").innerText =
    "Month: " + monthNames[activeMonth - 1] + " 2024";
  drawMap();
});

// Optional: if HTML still calls filterMap, just keep Africa
window.filterMap = function () {
  activeMonth = 1;
  monthSlider.value = 1;
  document.getElementById("month-label").innerText = "Month: January 2024";
  drawMap();
};

// ---------------------- CANVAS DOTS --------------------------
function drawFireDots(data) {
  const projection = window.currentProjection;
  if (!projection) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255, 69, 0, 0.6)";

  data.forEach(d => {
    const [x, y] = projection([+d.longitude, +d.latitude]);
    if (!isNaN(x) && !isNaN(y)) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
// ------------------------------------------------------------

// ---------------------- TOOLTIP -----------------------------
if (!window.fireTooltip) {
  window.fireTooltip = d3.select("body").append("div")
    .attr("class", "fire-tooltip")
    .style("position", "absolute")
    .style("background", "rgba(255,255,255,0.95)")
    .style("border", "1px solid #333")
    .style("padding", "8px 12px")
    .style("border-radius", "7px")
    .style("pointer-events", "none")
    .style("font-size", "14px")
    .style("z-index", "9999")
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.2)")
    .style("opacity", 0);
}

function showTooltip(event, html) {
  window.fireTooltip.html(html)
    .style("left", (event.pageX + 12) + "px")
    .style("top", (event.pageY - 30) + "px")
    .style("opacity", 1);
}

function moveTooltip(event) {
  window.fireTooltip
    .style("left", (event.pageX + 12) + "px")
    .style("top", (event.pageY - 30) + "px");
}

function hideTooltip() {
  window.fireTooltip.style("opacity", 0);
}
// ------------------------------------------------------------

// ------------------------ MAP DRAW --------------------------
function drawMap() {
  const width  = window.innerWidth;
  const height = window.innerHeight;

  // Resize SVG + canvas to viewport
  svg.attr("width", width).attr("height", height);
  canvas.width  = width  * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const rows = allData["Africa"] || [];
  const filteredData = rows.filter(d => {
    const month = new Date(d.acq_date).getMonth() + 1;
    return month === activeMonth;
  });

  // Stats for FRP coloring
  const countryStats = new Map();
  filteredData.forEach(row => {
    const csvName = row.country;
    if (!csvName) return;
    const frpVal = +row.frp || 0;
    if (!countryStats.has(csvName)) {
      countryStats.set(csvName, { count: 0, sumFRP: 0 });
    }
    const s = countryStats.get(csvName);
    s.count += 1;
    if (!isNaN(frpVal)) s.sumFRP += frpVal;
  });

  const frpMeans = [];
  countryStats.forEach(s => {
    if (s.count > 0) {
      s.meanFRP = s.sumFRP / s.count;
      frpMeans.push(s.meanFRP);
    } else {
      s.meanFRP = NaN;
    }
  });

  let regionColorScale = null;
  if (showRegionFRP && frpMeans.length) {
    const minFRP = d3.min(frpMeans);
    const maxFRP = d3.max(frpMeans);
    regionColorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([minFRP, maxFRP]);
  }

  function getRegionFill(topoName) {
    if (!showRegionFRP || !regionColorScale) return "#ddd";
    const csvName = COUNTRY_NAME_FIX[topoName] || topoName;
    const s = countryStats.get(csvName);
    if (!s || !isFinite(s.meanFRP)) return "#eee";
    return regionColorScale(s.meanFRP);
  }

  d3.json("https://unpkg.com/world-atlas@2/countries-50m.json").then(world => {
    const countries = topojson.feature(world, world.objects.countries).features;
    const countriesToDraw = AFRICA_COUNTRIES_TOPO;

    const mapFeatures = countries.filter(d =>
      countriesToDraw.includes(d.properties.name)
    );
    if (!mapFeatures.length) return;

    const collection = { type: "FeatureCollection", features: mapFeatures };
    const projection = d3.geoMercator().fitSize([width, height], collection);
    const path = d3.geoPath().projection(projection);

    svg.selectAll("*").remove();
    svg.append("g")
      .attr("id", "continent-layer")
      .selectAll("path")
      .data(mapFeatures)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", d => getRegionFill(d.properties.name))
      .attr("stroke", "#333")
      .attr("stroke-width", 0.6)
      .on("mouseover", function (event, d) {
        const countryName = d.properties.name;
        const csvCountryName = COUNTRY_NAME_FIX[countryName] || countryName;

        const fires = (allData["Africa"] || []).filter(
          f => f.country === csvCountryName &&
               (new Date(f.acq_date).getMonth() + 1) === activeMonth
        );
        const fireCount = fires.length;
        const meanFRP = fireCount > 0
          ? (fires.reduce((sum, f) => sum + (+f.frp || 0), 0) / fireCount).toFixed(1)
          : "N/A";
        const meanBright = fireCount > 0
          ? (fires.reduce((sum, f) => sum + (+f.brightness || 0), 0) / fireCount).toFixed(1)
          : "N/A";

        const continentFireCount = (allData["Africa"] || []).filter(
          dd => (new Date(dd.acq_date).getMonth() + 1) === activeMonth
        ).length;
        const prop = (fireCount > 0 && continentFireCount > 0)
          ? ((fireCount / continentFireCount) * 100).toFixed(1)
          : "N/A";

        const html = `<strong>${csvCountryName}</strong><br>
          Fires: ${fireCount}<br>
          Mean FRP: ${meanFRP}<br>
          Mean Brightness: ${meanBright}<br>
          % of Continent Fires: ${prop}%`;

        showTooltip(event, html);
        d3.select(this).attr("fill", "rgba(170, 203, 255, 1)");
      })
      .on("mousemove", function (event) {
        moveTooltip(event);
      })
      .on("mouseout", function (event, d) {
        hideTooltip();
        d3.select(this).attr("fill", getRegionFill(d.properties.name));
      });

    window.currentProjection = projection;

    drawFireDots(filteredData);
  });
}
// ------------------------------------------------------------

// ------------- DATA LOADING: AFRICA ONLY ----------------
function getFilePathsForAfrica() {
  return AFRICA_COUNTRIES.map(c =>
    `africa/modis_2024_${c.replace(/ /g, "_")}.csv`
  );
}

function loadAfricaData() {
  const files = getFilePathsForAfrica();
  return Promise.all(files.map((f, i) =>
    d3.csv(f).then(data => data.map(d => ({ ...d, country: AFRICA_COUNTRIES[i] })))
  )).then(dfs => dfs.flat());
}

loadAfricaData()
  .then(data => {
    allData["Africa"] = data;
    console.log("Africa fire points loaded:", data.length);
    drawMap();
  })
  .catch(err => console.error("LOAD ERROR:", err));

window.addEventListener("resize", drawMap);
