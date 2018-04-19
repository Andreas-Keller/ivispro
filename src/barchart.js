// create svg canvas
const canvHeight = 600, canvWidth = 800;
const svg = d3.select("body").append("svg")
    .attr("width", canvWidth)
    .attr("height", canvHeight)
    .style("border", "1px solid");

// calc the width and height depending on margins.
const margin = {top: 50, right: 80, bottom: 50, left: 60};
const width = canvWidth - margin.left - margin.right;
const height = canvHeight - margin.top - margin.bottom;

// create parent group and add left and top margin
const g = svg.append("g")
    .attr("id", "chart-area")
    .attr("transform", "translate(" +margin.left + "," + margin.top + ")");


d3.csv('./data/who-life-expectancy-by-country.csv', function(error, data) {
    
    const dataNested = d3.nest()
        .key(function(d) { return d.Year; }).sortKeys(d3.ascending)
        //.key(function(d) { return d.Country; }).sortKeys(d3.ascending)
        .entries(data);

    //console.log(dataNested[0]);

    const dataN = Object.values(dataNested[0])[1];

    console.log(dataN);

    const lifeExpectancyDomain = d3.extent(dataN, d => Number(d.LifeExpectancyAtBirth));

    //const countriesDomain = d3.set(dataN, d => d.Country);

    const countriesDomain = [185,0];

    // create scales for x and y direction
    const xScale = d3.scaleLinear()
        .rangeRound([0,width])
        .domain(lifeExpectancyDomain)
        .nice(5);

    const yScale = d3.scaleLinear()
        .rangeRound([0,height])
        .domain(countriesDomain);
        //.nice(5);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // create xAxis
    const xAxis = d3.axisBottom(xScale);
    g.append("g")  // create a group and add axis
        .attr("transform", "translate(0," + height + ")").call(xAxis);

    // create yAxis
    const yAxis = d3.axisLeft(yScale);
    g.append("g")  // create a group and add axis
        .call(yAxis);

    // add circle
    var data_points = g.selectAll("rect")  // this is just an empty placeholder
        .data(dataN)
        .enter()
        .append("rect")
        .attr("x", 5)
        .attr("y", (d,i)=> yScale(i)-3)
        .attr("width", function(d) { return xScale(d.LifeExpectancyAtBirth) +"" })
        .attr("height", "1")
        .attr("stroke", "green")
        .text(function(d){return d.Country+"" })

    var tooltip = d3.select("body").append("div").classed("tooltip", true);

    data_points.on("mouseover", function(d, i) {
        tooltip
            .html(`Country: ${d.Country}<br/>`
                + `LifeExpectancy: ${d.LifeExpectancyAtBirth}<br/>`)
            .style("visibility", "visible")
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
    })
        .on("mouseout", function(d,i) {
            tooltip.style("visibility", "hidden")
        });
});

svg.append("text")
    .attr("y", 10)
    .attr("x", canvWidth / 2)
    .attr("dy", "1em")
    .attr("font-family", "sans-serif")
    .attr("font-size", "26px")
    .style("text-anchor", "middle")
    .text("Life Expectancy in 2002 worldwide");