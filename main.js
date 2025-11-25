// console.log("Main JS is running!");

// const svg = d3.select("svg");
// const width = window.innerWidth;
// const height = window.innerHeight;

// //adding canvas stuff --- begin
// const canvas = document.getElementById("dots");
// const ctx = canvas.getContext("2d");

// // match canvas size to device pixels
// canvas.width = window.innerWidth * window.devicePixelRatio;
// canvas.height = window.innerHeight * window.devicePixelRatio;
// ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
// //adding canvas stuff --- end

// // African country list
// const africanCountries = ['Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso',
//   'Burundi', 'Cameroon', 'Cape Verde', 'Central African Republic',
//   'Chad', 'Comoros', 'Cote d Ivoire',
//   'Democratic Republic of the Congo', 'Djibouti', 'Egypt',
//   'Equatorial Guinea', 'Eritrea', 'Ethiopia', 'Gabon', 'Ghana',
//   'Guinea-Bissau', 'Guinea', 'Kenya', 'Lesotho', 'Liberia', 'Libya',
//   'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius',
//   'Mayotte', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria',
//   'Republic of Congo', 'Reunion', 'Rwanda', 'Saint Helena',
//   'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone',
//   'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Swaziland',
//   'Tanzania', 'The Gambia', 'Togo', 'Tunisia', 'Uganda', 'Zambia',
//   'Zimbabwe'];

// // Map to filenames
// const africanFiles = africanCountries.map(c => `modis_2024_all_countries/modis/2024/modis_2024_${c.replace(/ /g, "_")}.csv`);

// let allData = []; // Store fire data globally once loaded

// // 1. Function to Draw/Redraw Everything
// function drawMap() {
//     // 1.1 Update Size Variables
//     const width = window.innerWidth;
//     const height = window.innerHeight;

//     // 1.2 Update Canvas Size (CRITICAL for high DPI and alignment)
//     canvas.width = width * window.devicePixelRatio;
//     canvas.height = height * window.devicePixelRatio;
//     ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

//     // 1.3 Clear previous drawing and SVG content
//     ctx.clearRect(0, 0, width, height); // Clear the canvas dots
//     svg.selectAll("*").remove(); // Clear the old SVG map elements

//     // 1.4 Projection Setup (Must be recalculated on resize)
//     // d3.json() is wrapped around the projection/drawing logic
//     d3.json("https://unpkg.com/world-atlas@2/countries-50m.json").then(world => {
//         const countries = topojson.feature(world, world.objects.countries).features;
//         const africa = countries.filter(d => {
//             const [[minX, minY], [maxX, maxY]] = d3.geoBounds(d);
//             return maxX > -20 && minX < 60 && maxY > -40 && minY < 40;
//         });

//         const [[minLon, minLat], [maxLon, maxLat]] = d3.geoBounds({ type: "FeatureCollection", features: africa });
//         const lonDiff = maxLon - minLon;
//         const latDiff = maxLat - minLat;
//         const scale = Math.min(width / (lonDiff * 1.1), height / (latDiff * 1.1)) * 150;

//         const projection = d3.geoMercator()
//             .center([(minLon + maxLon) / 2, (minLat + maxLat) / 2])
//             .scale(scale)
//             .translate([width / 2, height / 2]);

//         const path = d3.geoPath().projection(projection);

//         // Draw Africa (SVG Map)
//         svg.append("g")
//             .selectAll("path")
//             .data(africa)
//             .enter()
//             .append("path")
//             .attr("d", path)
//             .attr("fill", "#ddd")
//             .attr("stroke", "#333")
//             .attr("stroke-width", 0.6);

//         // 1.5 Draw Fire Dots (using the stored data and new projection)
//         ctx.fillStyle = "red";
//         allData.forEach(d => {
//             const [x, y] = projection([+d.longitude, +d.latitude]);
//             if (!isNaN(x) && !isNaN(y)) {
//                 ctx.beginPath();
//                 ctx.arc(x, y, 1.5, 0, Math.PI * 2);
//                 ctx.fill();
//             }
//         });
//     });
// }

