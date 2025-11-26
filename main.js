console.log("Main JS is running!");

const svg = d3.select("svg");
const canvas = document.getElementById("dots");
const ctx = canvas.getContext("2d");

const CONTINENT_DATA = {
  "Africa": [
    'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
    'Central African Republic', 'Chad', 'Comoros', 'Cote d Ivoire', 'Democratic Republic of the Congo',
    'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea', 'Ethiopia', 'Gabon', 'Ghana', 'Guinea-Bissau',
    'Guinea', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania',
    'Mauritius', 'Mayotte', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Congo',
    'Reunion', 'Rwanda', 'Saint Helena', 'Sao Tome and Principe', 'Senegal', 'Seychelles',
    'Sierra Leone', 'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'eSwatini', 'Tanzania',
    'The Gambia', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
  ],
  "North America": ['Antigua and Barbuda', 'Aruba', 'Bahamas', 'Barbados', 'Belize',
    'Canada', 'Cayman Islands', 'Costa Rica', 'Cuba', 'Curacao',
    'Dominica', 'Dominican Republic', 'El Salvador', 'Greenland',
    'Guadeloupe', 'Guatemala', 'Haiti', 'Honduras', 'Jamaica',
    'Martinique', 'Mexico', 'Montserrat', 'Nicaragua', 'Panama',
    'Puerto Rico', 'Saint Kitts and Nevis', 'Saint Lucia',
    'Saint Vincent and the Grenadines', 'Trinidad and Tobago',
    'United States of America', 'United States Minor Outlying Islands'],
  "South America": ['Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador',
    'French Guiana', 'Guyana', 'Paraguay', 'Peru', 'Suriname',
    'Uruguay', 'Venezuela'],
  "Asia": ['Afghanistan', 'Armenia', 'Azerbaijan', 'Bahrain', 'Bangladesh',
    'Bhutan', 'Brunei', 'Cambodia', 'China', 'Cyprus',
    'North Korea', 'Georgia', 'Hong Kong', 'India', 'Indonesia',
    'Iran', 'Iraq', 'Israel', 'Japan', 'Jordan', 'Kazakhstan',
    'Kuwait', 'Kyrgyzstan', 'Laos', 'Lebanon', 'Malaysia',
    'Maldives', 'Mongolia', 'Myanmar', 'Nepal', 'Oman', 'Pakistan',
    'Palestine', 'Philippines', 'Qatar', 'South Korea',
    'Saudi Arabia', 'Singapore', 'Sri Lanka', 'Syria', 'Taiwan',
    'Tajikistan', 'Thailand', 'Timor-Leste', 'Turkey', 'Turkmenistan',
    'United Arab Emirates', 'Uzbekistan', 'Vietnam', 'Yemen'],
  "Oceania": ['American Samoa', 'Australia', 'Fiji', 'French Polynesia', 'Guam',
    'Heard I and McDonald Islands', 'New Caledonia', 'New Zealand',
    'Northern Mariana Islands', 'Papua New Guinea', 'Samoa',
    'Solomon Islands', 'Tonga', 'Vanuatu'],
  "Europe": ['Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium',
    'Bosnia and Herzegovina', 'Bulgaria', 'Croatia', 'Czech Republic',
    'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
    'Hungary', 'Iceland', 'Ireland', 'Italy', 'Kosovo', 'Latvia',
    'Lithuania', 'Luxembourg', 'Macedonia',
    'Malta', 'Moldova', 'Montenegro', 'Netherlands', 'Norway',
    'Poland', 'Portugal', 'Romania', 'Russia', 'Serbia',
    'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland',
    'Ukraine', 'United Kingdom']
};

const CONTINENT_MAP = {
  "Africa": [
    'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 'Cape Verde',
    'Central African Rep.', 'Chad', 'Comoros', "CÃ´te d'Ivoire", 'Dem. Rep. Congo',
    'Djibouti', 'Egypt', 'Eq. Guinea', 'Eritrea', 'Ethiopia', 'Gabon', 'Ghana', 'Guinea-Bissau',
    'Guinea', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania',
    'Mauritius', 'Mayotte', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Congo',
    'Reunion', 'Rwanda', 'Saint Helena', 'Sao Tome and Principe', 'Senegal', 'Seychelles',
    'Sierra Leone', 'Somalia', 'South Africa', 'S. Sudan', 'Sudan', 'eSwatini', 'Tanzania',
    'Gambia', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe', 'W. Sahara', 'Somaliland'
  ],
  "North America": ['Antigua and Barbuda', 'Aruba', 'Bahamas', 'Barbados', 'Belize',
    'Canada', 'Cayman Islands', 'Costa Rica', 'Cuba', 'Curacao',
    'Dominica', 'Dominican Rep.', 'El Salvador', 'Greenland',
    'Guadeloupe', 'Guatemala', 'Haiti', 'Honduras', 'Jamaica',
    'Martinique', 'Mexico', 'Montserrat', 'Nicaragua', 'Panama',
    'Puerto Rico', 'Saint Kitts and Nevis', 'Saint Lucia',
    'Saint Vincent and the Grenadines', 'Trinidad and Tobago',
    'United States of America', 'United States Minor Outlying Islands'],
  "South America": ['Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador',
    'French Guiana', 'Guyana', 'Paraguay', 'Peru', 'Suriname',
    'Uruguay', 'Venezuela'],
  "Asia": ['Afghanistan', 'Armenia', 'Azerbaijan', 'Bahrain', 'Bangladesh',
    'Bhutan', 'Brunei', 'Cambodia', 'China', 'N. Cyprus',
    'North Korea', 'Georgia', 'Hong Kong', 'India', 'Indonesia',
    'Iran', 'Iraq', 'Israel', 'Japan', 'Jordan', 'Kazakhstan',
    'Kuwait', 'Kyrgyzstan', 'Laos', 'Lebanon', 'Malaysia',
    'Maldives', 'Mongolia', 'Myanmar', 'Nepal', 'Oman', 'Pakistan',
    'Palestine', 'Philippines', 'Qatar', 'South Korea',
    'Saudi Arabia', 'Singapore', 'Sri Lanka', 'Syria', 'Taiwan',
    'Tajikistan', 'Thailand', 'Timor-Leste', 'Turkey', 'Turkmenistan',
    'United Arab Emirates', 'Uzbekistan', 'Vietnam', 'Yemen'],
  "Oceania": ['American Samoa', 'Australia', 'Fiji', 'French Polynesia', 'Guam',
    'Heard I and McDonald Islands', 'New Caledonia', 'New Zealand',
    'Northern Mariana Islands', 'Papua New Guinea', 'Samoa',
    'Solomon Is.', 'Tonga', 'Vanuatu'],
  "Europe": ['Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium',
    'Bosnia and Herz.', 'Bulgaria', 'Croatia', 'Czechia',
    'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
    'Hungary', 'Iceland', 'Ireland', 'Italy', 'Kosovo', 'Latvia',
    'Lithuania', 'Luxembourg', 'Macedonia',
    'Malta', 'Moldova', 'Montenegro', 'Netherlands', 'Norway',
    'Poland', 'Portugal', 'Romania', 'Russia', 'Serbia',
    'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland',
    'Ukraine', 'United Kingdom']
};

