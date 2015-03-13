$(document).ready(function() {
    console.log("Hello world.")
});

var margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var parseDate = d3.time.format("%Y").parse;

var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var color = d3.scale.ordinal()
  .domain(["Fatalities change", "Crashes change"])
  .range(["#FF0000", "#0000FF"]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickFormat(function(d){
      return d+"%";
    });


var line = d3.svg.line()
    .x(function(d) {
      return x(d.date);
    })
    .y(function(d) {
      return y(d.change);
    });

var svg = d3.select(".chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("js/crashes.csv", function(error, data) {


  data.forEach(function(d) {
    d.Yr = parseDate(d.Yr);
  });


  color.domain(d3.keys(data[0]).filter(function(key) {
    return key === "Fatalities change" || key === "Crashes change";
    //return key;
  }));

  /* ****************************************************** */
  // This is where we set up our data. It's a little complicated, but here's what's basically happening:
  // "color.domain()"" is an array of two values: ["Fatalities change", "Crashes change"].
  // We're creating an object for each, and types will be an array of those two objects.
  // Name is the name of the series: again, "Fatalities change" and "Crashes change".
  // And values is the date/value series, expressed as an array of objects.
  /* ****************************************************** */
  var types = color.domain().map(function(name) {
    return {
      name: name,
      values: data.map(function(d) {
        /* ****************************************************** */
        // This is where we set the set up each object for the values array.
        // I added crashes and fatalities to each data point, so we can see them on mouseover.
        // I also added series name variable, so we can see which line we're looking at.
        /* ****************************************************** */
        return {date: d.Yr, change: +d[name], crashes : d.Crashes, fatalities : d.Fatalities, seriesName : name};
      })
    };
  });

  x.domain(d3.extent(data, function(d) { return d.Yr; }));

  y.domain([
    d3.min(types, function(c) { return d3.min(c.values, function(v) { return v.change; }); }),
    d3.max(types, function(c) { return d3.max(c.values, function(v) { return v.change; }); })
  ]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Percent change");



  var type = svg.selectAll(".type")
      .data(types)
    .enter().append("g")
      .attr("class", "type");

 type.append("path")
      .attr("class", "line")
      .attr("d", function(d) {
        return line(d.values);
      })
      .style("stroke", function(d) { return color(d.name); });

  type.append("text")
      .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
      .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.change) + ")"; })
      .attr("x", 3)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });



/* ****************************************************** */
// Instad of appending dots to the svg, (svg.selectAll(".dot"))...
// We want to follow the same pattern as above.
// "var type" is a group created for each line, and the lines are appended to the group.
// So we actually want to append a series of dots to each line.
// Therefore, we append to type. (types.selectAll(".dot"))...
/* ****************************************************** */

type.selectAll(".dot")
    /* ****************************************************** */
    //And the data is the values array nested in the data object already attached to type.
    //This is really tricky, by the way. I'm not sure we covered this specific concept in class.
    /* ****************************************************** */
    .data(function(d) {
      return d.values;
    })
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", function(d) {
      return x(d.date);
    })
    .attr("cy", function(d) {
      return y(d.change);
    })
    .attr("r", 5)
    .on("mouseover", function(d) {  

      var yearFormat = d3.time.format("%Y");
      var dispDate = yearFormat(d.date);
      
      /* ****************************************************** */
      //Create two blank variables. We assign them below in the if/else
      /* ****************************************************** */
      var actualLabel;
      var actualVal;

      /* ****************************************************** */
      //Using the seriesName variable, we check to see which series we're looking at.
      //If it's Fatalities, we pull the fatalities total and set the label.
      //If it's crashes, we do the same for crashes.
      /* ****************************************************** */

      if (d.seriesName == "Fatalities change") {
        actualLabel = "Total Fatalities";
        actualVal = d.fatalities;
      } else {
        actualLabel = "Total Crashes";
        actualVal = d.crashes;
      }

      //Then I just append it all to the tooltip with some markup I can control in the css.
      $(".tt").html(
        "<div class='date'>"+dispDate+"</div>"+
        "<div class='val'>"+
          actualLabel+": <b>"+actualVal+"</b>"+
        "</div>"+
        "<div class='change'>"+
          "Change since 2004: <b>"+d.change+"%</b>"+
        "</div>"
      );

      d3.select(this).classed("active", true);

      $(".tt").show();
    })
  
    .on("mouseout", function(d) {
      d3.select(this).classed("active", false); 
      $(".tt").hide();
    })

    .on("mousemove", function(d) {
      var pos = d3.mouse(this);
      var left = pos[0] + margin.left + 15 - ($(".tt").outerWidth()/2);
      var top = pos[1] + margin.top - $(".tt").height() - 30;
      $(".tt").css({
        "left" : left+"px",
        "top" : top+"px"
      });
    });
});


   
   