// // 2. Load Data Once, Store It, and Initial Draw
// Promise.all(africanFiles.map(f => d3.csv(f))).then(dfs => {
//     allData = dfs.flat(); // Store the data globally
//     console.log("All African fire points loaded:", allData.length);
//     drawMap(); // Initial draw
// }).catch(err => console.error("LOAD ERROR:", err));

// // 3. Add Resize Listener (The key to fixing the extended screen issue)
// window.addEventListener("resize", drawMap);

// // // 1️⃣ Draw Africa first
// // d3.json("https://unpkg.com/world-atlas@2/countries-50m.json").then(world => {

// //   const countries = topojson.feature(world, world.objects.countries).features;

// //   const africa = countries.filter(d => {
// //     const [[minX, minY], [maxX, maxY]] = d3.geoBounds(d);
// //     return maxX > -20 && minX < 60 && maxY > -40 && minY < 40;
// //   });

// //   const [[minLon, minLat], [maxLon, maxLat]] = d3.geoBounds({type:"FeatureCollection", features: africa});
// //   const lonDiff = maxLon - minLon;
// //   const latDiff = maxLat - minLat;
// //   const scale = Math.min(width / (lonDiff*1.1), height / (latDiff*1.1)) * 150;

// //   const projection = d3.geoMercator()
// //     .center([(minLon+maxLon)/2, (minLat+maxLat)/2])
// //     .scale(scale)
// //     .translate([width/2, height/2]);

// //   const path = d3.geoPath().projection(projection);

// //   // Draw Africa
// //   svg.append("g")
// //     .selectAll("path")
// //     .data(africa)
// //     .enter()
// //     .append("path")
// //     .attr("d", path)
// //     .attr("fill", "#ddd")
// //     .attr("stroke", "#333")
// //     .attr("stroke-width", 0.6);

// //   // 2️⃣ Then load all CSVs and overlay red dots
// //   Promise.all(africanFiles.map(f => d3.csv(f))).then(dfs => {
// //     const allData = dfs.flat();
// //     console.log("All African fire points loaded:", allData.length);

// //     // svg.append("g")
// //     //   .selectAll("circle")
// //     //   .data(allData)
// //     //   .enter()
// //     //   .append("circle")
// //     //   .attr("cx", d => projection([+d.longitude, +d.latitude])[0])
// //     //   .attr("cy", d => projection([+d.longitude, +d.latitude])[1])
// //     //   .attr("r", 2)
// //     //   .attr("fill", "red");

// //     ctx.fillStyle = "red";
// //     allData.forEach(d => {
// //       const [x, y] = projection([+d.longitude, +d.latitude]);
// //       if (!isNaN(x) && !isNaN(y)) {
// //         ctx.beginPath();
// //         ctx.arc(x, y, 1.5, 0, Math.PI * 2);
// //         ctx.fill();
// //       }
// //     });

// //   });

// // }).catch(err => console.error("LOAD ERROR:", err));


console.log("Main JS is running!");

const svg = d3.select("svg");
const canvas = document.getElementById("dots");
const ctx = canvas.getContext("2d");

// --- 1. Continent Data Structure Definitions ---
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
    // NOTE: You must update the file paths below to match where your data for these continents is stored.
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
    // NOTE: You must update the file paths below to match where your data for these continents is stored.
};

// --- 2. Global State and Data Storage ---
let allData = {}; // Master object to store data: { "Africa": [{...}, {...}], "Asia": [...] }
let activeContinent = "Africa"; // Initial view

// --- 3. Filter Function called by onchange event ---
window.filterMap = function(continentName) {
    activeContinent = continentName;
    console.log(`Switching view to: ${activeContinent}`);
    drawMap(); // Redraw the map with the new filter
};

