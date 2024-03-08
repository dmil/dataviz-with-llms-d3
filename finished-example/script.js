// Read the data
d3.csv("../bills-with-embeddings.csv").then(function(data) {
    // Parse the data
    data.forEach(function(d) {
      d.x = +d.x;
      d.y = +d.y;
    });
  
    // Set margins and dimensions for the scatterplot
    var margin = {top: 20, right: 20, bottom: 50, left: 50},
        width = 800 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;
  
    // Create SVG container
    var svg = d3.select("#scatterplot")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
    // Create tooltip
    var tooltip = d3.select("#scatterplot")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
  
    // Create scales for x and y axes
    var xScale = d3.scaleLinear()
      .domain(d3.extent(data, function(d) { return d.x; }))
      .range([0, width]);
  
    var yScale = d3.scaleLinear()
      .domain(d3.extent(data, function(d) { return d.y; }))
      .range([height, 0]);
  
    // Create scatterplot
    var dots = svg.selectAll(".dot")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 5)
      .attr("cx", function(d) { return xScale(d.x); })
      .attr("cy", function(d) { return yScale(d.y); })
      .attr("opacity", 1) // Set initial opacity to 1
      .on("mouseover", function(event, d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html("Bill Number: " + d["Bill Number"] + "<br/>" +
                     "Name: " + d.Name + "<br/>" +
                     "Last Action: " + d["Last Action"] + "<br/>" +
                     "Action Date: " + d["Action Date"])
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
        
        // Update details text box
        d3.select("#bill-number").text("Bill Number: " + d["Bill Number"]);
        d3.select("#bill-name").text("Name: " + d.Name);
        d3.select("#last-action").text("Last Action: " + d["Last Action"]);
        d3.select("#action-date").text("Action Date: " + d["Action Date"]);
        d3.select("#bill-summary").text("Summary: " + d.Summary);
      })
      .on("mouseout", function(d) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });
  
    // Add x axis
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScale));
  
    // Add y axis
    svg.append("g")
      .call(d3.axisLeft(yScale));
  
    // Add search functionality
    d3.select("#search")
      .on("keyup", function() {
        var searchText = this.value.toLowerCase();
        var filteredData = data.filter(function(d) {
          return d.Name.toLowerCase().includes(searchText);
        });
  
        // Update opacity and remove event listeners based on search result
        dots.attr("opacity", function(d) {
          var isSelected = filteredData.includes(d);
          if (!isSelected) {
            d3.select(this).on("mouseover", null).on("mouseout", null); // Remove event listeners
          }
          return isSelected ? 1 : 0.1;
        });
      });
  
    // Add event listener to the dropdown box to filter dots by "Bill Progress"
    d3.select("#progress-filter")
      .on("change", function() {
        var selectedProgress = this.value;
        dots.attr("opacity", function(d) {
          return d["Bill Progress"] === selectedProgress || selectedProgress === "" ? 1 : 0.1;
        });
      });
  });
  