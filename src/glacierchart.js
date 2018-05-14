
var mymap = L.map('mapid').setView([46.8, 8.9], 8);
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets', // alternative: mapbox.satellite
    accessToken: 'pk.eyJ1IjoiYW5kcmVhcy1rZWxsZXIiLCJhIjoiY2pneHZrY3ZnMW0yczMycGQzMGp1YXl5aSJ9.BJhSa5Htz16Rm-st7l5QaQ'
}).addTo(mymap);

var popups = {}

function newPopup(filename){
    var glacierdata;
    d3.csv(filename, function(error, data) {

        glacierdata = data
        var latitude = glacierdata[6]['col2']
        var longitude = glacierdata[6]['col3']
        latitude *= 1000
        longitude *= 1000

        var coordsGPS = Swisstopo.CHtoWGS(latitude, longitude);
        var marker = L.marker([coordsGPS[1], coordsGPS[0]]).addTo(mymap)

    // create svg canvas
        const canvHeight = 300, canvWidth = 500;
        var container = document.createElement("div")
        const svg = d3.select(container).append("svg")
            .attr("width", canvWidth)
            .attr("height", canvHeight)
            //.style("border", "1px solid");

    // calc the width and height depending on margins.
        const margin = {top: 20, right: 70, bottom: 30, left: 50};
        const width = canvWidth - margin.left - margin.right + 10;
        const height = canvHeight - margin.top - margin.bottom;

        svg.append("text")
            .attr("y", 0)
            .attr("x", canvWidth / 2)
            .attr("dy", "1em")
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .style("text-anchor", "middle")
            .text(glacierdata[0]['col2'])

    // create parent group and add left and top margin
        const g = svg.append("g")
            .attr("id", "chart-area")
            .attr("transform", "translate(" +margin.left + "," + margin.top + ")");

        const dataOnly = glacierdata.slice(11, glacierdata.length)

        const dataValues = d3.values(dataOnly)

        var lengthChangeDomain = d3.extent(dataValues, d => Number(d.col3)).reverse();

        if (lengthChangeDomain[0] < 0){
            lengthChangeDomain[0] = 0;
        }

        const yearDomain = d3.extent(dataValues, d => Number(d.col2))

        const xScale = d3.scaleLinear()
            .rangeRound([0,width])
            .domain(yearDomain)
            .nice(5);

        const yScale = d3.scaleLinear()
            .rangeRound([height,0])
            .domain(lengthChangeDomain);
        //.nice(5);

        // create xAxis
        const xAxis = d3.axisBottom(xScale)
        xAxis.tickFormat(d3.format(".4"))

        g.append("g")  // create a group and add axis
            .attr("transform", "translate(0," + height + ")").call(xAxis);

        // create yAxis
        const yAxis = d3.axisLeft(yScale);
        g.append("g")  // create a group and add axis
            .call(yAxis);

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - (height / 2))
            .attr("y", 0 - margin.left)
            .attr("dy", "1em")
            .attr("font-family", "sans-serif")
            .style("text-anchor", "middle")
            .text("Length Change (m)");

        var data_points = g.selectAll("rect")
            .data(dataValues)
            .enter()
            .append("rect")
            .attr("x", function(d){ return xScale(d.col2) + 2 })
            .attr("y", function(d) { return d.col3 < 0 ? yScale(d.col3) : yScale(0) })
            .attr("height", function(d) { return d.col3 < 0 ? yScale(0) - yScale(d.col3) : yScale(d.col3) - yScale(0) })
            .attr("width", "1")
            .attr("stroke", "lightgrey")
            //.text(function(d){return d.col3+""  });

        var tooltip = d3.select(container).append("div").classed("tooltip", true);

        data_points.on("mouseover", function(d, i) {
            tooltip
                .html(`${d.col3}m`)
                .style("visibility", "visible")
                .style("left", width + 20 + "px")  //d3.event.pageX
                .style("top",  margin.top + "px")  //d3.event.pageY
                .style("position", "absolute");
        })
            .on("mouseout", function(d,i) {
                tooltip.style("visibility", "hidden")
            });

        var cumLengthChangeDomain = d3.extent(dataValues, d => Number(d.col4)); //.reverse();
        const y2Scale = d3.scaleLinear()
            .rangeRound([height,0])
            .domain(cumLengthChangeDomain);
        const y2Axis = d3.axisRight(y2Scale);
        g.append("g")  // create a group and add axis
            .attr("transform","translate(" + width + " ,0)").call(y2Axis);
        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - (height / 2))
            .attr("y", 0 + canvWidth - margin.right)
            .attr("dy", "1em")
            .attr("font-family", "sans-serif")
            .style("text-anchor", "middle")
            .text("Cum. Length Change (m)");

        var data_points = g.selectAll("circle")
            .data(dataValues)
            .enter()
            .append("circle")
            .attr("cx", function(d){ return xScale(d.col2) + 2})
            .attr("cy", function(d) { return y2Scale(d.col4) })
            .attr("r", "1")
            .attr("fill", "black");

        var linedata = dataValues.map(x => [xScale(x.col2) + 2, y2Scale(x.col4)])
        var line = d3.line()
        g.append('path')
            .attr('d', line(linedata))
            .attr('fill', 'none')
            .attr('stroke', 'red')

        popups[filename] = L.popup({minWidth: 500})  //change accordingly
        popups[filename].setLatLng([coordsGPS[1], coordsGPS[0]])
        popups[filename].setContent(container)
        marker.on('click', onMapClick, popups[filename]);
    })
}

function onMapClick(){
   this.openOn(mymap);
}

//Load the data for the popups
d3.csv('./data/00_glaciers.csv', function(error, data){
    var glaciers = data;
    for (let i = 0; i < glaciers.length; i++ ) {
        newPopup('./data/' + glaciers[i].glaciername)
    }
})



