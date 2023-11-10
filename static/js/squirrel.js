// Define the URLs for the dataset
const metadata_url = "http://127.0.0.1:5000/metadata";
const appearance_url = "http://127.0.0.1:5000/appearance";
const activities_url = "http://127.0.0.1:5000/activities";
const interactions_url = "http://127.0.0.1:5000/interactions";

// Define the map parameters
let map_centre = [40.769361, -73.977655]; // Central Park. https://latitude.to/articles-by-country/us/united-states/605/central-park
let map_zoom = 11;

// Filter function to remove keys from an Object
let remove_keys = function(arr, ...args) {
    return arr.filter(val => !args.includes(val) )
};

//-------- PIE CHART --------//
function create_pie(interactions_data) {
    
    // console.log(interactions_data); 
  
  // counts
    let indifferent_count = 0
    let approaches_count = 0
    let runsFrom_count = 0
    let watching_count = 0
  
    for (let i= 0; i < interactions_data.length; i++ ){
  
        let indifferents = interactions_data[i].indifferent;
        let approach = interactions_data[i].approaches;
        let runsFrom = interactions_data[i].runs_from;
        let watch = interactions_data[i].watching;
        
        if(indifferents == 1){
            indifferent_count += 1
        }
        else if (approach == 1) {
            approaches_count += 1
        }
        else if (runsFrom == 1) {
            runsFrom_count += 1
        }
        else if (watch == 1) {
            watching_count += 1
        }
    }
  //}
  // diction
    let my_dict = {
      "Indifferent": indifferent_count,
      "Approaches": approaches_count,
      "Runs from": runsFrom_count,
      "Watching": watching_count
    };
    // console.log(my_dict)
   
  // my data
    let data = [{
      values: [indifferent_count, approaches_count, runsFrom_count, watching_count],
      labels: ['Indifferent', 'Approaches', 'Runs from', 'Watching'],
      type: 'pie'
    }];
    // layout
    let layout = {
      height: 500,
      width: 900
    };
    
    // 
    Plotly.newPlot('pie_chart', data, layout);
  
  };

console.log("Testing HTML");


//---------------- FUNCTION: CREATE THE BAR ----------------//
function create_bar(metadata_data, activities_data) {
    // Get the x-values
    let x_values = remove_keys(Object.keys(activities_data[0]), 'squirrel_id');
    let formatted_xvals = x_values.map(word => word[0].toUpperCase() + word.substring(1)); // capitalise each word

    // Define the objects that will hold the y-values
    let default_value = 0;
    let combined_values = Object.fromEntries(x_values.map(key => [key, default_value]));
    let spring_values = Object.fromEntries(x_values.map(key => [key, default_value])); // March / Spring
    let autumn_values = Object.fromEntries(x_values.map(key => [key, default_value])); // October / Autumn

    // Get the y-values
    for (let i=0; i<activities_data.length; i++) {
        let sighting = activities_data[i];
        let month = metadata_data[i].month;
        let num_activities = Object.keys(sighting).length - 1;

        // Loop through the different activities
        for (let j=0; j<num_activities; j++) {
            // Check if the sighting equivalent is true
            if (sighting[x_values[j]]) {
                // Increment the combined values
                combined_values[x_values[j]] += 1;

                // Increment spring_values if March / Spring
                if (month === 3) {
                    spring_values[x_values[j]] += 1;
                }
                // Increment autumn_values if October / Autumn
                else if (month === 10) {
                    autumn_values[x_values[j]] += 1;
                }
            }
        };
    };

    // Convert the y-values to a percentage of the season total
    let y_spring = percentRound(Object.values(spring_values));
    let y_autumn = percentRound(Object.values(autumn_values));

    //-------- CREATE THE BAR CHART --------//
    // Create the traces
    let spring_trace = {
        x: formatted_xvals,
        y: y_spring,
        type: 'bar',
        name: "Spring",
        marker: {color: chroma.lab(80,-20,50).hex()}
    };
    let autumn_trace = {
        x: formatted_xvals,
        y: y_autumn,
        type: 'bar',
        name: "Autumn",
        marker: {color: chroma.temperature(2000).hex()}
    };

    // Create a list of the traces
    let bar_data = [spring_trace, autumn_trace];

    // Define the plot layout
    let bar_layout = {
        title: "Squirrel Activity - Spring vs Autumn",
        xaxis: {
            title: {text: "Activity"},
            automargin: true
        },
        yaxis: {
            title: {text: "% of Season Total"},
            automargin: true
        }
    };

    // Create the plot
    Plotly.newPlot("bar", bar_data, bar_layout);
};