const COUNTRY_NAME_FIX = {
  "Dem. Rep. Congo": "Democratic Republic of the Congo",
  "Central African Rep.": "Central African Republic",
  "Eq. Guinea": "Equatorial Guinea",
  "S. Sudan": "South Sudan",
  "Dominican Rep.": "Dominican Republic",
  "CÃ´te d'Ivoire": "Cote d Ivoire",
  "Gambia": "The Gambia"
};

let allData = {}; 
let activeContinent = "Africa"; 
let activeMonth = 1; 
let showRegionFRP = false;

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

let playInterval = null;
const monthSlider = document.getElementById("month-slider");
const playBtn = document.getElementById("play-btn");
const resetBtn = document.getElementById("reset-btn");

(function createRegionToggle() {
  if (document.getElementById("frp-region-toggle")) return;
  const btn = document.createElement("button");
  btn.id = "frp-region-toggle";
  btn.textContent = "Region FRP: off";
  btn.style.position = "absolute";
  btn.style.top = "10px";
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
        "Month: " + monthNames[activeMonth - 1];
      drawMap();
    }, 1000);
  }
});

resetBtn.addEventListener("click", () => {
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
    playBtn.textContent = "▶️";
  }

  activeMonth = 1;
  monthSlider.value = 1;
  document.getElementById("month-label").innerText = "Month: January";

  drawMap();
});

window.filterMap = function (continentName) {
  activeContinent = continentName;
  console.log(`Switching view to: ${activeContinent}`);

  activeMonth = 1;
  monthSlider.value = 1;
  document.getElementById("month-label").innerText = "Month: January";

  drawMap();
};

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

function drawMap() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const continentRows = allData[activeContinent] || [];
  const filteredData = continentRows.filter(d => {
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
    const countriesToDraw = CONTINENT_MAP[activeContinent];

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
      // Tooltip interactivity
      .on("mouseover", function (event, d) {
        const countryName = d.properties.name;
        const csvCountryName = COUNTRY_NAME_FIX[countryName] || countryName;

        const fires = (allData[activeContinent] || []).filter(
          f => f.country === csvCountryName &&
            (new Date(f.acq_date).getMonth() + 1) === activeMonth
        );
        const fireCount = fires.length;
        const meanFRP = (fireCount > 0
          ? (fires.reduce((sum, f) => sum + (+f.frp || 0), 0) / fireCount).toFixed(1)
          : 'N/A');
        const meanBright = fireCount > 0
          ? (fires.reduce((sum, f) => sum + (+f.brightness || 0), 0) / fireCount).toFixed(1)
          : 'N/A';

        const continentFireCount = (allData[activeContinent] || []).filter(
          dd => (new Date(dd.acq_date).getMonth() + 1) === activeMonth
        ).length;
        const prop = (fireCount > 0 && continentFireCount > 0)
          ? ((fireCount / continentFireCount) * 100).toFixed(1)
          : 'N/A';

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

function getFilePathsForContinent(continent) {
  const countries = CONTINENT_DATA[continent];
  return countries.map(c =>
    `modis_2024_all_countries/modis/2024/modis_2024_${c.replace(/ /g, "_")}.csv`
  );
}

function loadContinentData(continent) {
  const files = getFilePathsForContinent(continent);
  const countries = CONTINENT_DATA[continent];

  return Promise.all(files.map((f, i) =>
    d3.csv(f).then(data => data.map(d => ({ ...d, country: countries[i] })))
  )).then(dfs => dfs.flat());
}

const continentPromises = Object.keys(CONTINENT_DATA).map(continent =>
  loadContinentData(continent).then(data => ({ continent, data }))
);

Promise.all(continentPromises).then(results => {
  results.forEach(({ continent, data }) => {
    allData[continent] = data;
  });
  console.log("All continental fire points loaded:",
    Object.keys(allData).map(k => `${k}: ${allData[k].length}`).join(', '));
  drawMap();
}).catch(err => console.error("LOAD ERROR:", err));

document.getElementById("month-slider").addEventListener("input", function () {
  activeMonth = +this.value;
  document.getElementById("month-label").innerText =
    "Month: " + monthNames[activeMonth - 1];
  drawMap();
});

window.addEventListener("resize", drawMap);
