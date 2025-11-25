console.log("Main JS is running!");

const svg = d3.select("svg");
const width = window.innerWidth;
const height = window.innerHeight;

//adding canvas stuff --- begin
const canvas = document.getElementById("dots");
const ctx = canvas.getContext("2d");

// match canvas size to device pixels
canvas.width = window.innerWidth * window.devicePixelRatio;
canvas.height = window.innerHeight * window.devicePixelRatio;
ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
//adding canvas stuff --- end

// African country list
const africanCountries = ['Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso',
  'Burundi', 'Cameroon', 'Cape Verde', 'Central African Republic',
  'Chad', 'Comoros', 'Cote d Ivoire',
  'Democratic Republic of the Congo', 'Djibouti', 'Egypt',
  'Equatorial Guinea', 'Eritrea', 'Ethiopia', 'Gabon', 'Ghana',
  'Guinea-Bissau', 'Guinea', 'Kenya', 'Lesotho', 'Liberia', 'Libya',
  'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius',
  'Mayotte', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
  'Republic of Congo', 'Reunion', 'Rwanda', 'Saint Helena',
  'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone',
  'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Swaziland',
  'Tanzania', 'The Gambia', 'Togo', 'Tunisia', 'Uganda', 'Zambia',
  'Zimbabwe'];

// Map to filenames
const africanFiles = africanCountries.map(c => `modis_2024_all_countries/modis/2024/modis_2024_${c.replace(/ /g, "_")}.csv`);

let allData = []; // Store fire data globally once loaded

// 1. Function to Draw/Redraw Everything
function drawMap() {
    // 1.1 Update Size Variables
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1.2 Update Canvas Size (CRITICAL for high DPI and alignment)
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 1.3 Clear previous drawing and SVG content
    ctx.clearRect(0, 0, width, height); // Clear the canvas dots
    svg.selectAll("*").remove(); // Clear the old SVG map elements

    // 1.4 Projection Setup (Must be recalculated on resize)
    // d3.json() is wrapped around the projection/drawing logic
    d3.json("https://unpkg.com/world-atlas@2/countries-50m.json").then(world => {
        const countries = topojson.feature(world, world.objects.countries).features;
        const africa = countries.filter(d => {
            const [[minX, minY], [maxX, maxY]] = d3.geoBounds(d);
            return maxX > -20 && minX < 60 && maxY > -40 && minY < 40;
        });

        const [[minLon, minLat], [maxLon, maxLat]] = d3.geoBounds({ type: "FeatureCollection", features: africa });
        const lonDiff = maxLon - minLon;
        const latDiff = maxLat - minLat;
        const scale = Math.min(width / (lonDiff * 1.1), height / (latDiff * 1.1)) * 150;

        const projection = d3.geoMercator()
            .center([(minLon + maxLon) / 2, (minLat + maxLat) / 2])
            .scale(scale)
            .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        // Draw Africa (SVG Map)
        svg.append("g")
            .selectAll("path")
            .data(africa)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "#ddd")
            .attr("stroke", "#333")
            .attr("stroke-width", 0.6);

        // 1.5 Draw Fire Dots (using the stored data and new projection)
        ctx.fillStyle = "red";
        allData.forEach(d => {
            const [x, y] = projection([+d.longitude, +d.latitude]);
            if (!isNaN(x) && !isNaN(y)) {
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    });
}

// 2. Load Data Once, Store It, and Initial Draw
Promise.all(africanFiles.map(f => d3.csv(f))).then(dfs => {
    allData = dfs.flat(); // Store the data globally
    console.log("All African fire points loaded:", allData.length);
    drawMap(); // Initial draw
}).catch(err => console.error("LOAD ERROR:", err));

// 3. Add Resize Listener (The key to fixing the extended screen issue)
window.addEventListener("resize", drawMap);

// // 1️⃣ Draw Africa first
// d3.json("https://unpkg.com/world-atlas@2/countries-50m.json").then(world => {

//   const countries = topojson.feature(world, world.objects.countries).features;

//   const africa = countries.filter(d => {
//     const [[minX, minY], [maxX, maxY]] = d3.geoBounds(d);
//     return maxX > -20 && minX < 60 && maxY > -40 && minY < 40;
//   });

//   const [[minLon, minLat], [maxLon, maxLat]] = d3.geoBounds({type:"FeatureCollection", features: africa});
//   const lonDiff = maxLon - minLon;
//   const latDiff = maxLat - minLat;
//   const scale = Math.min(width / (lonDiff*1.1), height / (latDiff*1.1)) * 150;

//   const projection = d3.geoMercator()
//     .center([(minLon+maxLon)/2, (minLat+maxLat)/2])
//     .scale(scale)
//     .translate([width/2, height/2]);

//   const path = d3.geoPath().projection(projection);

//   // Draw Africa
//   svg.append("g")
//     .selectAll("path")
//     .data(africa)
//     .enter()
//     .append("path")
//     .attr("d", path)
//     .attr("fill", "#ddd")
//     .attr("stroke", "#333")
//     .attr("stroke-width", 0.6);

//   // 2️⃣ Then load all CSVs and overlay red dots
//   Promise.all(africanFiles.map(f => d3.csv(f))).then(dfs => {
//     const allData = dfs.flat();
//     console.log("All African fire points loaded:", allData.length);

//     // svg.append("g")
//     //   .selectAll("circle")
//     //   .data(allData)
//     //   .enter()
//     //   .append("circle")
//     //   .attr("cx", d => projection([+d.longitude, +d.latitude])[0])
//     //   .attr("cy", d => projection([+d.longitude, +d.latitude])[1])
//     //   .attr("r", 2)
//     //   .attr("fill", "red");

//     ctx.fillStyle = "red";
//     allData.forEach(d => {
//       const [x, y] = projection([+d.longitude, +d.latitude]);
//       if (!isNaN(x) && !isNaN(y)) {
//         ctx.beginPath();
//         ctx.arc(x, y, 1.5, 0, Math.PI * 2);
//         ctx.fill();
//       }
//     });

//   });

// }).catch(err => console.error("LOAD ERROR:", err));