//---------------- FUNCTION: CREATE THE HEAT MAP ----------------//
function create_colourmap(metadata_data, appearance_data) {
    // Get the unique highlights
    let unique_highlights = remove_keys(Object.keys(appearance_data[0]), 'squirrel_id','primary_colour');

    // Get the primary colours
    let unique_primary = [];
    for (let i=0; i<appearance_data.length; i++) {
        // Check the value for each sighting
        let primary = appearance_data[i].primary_colour;

        // Append if not in the list
        if (!unique_primary.includes(primary)) {
            unique_primary.push(primary);
        };
    };

    // Define the objects that will hold the y-values
    let default_value = 0;
    let colourmap_values = [];
    
    for (let i=0; i<unique_primary.length; i++) {
        for (let j=0; j<unique_highlights.length; j++) {
            // Create an object that will hold the x, y, and value
            let combination = {};
            combination['x'] = unique_primary[i];
            combination['y'] = unique_highlights[j];
            combination['value'] = default_value;
            colourmap_values.push(combination);
        };
    };

    // Use a counter to account for squirrels with more than one highlight
    let multi_highlight = 0;

    for (let i=0; i<appearance_data.length; i++) {
        // Reset the counter for each sighting
        let count = 0;        
        for (let j=0; j<unique_highlights.length; j++) {
            let highlight_value = appearance_data[i][unique_highlights[j]];

            // Increment the counter for each highlight
            if (highlight_value === 1) {
                count += 1;
            };
        };

        //-------- SQUIRRELS WITH MORE THAN ONE HIGHLIGHT --------//
        if (count > 1) {
            console.log("More than one highlight");
        }
            
        //-------- SQUIRRELS WITH WITH ONLY ONE HIGHLIGHT --------//
        else {
            // Loop over the unique_primary, unique_highlights, and the colourmap_values
            for (let j=0; j<unique_primary.length; j++) {
                for (let k=0; k<unique_highlights.length; k++) {
                    for (let m=0; m<colourmap_values.length; m++) {

                        // Check multiple conditions to increment the correct value
                        if (colourmap_values[m].x === unique_primary[j] // match primary to the colourmap
                            && colourmap_values[m].y === unique_highlights[k] // match highlight to the colourmap
                            && appearance_data[i].primary_colour === unique_primary[j] // match the sighting to the primary
                           ) {
                            // Increment the value
                            if (appearance_data[i][unique_highlights[k]]) {
                                colourmap_values[m].value += 1;
                            };
                        };
                    };
                };
            };
        }
    };

    //-------- PARSE THE PARAMETERS FOR PLOTTING --------//
    // Flatten colourmap_values
    let condense_values = {};
    
    // Loop through each row of colourmap_values
    Object.values(colourmap_values).forEach(item => {
        // Get the x-value and the value at each row
        let key = item.x;
        let value = item.value;

        // While same x-value, push to that value
        if (condense_values[key]) {
            condense_values[key].push(value);
        }
        // Otherwise create a list with the value
        else {
            condense_values[key] = [value];
        };
    });

    // Define the values to use in the plot
    let colourmap_xval = unique_highlights;
    let colourmap_yval = Object.keys(condense_values);
    let colourmap_zval = Object.values(condense_values);    

    // Capitalise the x-values
    let formatted_xvals = colourmap_xval.map(word => word[0].toUpperCase() + word.substring(1)); // capitalise each word

    // Define the colour scale
    let colorscaleValue = [
        [0, "#7570b3"],
        [1, "#d95f02"]
    ];
    
    //-------- CREATE THE HEAT MAP --------//
    // Create the trace
    let heat_data = [{
        x: formatted_xvals,
        y: colourmap_yval,
        z: colourmap_zval,
        type: 'heatmap',
        colorscale: colorscaleValue
    }];

    // Define the plot layout
    let heat_layout = {
        title: "Primary vs (Single) Highlight Distribution",
        xaxis: {
            title: {
                text: "Highlight Colour"
            },
            automargin: true
        },
        yaxis: {
            title: {
                text: "Primary Colour",
                standoff: 10
            },
            automargin: true
        },
        margin: {t: 30}
    };

    // Create the plot
    Plotly.newPlot("colour_heatmap", heat_data, heat_layout);
};


