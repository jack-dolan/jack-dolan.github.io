
// enter code to define margin and dimensions for svg
var margin = { top: 95, right: 150, bottom: 70, left: 90 },
    width = 1000 - margin.left - margin.right,
    height = 550 - margin.top - margin.bottom;
    // height + margin.top + margin.bottom
// enter code to create svg
var svg = d3.select("#choropleth").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr('class', 'map');

// enter code to create color scale
var low_domain = -20;
var high_domain = 20;
var color = d3.scaleQuantize()
    .domain([low_domain, high_domain])
    //.range(["#eff3ff", "#bdd7e7", "#6baed6", "#2171b5"]);
    .range(["#fef0d9", "#fdcc8a", "#fc8d59", "#d7301f"]);
var Politicalcolor = d => {
    if (d >= -1.0 && d <= 1.0) { return "#969696" }    // Toss  >> gray
    else if (d >= -5.0 && d < -1.0) { return "#EEA297" }    // Trump >> light red
    else if (d > 1.0 && d <= 5.0) { return "#a6d2eb" }    // Biden >> light blue
    else if (d < -5.0) { return "#db1035" }    // Trump
    else if (d > 5.0) { return " #2895d6" }    // Biden
    else { return "yellow" }    // Just in case something is missing
}
//Creating Electoral College Bar
 //Make an SVG Container
 var svgContainer = d3.select("body").append("svg")
                                     .attr("width", 1000)
                                     .attr("height", 100);

 //Draw the Rectangle
var Sumtext = svgContainer.append("text")
    .attr("x", 180)
    .attr("y", 30)
    .attr("font-size", "1.5em")
    .attr("color", "black")
    .attr('font-weight', 'bold')
    .text("Electoral Votes Distribution by Twitter Sentiments");
var Bidenrectangle = svgContainer.append("rect")
    .attr("x", 80)
    .attr("y", 40)
    .attr("width", 397)
    .attr("height", 50)
    .style("fill", " #2895d6");
var Bidentext = svgContainer.append("text")
    .attr("x", 260)
    .attr("y", 75)
    .attr("font-size", "2em")
    .attr("color", "black")
    .text("287");

var Neutralrectangle = svgContainer.append("rect")
    .attr("x", 477)
    .attr("y", 40)
    .attr("width", 156)
    .attr("height", 50)
    .style("fill", " #969696");
var Neutraltext = svgContainer.append("text")
    .attr("x", 530)
    .attr("y", 75)
    .attr("font-size", "2em")
    .attr("color", "black")
    .text("156");

var Trumprectangle = svgContainer.append("rect")
    .attr("x", 633)
    .attr("y", 40)
    .attr("width", 187)
    .attr("height", 50)
    .style("fill", " #db1035");
var Trumptext = svgContainer.append("text")
    .attr("x", 700)
    .attr("y", 75)
    .attr("font-size", "2em")
    .attr("color", "black")
    .text("187");

// enter code to define tooltip
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function (d) {
        return "<strong>State: </strong><span class='details'>" + d.properties.name +
            "<br></span><strong>Electoral College: </strong><span class='details'>" + myformat(CollegeByState[d.properties.name]) + "</span>" +
            "<br></span><strong>Biden: </strong><span class='details'>" + myformat(BidenByState[d.properties.name]) + "</span>" +
            "<br></span><strong>Trump: </strong><span class='details'>" + myformat(TrumpByState[d.properties.name]) + "</span>" +
            "<br></span><strong>Difference: </strong><span class='details'>" + Math.abs(myformat(PrefDiffByState[d.properties.name])) + "</span>"
    }
    );
svg.call(tip);

// Code to find the min/max (source: https://stackoverflow.com/)
const getMin = object => {
    return Object.keys(object).filter(x => {
        return object[x] == Math.min.apply(null,
            Object.values(object));
    });
};
const getMax = object => {
    return Object.keys(object).filter(x => {
        return object[x] == Math.max.apply(null,
            Object.values(object));
    });
};

// enter code to define projection and path required for Choropleth
const projection = d3.geoAlbersUsa()
    .scale(1070)
    //  .rotate([96, 0, 0])
    .translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

// define any other global variables 
const format = d3.format(",");
const myformat = function (n) { if (n) { return format(n) } else { return 'N/A' } };
var selectedGame = 'Alabama';
var BidenByState = {};
var TrumpByState = {};
var CollegeByState = {};

// Source of us-states.json: https://github.com/PublicaMundi/MappingAPI/blob/master/data/geojson/us-states.json
Promise.all([
    // enter code to read files
    d3.json('us-states.json'),
    d3.csv('states-aggregates_v2.csv'),
    d3.csv('words-counts_2020-11-14.csv')
    //d3.csv ('words-counts-biden.csv')
    //d3.csv ('words-counts-trump.csv')
]).then(
    // enter code to call ready() with required arguments
    d => ready(null, d[0], d[1], d[2])
);

// this function should be called once the data from files have been read
// states (us-states.json): geo-json of US States
// aggData (states-aggregates.csv): Aggregate data by US State

function ready(error, states, aggData, wordsCount) {
    // enter code to extract all unique States from aggData
    var stateList = []
    aggData.forEach(d => { stateList.push(d.State); });
    stateList = d3.set(stateList).values();
    stateList = stateList.sort();

    // enter code to append the state options to the dropdown
    d3.select('select.GameSelect')
        .on('change', () => update())
        .selectAll('option')
        .data(stateList)
        .enter()
        .append('option')
        .attr('value', d => d)
        .text(d => d)

    // event listener for the dropdown. Update choropleth and legend when selection changes. Call createMapAndLegend() with required arguments.
    function update() {
        selectedGame = d3.select('select.GameSelect').property('value')
        createMapAndLegend(states, aggData, selectedGame, wordsCount);
    };

    // create Choropleth with default option. Call createMapAndLegend() with required arguments. 
    createMapAndLegend(states, aggData, selectedGame, wordsCount);
};