// --- 4. Function to Draw/Redraw Everything ---
function drawMap() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // ... (Canvas Setup, Clearing Context, and Filtering Data are unchanged) ...
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, width, height);
    svg.selectAll("*").remove();

    const filteredData = allData[activeContinent] || [];
    
    // 4.1 Projection Setup
    d3.json("https://unpkg.com/world-atlas@2/countries-50m.json").then(world => {
        const countries = topojson.feature(world, world.objects.countries).features;
        
        // --- 1. Filter the GeoJSON Features ---
        const countriesToDraw = CONTINENT_MAP[activeContinent];
        const mapFeatures = countries.filter(d => 
            // Filter by the country name property in the GeoJSON
            countriesToDraw.includes(d.properties.name)
        );

        if (mapFeatures.length === 0) {
            console.error(`Could not find map features for countries in ${activeContinent}. Check names in CONTINENT_DATA.`);
            return;
        }

        // --- 2. Calculate Bounds and Scale ---
        
        // Combine the filtered features into one GeoJSON collection to calculate the bounds
        const collection = { type: "FeatureCollection", features: mapFeatures };
        
        // d3.geoBounds calculates the [minLon, minLat], [maxLon, maxLat] of the collection
        const [[minLon, minLat], [maxLon, maxLat]] = d3.geoBounds(collection);
        
        // Calculate the center and size of the bounding box
        const centerLon = (minLon + maxLon) / 2;
        const centerLat = (minLat + maxLat) / 2;
        const lonDiff = maxLon - minLon;
        const latDiff = maxLat - minLat;

        // Use D3's fitSize method for more accurate scaling
        // This method automatically calculates the necessary scale and translation 
        // to fit the features into the desired screen size (width, height)
        const projection = d3.geoMercator()
            .fitSize([width, height], collection); 

        // If fitSize is not accurate enough or you need manual adjustment, use this calculation:
        /*
        const paddingRatio = 1.1; // 10% padding
        const scale = Math.min(width / (lonDiff * paddingRatio), height / (latDiff * paddingRatio)) * 170;
        
        const projection = d3.geoMercator()
            .center([centerLon, centerLat])
            .scale(scale)
            .translate([width / 2, height / 2]);
        */

        const path = d3.geoPath().projection(projection);

        // --- 3. Draw Map Features (SVG Map) ---
        svg.append("g")
            .selectAll("path")
            .data(mapFeatures) 
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "#ddd")
            .attr("stroke", "#333")
            .attr("stroke-width", 0.6);

        // --- 4. Draw Fire Dots (Canvas) ---
        ctx.fillStyle = "red";
        filteredData.forEach(d => {
            const [x, y] = projection([+d.longitude, +d.latitude]);
            if (!isNaN(x) && !isNaN(y)) {
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    });
}

// --- 5. Data Loading: Load all data into the 'allData' object ---
// Helper function to map country names to file paths
function getFilePathsForContinent(continent) {
    const countries = CONTINENT_DATA[continent];
    // NOTE: You MUST replace 'modis_2024_all_countries/modis/2024/' with the actual path
    // structure for each continent's data files if they are different.
    return countries.map(c => 
        `modis_2024_all_countries/modis/2024/modis_2024_${c.replace(/ /g, "_")}.csv`
    );
}

// Function to load data for a single continent
function loadContinentData(continent) {
    const files = getFilePathsForContinent(continent);
    const countries = CONTINENT_DATA[continent];

    return Promise.all(files.map((f, i) => 
        d3.csv(f).then(data => data.map(d => ({ ...d, country: countries[i] })))
    )).then(dfs => dfs.flat());
}

// Load all continents' data concurrently
const continentPromises = Object.keys(CONTINENT_DATA).map(continent => 
    loadContinentData(continent).then(data => ({ continent, data }))
);

Promise.all(continentPromises).then(results => {
    results.forEach(({ continent, data }) => {
        allData[continent] = data; // Store data in the master object
    });
    console.log("All continental fire points loaded:", Object.keys(allData).map(k => `${k}: ${allData[k].length}`).join(', '));
    drawMap(); // Initial draw with "Africa"
}).catch(err => console.error("LOAD ERROR:", err));

// Add Resize Listener
window.addEventListener("resize", drawMap);