//---------------- FUNCTION: CREATE THE RADAR PLOT ----------------//
function create_radar(metadata_data, interactions_data) {
    // Get the unique interactions    
    let unique_interactions = remove_keys(Object.keys(interactions_data[0]), 'squirrel_id');

    // Capitalise each word and replace underscores with spaces
    let formatted_interactions = unique_interactions.map(word => word[0].toUpperCase() + word.substring(1).replace("_", " "));
    
    // Initialise objects to hold the values
    let default_value = 0;
    let spring_interactions = Object.fromEntries(unique_interactions.map(key => [key, default_value])); // March / Spring
    let autumn_interactions = Object.fromEntries(unique_interactions.map(key => [key, default_value])); // October / Autumn

    // Separate the interactions by month and type
    for (let i=0; i<unique_interactions.length; i++) {
        for (let j=0; j<interactions_data.length; j++) {
            if (interactions_data[j][unique_interactions[i]]) {
                if (metadata_data[j].month === 3) { // Spring
                    spring_interactions[unique_interactions[i]] += 1;
                }
                else if (metadata_data[j].month === 10) { // Autumn
                    autumn_interactions[unique_interactions[i]] += 1;
                }
            }
        };
    };

    // Convert the y-values to a percentage of the season total
    let r_spring = percentRound(Object.values(spring_interactions));
    let r_autumn = percentRound(Object.values(autumn_interactions));

    //-------- CREATE THE RADAR PLOT --------//
    // Create the traces
    let spring_trace = {
        r: r_spring,
        theta: formatted_interactions,
        fill: 'toself',
        name: "Spring",
        type: 'scatterpolar'
    };
    let autumn_trace = {
        r: r_autumn,
        theta: formatted_interactions,
        fill: 'toself',
        name: "Autumn",
        type: 'scatterpolar'
    };

    // Create a list of the traces
    let radar_data = [spring_trace, autumn_trace];

    // Define the plot layout
    let radar_layout = {
        title: "Squirrel Behaviour - Interactions<br>(Percentage of Season Total)",
        legend: {
            x: 0.7,
            y: 0.9
        },
        margin: {t: 120}
    };

    // Create the plot
    Plotly.newPlot("interaction_radar", radar_data, radar_layout);
};









function create_map(
    autumn_layer, spring_layer,
    heat_layer, autumn_heat, spring_heat,
    primary_black_layer, primary_cinnamon_layer, primary_gray_layer,
    chasing_layer, climbing_layer, digging_layer, eating_layer,
    foraging_layer, running_layer, shouting_layer, sitting_layer
) {
    // Create the street tile layer
    let street_tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy;\
            <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>\
            contributors &copy;\
            <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    });

    // Create the base maps object
    let base_maps = {
        Street: street_tiles
    };

    // Create overlay maps object
    let overlay_maps = {
        Heat: heat_layer,
        Autumn: autumn_layer,
        Spring: spring_layer,
        Autumn_Heatmap: autumn_heat,
        Spring_Heatmap: spring_heat,
        Primary_Black: primary_black_layer,
        Primary_Cinnamon: primary_cinnamon_layer,
        Primary_Gray: primary_gray_layer,
        Chasing: chasing_layer,
        Climbing: climbing_layer,
        Digging: digging_layer,
        Eating: eating_layer,
        Foraging: foraging_layer,
        Running: running_layer,
        Shouting: shouting_layer,
        Sitting: sitting_layer
    };

    // Create the map
    let my_map = L.map("map", {
        center: map_centre,
        zoom: map_zoom,
        layers: [street_tiles],
        worldCopyJump: true
    });

    // Create the layer control and add to the map
    L.control.layers(base_maps, overlay_maps).addTo(my_map);
    
};