// this function should create a Choropleth and legend using the states and aggData arguments for a selectedGame
// also use this function to update Choropleth and legend when a different game is selected from the dropdown
function createMapAndLegend(states, aggData, selectedGame, wordsCount) {

    // Create a Dictionary of Biden preference by State
    BidenByState = {};
    aggData.forEach(d => { BidenByState[d.State] = d.Biden; });
    // Create a Dictionary of Trump preference by State
    TrumpByState = {};
    aggData.forEach(d => { TrumpByState[d.State] = d.Trump; });
    // Create a Dictionary of Electoral College by State
    CollegeByState = {};
    aggData.forEach(d => { CollegeByState[d.State] = d.ElectoralCollege; });
    // Create a Dictionary of Prefference Diff by State
    PrefDiffByState = {};
    aggData.forEach(d => { PrefDiffByState[d.State] = d.preference_diff; });
    // Create a Dictionary: State-name : State-Code
    StateByName = {};
    aggData.forEach(d => { StateByName[d.State] = d.stateCode; });


    stateAbbr = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "AS", "FM", "GU", "MH", "MP", "PW", "PR", "UM", "VI"]


    // Calculate min/max give the data and the selected game
    low_domain = PrefDiffByState[getMin(PrefDiffByState)[0]];
    high_domain = PrefDiffByState[getMax(PrefDiffByState)[0]];

    svg.append('g')
        .attr('class', 'countries')
        .selectAll('path')
        .data(states.features)
        .enter().append('path')
        .attr('d', path)
        .attr('fill', function (d) { return Politicalcolor(PrefDiffByState[d.properties.name]) })
        .style('stroke', 'white')
        .style('opacity', 0.95)
        .style('stroke-width', 0.3)
        .on('mouseover', function (d) {
            tip.show(d);
            d3.select(this)
                .style('opacity', 1)
                .style('stroke-width', 2.5)
                .style('stroke', 'black');
        })
        .on('mouseout', function (d) {
            tip.hide(d);
            d3.select(this)
                .style('opacity',0.95)
                .style('stroke-width', 0.3)
                .style('stroke', 'white');
        });

    //label state names
    svg.append("g")
        .attr("class", "states-names")
        .selectAll("text")
        .data(states.features)
        .enter()
        .append("svg:text")
        .text(function (d, i) {
            return stateAbbr[i];
        })
        .attr("x", function (d) {
            return path.centroid(d)[0];
        })
        .attr("y", function (d) {
            return path.centroid(d)[1];
        })
        .attr("text-anchor", "middle")
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .attr('font-size', '12px');

    // Legend code

    // var legenddata = ["pro trump", "leaning trump", "neutral", "leaning biden", "pro biden"]

    // svg.append("g")
    //     .attr("class", "legendQuant")
    //     .attr("transform", "translate(20,5)");

    // var legend = d3.legendColor()
    //     .labelFormat(d3.format(".2f"))
    //     .useClass(false)
    //     .scale(color)

    // svg.select(".legendQuant").call(legend);



    // ==================================================================================================================
    // ==================================================================================================================
    // ==================================================================================================================
    // ==================================================================================================================
    // Word Cloud
    // ==================================================================================================================
    // ==================================================================================================================
    // ==================================================================================================================
    // ==================================================================================================================


    // Calculate min/max give the data and the selected game
    myCounts = [];
    wordsCount.forEach(d => { myCounts.push(+d[StateByName[selectedGame] + "_count"]); });
    w_low_domain = Math.min.apply(null, myCounts);
    w_high_domain = Math.max.apply(null, myCounts);

    var textSize = d3.scaleLinear()
        .domain([w_low_domain, w_high_domain])
        .range([30, 95]);

    var myWords = [];
    wordsCount.forEach(d => { myWords.push({ word: d[StateByName[selectedGame]], size: Math.round(textSize(+d[StateByName[selectedGame] + "_count"]), 0) }) });

    var fill = d3.scaleOrdinal(d3.schemeCategory10);

    // Remove (if exists) the svg that holds the bar graph
    d3.select("#chart").selectAll("svg").remove();

    // Source: https://www.d3-graph-gallery.com/graph/wordcloud_size.html            
    // append the svg object to the body of the page
    var svg_2 = d3.select("#chart").append("svg")
        .attr("width", width*2 + margin.left + margin.right)
        // + margin.left + margin.right
        .attr("height", (height) + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top * 0.1 + ")");

    // Constructs a new cloud layout instance. It run an algorithm to find the position of words that suits your requirements
    // Wordcloud features that are different from one word to the other must be here
    var layout = d3.layout.cloud()
        .size([width, height])
        .words(myWords.map(function (d) { return { text: d.word, size: d.size }; }))
        .padding(5)        //space between words
        .rotate(function () { return ~~(Math.random() * 2) * 90; })
        .fontSize(function (d) { return d.size; })      // font size of words
        .on("end", draw);
    layout.start();


    // This function takes the output of 'layout' above and draw the words
    // Wordcloud features that are THE SAME from one word to the other can be here
    function draw(words) {
        svg_2
            .append("g")
            .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", function (d) { return d.size; })
            //.style("fill", "#69b3a2")
            .style("fill", function (d, i) { return fill(i); })
            .attr("text-anchor", "middle")
            .style("font-family", "Impact")
            .attr("transform", function (d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function (d) { return d.text; });
    }

    // ==================================================================================================================
    // ==================================================================================================================
    // ==================================================================================================================
    // ==================================================================================================================

};
