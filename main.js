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
  "Gambia": "The Gambia",
  "Côte d'Ivoire" : "Cote d Ivoire"
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


// --- Chapter configuration: representative months and country sets ---
const CHAPTERS = {
  0: {
    title: "Africa Wildfires 2024: From Savanna Cycles to Fire Crises",
    text: `
    <em>Click a chapter to explore how Africa’s fire story unfolded in 2024.</em>
  `,
    month: 1
  },
  1: {
    title: "Chapter 1 – Early‑Year Savanna Belt (Jan–Mar)",
    text: `
      From January to March, the fire detections cluster across Guinea, Nigeria, Sierra Leone, the Central African Republic, and South Sudan. 
      This is the “classic” early dry‑season belt: grass and cropland residues burned for land management. 
      What stands out in 2024 is that the clusters are larger than the year before. 
      That hints at an upward trend – more fires, and possibly stronger ones – even in regions where burning is routine.
    `,
    month: 1
  },
  2: {
    title: "Chapter 2 – Mid‑Year Congo Basin Anomaly (Jul–Aug)",
    text: `
      By July and August, the fire front shifts south. In 2024, the Congo Basin burned about 28% more area than average, with ~4,000 fires, roughly 20% above normal. 
      This is unusual. Rainforests here are normally too humid to burn, but 2024 brought hot, dry, windy conditions. 
      Climate change likely made those extremes more frequent. 
      So instead of just savanna burning, we see fire chewing into wetter forest zones – a warning sign that Africa’s fire regime is intensifying.
    `,
    month: 7
  },
  3: {
    title: "Chapter 3 – Late‑Year Southern Peak (Sep–Dec)",
    text: `
      As the dry season moved south, fire activity exploded in Angola, Zambia, Zimbabwe, and South Africa. 
      South Africa alone burned ~4 million hectares in 2024, its deadliest season on record. 
      Interestingly, the total number of fires in South Africa was lower than 2023, but the ones that did occur were far more destructive. 
      That shows how intensity matters as much as counts. 
      The southern season wasn’t just routine veld burning — it turned into a wildfire crisis.
    `,
    month: 9
  }
};

// function renderPanel(chapterId) {
//   const c = CHAPTERS[chapterId];
//   if (!c) return;

//   document.getElementById("panel-title").textContent = c.title;
//   document.getElementById("panel-content").innerHTML = c.text;

//   // Switch map month
//   activeMonth = c.month;
//   monthSlider.value = activeMonth;
//   document.getElementById("month-label").innerText =
//     "Month: " + monthNames[activeMonth - 1] + " 2024";
//   drawMap();
// }

function renderPanel(chapterId) {
  const c = CHAPTERS[chapterId];
  if (!c) return;

  document.getElementById("panel-title").textContent = c.title;
  document.getElementById("panel-content").innerHTML = c.text;

  // Show or hide the hook paragraph
  const hookEl = document.getElementById("panel-hook");
  if (chapterId === 0) {
    hookEl.style.display = "block";
  } else {
    hookEl.style.display = "none";
  }

  // Switch map month
  activeMonth = c.month;
  monthSlider.value = activeMonth;
  document.getElementById("month-label").innerText =
    "Month: " + monthNames[activeMonth - 1] + " 2024";
  drawMap();
}


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
  const panelWidth = document.getElementById("panel")?.clientWidth || 0;
  const width  = window.innerWidth - panelWidth;
  const height = window.innerHeight;

  svg.attr("width", width).attr("height", height);
  svg.node().style.width  = width + "px";
  svg.node().style.height = height + "px";

  canvas.width  = width;
  canvas.height = height;
  canvas.style.width  = width + "px";
  canvas.style.height = height + "px";

  ctx.setTransform(1, 0, 0, 1, 0, 0); // keep 1:1 coordinate space
  ctx.clearRect(0, 0, canvas.width, canvas.height);

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
// ------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // Default view (hook text)
  renderPanel(0);

  // Chapter button handlers
  document.querySelectorAll(".chapter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = +btn.dataset.chapter;
      renderPanel(id);
    });
  });
});