function create_map_markers(metadata_data, appearance_data, activities_data) {
    // console.log(location_data)

    let autumn_markers = [];
    let spring_markers = [];
    let autumn_heatmarkers = [];
    let spring_heatmarkers = [];
    let heat_array = [];

    let primary_black = [];
    let primary_cinnamon = [];
    let primary_gray = [];

    let chasing = [];
    let climbing = [];
    let digging = [];
    let eating = [];
    let foraging = [];
    let running = [];
    let shouting = [];
    let sitting = [];
    
    for (let i=0; i<metadata_data.length; i++) {
        
        // console.log(activities_data[i]);
        
        let latitude = metadata_data[i].latitude
        let longitude = metadata_data[i].longitude
        let month = metadata_data[i].month

        let marker = L.circleMarker([latitude, longitude], {
            radius: 10
        });

        heat_array.push([latitude, longitude]);

        if (month === 10) {
            autumn_markers.push(marker);
            autumn_heatmarkers.push([latitude, longitude]);
        }
        else {
            spring_markers.push(marker);
            spring_heatmarkers.push([latitude, longitude]);
        }

        //-------- APPEARANCE DATA --------//
        let primary_colour = appearance_data[i].primary_colour
        
        if (primary_colour === "Black") {
            primary_black.push(marker);
        }
        else if (primary_colour === "Cinnamon") {
            primary_cinnamon.push(marker);
        }
        else if (primary_colour === "Gray") {
            primary_gray.push(marker);
        }

        //-------- ACTIVITIES --------//
        if (activities_data[i].chasing) {
            chasing.push(marker);
        }
        if (activities_data[i].climbing) {
            climbing.push(marker);
        }
        if (activities_data[i].digging) {
            digging.push(marker);
        }
        if (activities_data[i].eating) {
            eating.push(marker);
        }
        if (activities_data[i].foraging) {
            foraging.push(marker);
        }
        if (activities_data[i].running) {
            running.push(marker);
        }
        if (activities_data[i].shouting) {
            shouting.push(marker);
        }
        if (activities_data[i].sitting) {
            sitting.push(marker);
        }
        
    };

    
    //-------- LAYERS --------//
    let autumn_layer = L.layerGroup(autumn_markers);
    let spring_layer = L.layerGroup(spring_markers);

    let heat_layer = L.heatLayer(heat_array, {
        radius: 10,
        blur: 5
    });
    
    let autumn_heat = L.heatLayer(autumn_heatmarkers, {
        radius: 10,
        blur: 5
    });
    let spring_heat = L.heatLayer(spring_heatmarkers, {
        radius: 10,
        blur: 5
    });

    let primary_black_layer = L.layerGroup(primary_black);
    let primary_cinnamon_layer = L.layerGroup(primary_cinnamon);
    let primary_gray_layer = L.layerGroup(primary_gray);

    let chasing_layer = L.layerGroup(chasing);
    let climbing_layer = L.layerGroup(climbing);
    let digging_layer = L.layerGroup(digging);
    let eating_layer = L.layerGroup(eating);
    let foraging_layer = L.layerGroup(foraging);
    let running_layer = L.layerGroup(running);
    let shouting_layer = L.layerGroup(shouting);
    let sitting_layer = L.layerGroup(sitting);
    
    create_map(
        autumn_layer, spring_layer,
        heat_layer, autumn_heat, spring_heat,
        primary_black_layer, primary_cinnamon_layer, primary_gray_layer,
        chasing_layer, climbing_layer, digging_layer, eating_layer,
        foraging_layer, running_layer, shouting_layer, sitting_layer
    );
};



// const url = "localhost:8000/locations";
console.log("HERE??");

d3.json(metadata_url).then(function(metadata_data) {
    d3.json(appearance_url).then(function(appearance_data) {
        d3.json(activities_url).then(function(activities_data) {
            d3.json(interactions_url).then(function(interactions_data) {
                // create_plots(location_data, appearance_data, activities_data, interactions_data);
                create_map_markers(metadata_data, appearance_data, activities_data);
                create_bar(metadata_data, activities_data);
                create_colourmap(metadata_data, appearance_data);
                create_pie(interactions_data);
                create_radar(metadata_data, interactions_data);
            });
        });
    });
});

// let rawdata = require('static/data/locations.json');
// console.log(rawdata);