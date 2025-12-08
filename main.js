console.log("main.js loaded");

// ================= MAP + FIRE DATA SETUP =================

// Grab SVG + canvas
const svg = d3.select("#map");
const canvas = document.getElementById("dots");
const ctx = canvas.getContext("2d");

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
  "Gambia": "The Gambia",
  "Côte d'Ivoire": "Cote d Ivoire"
};

const chartPanels = {
  "1":  { svg: "#chart1", countries: ["South Sudan", "Nigeria", "Guinea", "Sierra Leone"] },
  "2":  { svg: "#chart2", countries: ["DRC", "Angola", "Congo", "Malawi"] },
  "3":  { svg: "#chart3", countries: ["Congo"] },
  "4":  { svg: "#chart4", countries: ["Angola", "Zambia", "Mozambique", "South Africa"] },
  "5":  { svg: "#chart5", countries: ["South Africa"] }
};

let allData = {};
let activeMonth = 1;
let showRegionFRP = false;
let africaFeatures = null;
let hasDrawnMapOnce = false;

// ---------------------- CANVAS DOTS --------------------------
function drawFireDots(data) {
  const projection = window.currentProjection;
  if (!projection) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Make dots pop more when FRP choropleth is on
  ctx.fillStyle = showRegionFRP
    ? "rgba(56, 189, 248, 0.85)"   // cyan when FRP layer on
    : "rgba(255, 120, 40, 0.7)";   // warm orange when off

  data.forEach(d => {
    const [x, y] = projection([+d.longitude, +d.latitude]);
    if (!isNaN(x) && !isNaN(y)) {
      ctx.beginPath();
      ctx.arc(x, y, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// ---------------------- TOOLTIP -----------------------------
if (!window.fireTooltip) {
  window.fireTooltip = d3.select("body").append("div")
    .attr("class", "fire-tooltip")
    .style("position", "absolute")
    .style("background", "rgba(10,10,18,0.9)")
    .style("border", "1px solid rgba(255,255,255,0.18)")
    .style("padding", "8px 12px")
    .style("border-radius", "7px")
    .style("pointer-events", "none")
    .style("font-size", "13px")
    .style("color", "#f7f7f9")
    .style("z-index", "9999")
    .style("box-shadow", "0 14px 35px rgba(0,0,0,0.6)")
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

window.addEventListener("scroll", () => {
  hideTooltip();
});

// ------------------------ MAP DRAW --------------------------
function drawMap() {
  const scrolly = document.getElementById('scrolly');
  if (!scrolly || !scrolly.classList.contains('active')) return;
  if (!africaFeatures || !allData["Africa"]) return;

  const width  = Math.max(window.innerWidth * 0.64, 400);
  const height = window.innerWidth <= 1024 ? window.innerHeight * 0.55 : window.innerHeight;

  svg.attr("width", width).attr("height", height);
  svg.node().style.width  = width + "px";
  svg.node().style.height = height + "px";

  canvas.width  = width;
  canvas.height = height;
  canvas.style.width  = width + "px";
  canvas.style.height = height + "px";

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const rows = allData["Africa"] || [];
  const filteredData = rows.filter(d => {
    const month = new Date(d.acq_date).getMonth() + 1;
    return month === activeMonth;
  });

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
  if (frpMeans.length) {
    const minFRP = d3.min(frpMeans);
    const maxFRP = d3.max(frpMeans);
    regionColorScale = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([minFRP, maxFRP]);
  }

  function getRegionFill(topoName) {
    if (!showRegionFRP || !regionColorScale) return "#202435";
    const csvName = COUNTRY_NAME_FIX[topoName] || topoName;
    const s = countryStats.get(csvName);
    if (!s || !isFinite(s.meanFRP)) return "#141725";
    return regionColorScale(s.meanFRP);
  }

  const collection = { type: "FeatureCollection", features: africaFeatures };
  const projection = d3.geoMercator().fitSize([width, height], collection);
  const path = d3.geoPath().projection(projection);

  svg.selectAll("*").remove();

  const defs = svg.append("defs");
  const oceanGrad = defs.append("linearGradient")
    .attr("id", "oceanGradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "100%");
  oceanGrad.append("stop").attr("offset", "0%").attr("stop-color", "#020617");
  oceanGrad.append("stop").attr("offset", "100%").attr("stop-color", "#020926");

  svg.append("rect")
    .attr("x", -20)
    .attr("y", -20)
    .attr("width", width + 40)
    .attr("height", height + 40)
    .attr("fill", "url(#oceanGradient)");

  svg.append("g")
    .attr("id", "continent-layer")
    .selectAll("path")
    .data(africaFeatures)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => getRegionFill(d.properties.name))
    .attr("stroke", "#2f364c")
    .attr("stroke-width", 0.65)
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
        Fires: ${fireCount.toLocaleString()}<br>
        Mean FRP: ${meanFRP}<br>
        Mean Brightness: ${meanBright}<br>
        % of Continent Fires: ${prop}%`;

      showTooltip(event, html);
      d3.select(this)
        .attr("stroke-width", 1.2)
        .attr("stroke", "#facc6b")
        .attr("fill", "rgba(170, 203, 255, 0.95)");
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", function (event, d) {
      hideTooltip();
      d3.select(this)
        .attr("stroke-width", 0.65)
        .attr("stroke", "#2f364c")
        .attr("fill", getRegionFill(d.properties.name));
    });

  window.currentProjection = projection;
  drawFireDots(filteredData);

  const dotsEl = document.getElementById('dots');
  if (dotsEl && !hasDrawnMapOnce) {
    dotsEl.classList.add('is-visible');
    hasDrawnMapOnce = true;
  }
}

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

function loadAfricaTopo() {
  if (africaFeatures) return Promise.resolve(africaFeatures);
  return d3.json("https://unpkg.com/world-atlas@2/countries-50m.json")
    .then(world => {
      const countries = topojson.feature(world, world.objects.countries).features;
      africaFeatures = countries.filter(d =>
        AFRICA_COUNTRIES_TOPO.includes(d.properties.name)
      );
      return africaFeatures;
    });
}

Promise.all([loadAfricaData(), loadAfricaTopo()])
  .then(([data, features]) => {
    allData["Africa"] = data;
    console.log("Africa fire points loaded:", data.length);
    console.log("Africa topo features:", features.length);
    drawMap();
  })
  .catch(err => console.error("LOAD ERROR:", err));

window.addEventListener("resize", () => {
  if (document.getElementById('scrolly')?.classList.contains('active')) {
    drawMap();
  }
});

// FRP toggle button + show/hide based on scrolly in view
(function createRegionToggle() {
  if (document.getElementById('frp-region-toggle')) return;

  const btn = document.createElement('button');
  btn.id = "frp-region-toggle";
  btn.textContent = "Region FRP: off";

  btn.style.position = "fixed";
  btn.style.bottom = "20px";
  btn.style.left = "20px";
  btn.style.zIndex = 9999;
  btn.style.padding = "7px 14px";
  btn.style.borderRadius = "999px";
  btn.style.border = "1px solid rgba(255,255,255,0.22)";
  btn.style.background = "rgba(7,10,21,0.88)";
  btn.style.cursor = "pointer";
  btn.style.fontSize = "11px";
  btn.style.color = "#f9fafb";
  btn.style.letterSpacing = "0.09em";
  btn.style.textTransform = "uppercase";
  btn.style.backdropFilter = "blur(14px)";
  btn.style.boxShadow = "0 14px 35px rgba(0,0,0,0.75)";
  btn.style.position = "fixed";

  btn.style.display = "none";

  document.body.appendChild(btn);

  btn.addEventListener("click", () => {
    showRegionFRP = !showRegionFRP;
    btn.textContent = showRegionFRP ? "Region FRP: on" : "Region FRP: off";
    drawMap();
  });

  const scrollyEl = document.getElementById('scrolly');
  const dotsEl = document.getElementById('dots');
  if (!scrollyEl) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const visible = entry.isIntersecting && scrollyEl.classList.contains('active');
      btn.style.display = visible ? "block" : "none";

      if (!dotsEl) return;

      if (visible && hasDrawnMapOnce) {
        dotsEl.classList.add("is-visible");
      } else {
        dotsEl.classList.remove("is-visible");
      }
    });
  }, { threshold: 0.05 });

  observer.observe(scrollyEl);
})();

//=================== BAR GRAPHS =====================
createBarChart({
  element: "#chart1",
  data: CHART_DATA.chart1,
  title: "Fire Counts 2023 vs 2024"
});

function createBarChart({ element, data, height = 320 }) {

  const svg = d3.select(element);
  svg.selectAll("*").remove();

  const width = svg.node().parentNode.clientWidth;
  svg.attr("width", width).attr("height", height);

  const margin = { top: 50, right: 40, bottom: 50, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const isSingleCountryChart = data.length === 1;

  const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  const x0 = d3.scaleBand()
      .range([0, innerWidth])
      .padding(0.3)
      .domain(data.map(d => d.country));

  const x1 = d3.scaleBand()
      .padding(0.18)
      .domain(["y2023", "y2024"])
      .range([0, x0.bandwidth()]);

  const yMax = d3.max(data, d => Math.max(d.y2023, d.y2024));
  const y = d3.scaleLinear()
      .domain([0, yMax])
      .range([innerHeight, 0])
      .nice();

  const color = d3.scaleOrdinal()
      .domain(["y2023", "y2024"])
      .range(["#f97316", "#fb3c3c"]);

  // ----- AXES -----
  const xAxis = g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x0))
      .attr("font-size", 12)
      .selectAll("text")
      .style("text-anchor", "end") // Align text to the end of the tick
      .attr("dx", "-.8em")        // Shift text left
      .attr("dy", ".15em")        // Shift text down
      .attr("transform", "rotate(-45)")
      .attr("color", "#e5e7eb");

  xAxis.selectAll("path,line").attr("stroke", "#4b5563");

  const yTicks = y.ticks(6);

  const yAxis = g.append("g")
      .call(d3.axisLeft(y).tickValues(yTicks.slice(0, -1)))
      .attr("font-size", 11)
      .attr("color", "#e5e7eb");

  yAxis.selectAll("line").attr("stroke", "#4b5563");

  g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left - 10)
      .attr("x", 0 - (innerHeight / 2))
      .attr("dy", "0.7em")
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("fill", "#e5e7eb")
      .style("font-weight", "600")
      .text("Fire Count");

  // ----- GRID (NO TOP LINE) -----
  g.append("g")
    .attr("class", "grid")
    .call(
      d3.axisLeft(y)
        .tickValues(yTicks.slice(0, -1))   // drop max tick to avoid top white line
        .tickSize(-innerWidth)
        .tickFormat("")
    )
    .selectAll("line")
    .attr("stroke", "rgba(148, 163, 184, 0.25)")
    .attr("stroke-dasharray", "3,3");

  const groups = g.selectAll(".bar-group")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "bar-group")
      .attr("transform", d => `translate(${x0(d.country)},0)`);

  const bars = groups.selectAll("rect")
      .data(d => ["y2023", "y2024"].map(key => ({ key, value: d[key], country: d.country })))
      .enter()
      .append("rect")
      .attr("x", d => x1(d.key))
      .attr("y", innerHeight)
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("width", x1.bandwidth())
      .attr("height", 0)
      .attr("fill", d => color(d.key))
      .attr("opacity", 0.9)
      .on("mouseover", function(event, d) {
        const year = d.key === "y2023" ? 2023 : 2024;
        const datumForCountry = data.find(row => row.country === d.country);
        const pctChange = ((datumForCountry.y2024 - datumForCountry.y2023) / datumForCountry.y2023) * 100;

        showTooltip(
          event,
          `<strong>${d.country}</strong><br>` +
          `Year: ${year}<br>` +
          `Fire Count: ${d.value.toLocaleString()}<br>` +
          `Change 2023→2024: ${
            pctChange >= 0 ? "▲ " : "▼ "
          }${pctChange.toFixed(1)}%`
        );

        d3.select(this)
          .attr("opacity", 1)
          .attr("stroke", "#facc6b")
          .attr("stroke-width", 1.2);
      })
      .on("mousemove", moveTooltip)
      .on("mouseout", function() {
        hideTooltip();
        d3.select(this)
          .attr("opacity", 0.9)
          .attr("stroke-width", 0);
      })
      .transition()
      .duration(900)
      .delay((d, i) => i * 160)
      .attr("y", d => y(d.value))
      .attr("height", d => innerHeight - y(d.value));

  const labelXPosition = isSingleCountryChart 
    ? x1("y2023") + x1.bandwidth() / 2 
    : x0.bandwidth() / 2;

  groups.append("text")
    .text(d => {
      const pct = ((d.y2024 - d.y2023) / d.y2023) * 100;
      return (pct >= 0 ? "↑ " : "↓ ") + Math.abs(pct).toFixed(1) + "%";
    })
    .attr("x", labelXPosition)
    .attr("y", d => y(Math.max(d.y2023, d.y2024)) - 12)
    .attr("fill", d => ((d.y2024 - d.y2023) >= 0) ? "#fecaca" : "#bfdbfe")
    .attr("font-size", "14px")
    .attr("font-weight", "700")
    .attr("text-anchor", "middle")
    .style("opacity", 0)
    .transition()
    .delay(1050)
    .duration(700)
    .style("opacity", 1);

  const legend = svg.append("g")
      .attr("transform", `translate(${width - 100}, 14)`);

  ["2023","2024"].forEach((year,i) => {
    legend.append("rect")
      .attr("x", 0)
      .attr("y", i*22)
      .attr("width", 16)
      .attr("height", 16)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", year === "2023" ? "#f97316" : "#fb3c3c");

    legend.append("text")
      .attr("x", 24)
      .attr("y", i*22 + 13)
      .text(year)
      .attr("font-size", 13)
      .attr("fill", "#e5e7eb");
  });
}

// ================== SCROLLY LOGIC ==================
const scrolly = document.getElementById("scrolly");

if (scrolly) {
  const scrollyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !scrolly.classList.contains('active')) {
        scrolly.classList.add('active');
        activeMonth = 1;
        drawMap();
      }
    });
  }, { threshold: 1 });

  scrollyObserver.observe(scrolly);
}

(function initScrolly() {
  const sections = Array.from(document.querySelectorAll("#sections section"));
  if (!sections.length) return;

  const activateSection = (el) => {
    sections.forEach(s => s.classList.remove("is-active"));
    el.classList.add("is-active");

    const chapterKey = el.dataset.chapter;
    console.log("Active section:", chapterKey);

    if (chapterKey === '1' && !scrolly.classList.contains('active')) {
      scrolly.classList.add('active');
      drawMap();
    }

    switch (chapterKey) {
      case "1":
      case "1-compare":
        activeMonth = 1;
        break;
      case "2":
      case "2-compare":
      case "2-congo":
        activeMonth = 7;
        break;
      case "3":
      case "3-southafrica":
        activeMonth = 9;
        break;
      case "4":
        activeMonth = 11;
        break;
      case "conclusion":
      default:
        break;
    }

    if (scrolly.classList.contains('active')) {
      drawMap();
    }

    if (chapterKey === "1-compare") {
      createBarChart({ element: "#chart1", data: CHART_DATA.chart1 });
    }
    if (chapterKey === "2-compare") {
      createBarChart({ element: "#chart2", data: CHART_DATA.chart2 });
    }
    if (chapterKey === "2-congo") {
      createBarChart({ element: "#chart3", data: CHART_DATA.chart3 });
    }
    if (chapterKey === "3") {
      createBarChart({ element: "#chart4", data: CHART_DATA.chart4 });
    }
    if (chapterKey === "3-southafrica") {
      createBarChart({ element: "#chart5", data: CHART_DATA.chart5 });
    }
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
        activateSection(entry.target);
      }
    });
  }, {
    threshold: 0.3
  });

  sections.forEach(s => observer.observe(s));
})();
