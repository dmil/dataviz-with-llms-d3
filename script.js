document.addEventListener("DOMContentLoaded", function() {

  // Load data from CSV file
  d3.csv("bills-with-nlp.csv").then(function(data) {
    // Convert x and y values to numbers
    data.forEach(function(d) {
      d.x = +d.x;
      d.y = +d.y;
      d.id = +d.id;
      d.publish_date = new Date(d.publish_date); // Convert publish_date to Date object
    });

    // set initial variables
    const margin = {
      top: 60,
      right: 30,
      bottom: 40,
      left: 50
    };

    // check if the window width is less than 800px
    let widthRaw;
    if (window.innerWidth < 800) {
      widthRaw = window.innerWidth;
    } else {
      widthRaw = 800;
    }

    const heightRaw = widthRaw / 8 * 5;
    const width = widthRaw - margin.left - margin.right;
    const height = heightRaw - margin.top - margin.bottom;
    let tooltip;
    let searchText = document.getElementById("searchBox").value.trim().toLowerCase();

    /* DRAW CHART */
    // Create SVG element
    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.x))
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.y))
      .range([height, 0]);

    // Create dots
    const dots = svg.selectAll(".dot")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", heightRaw/100)
      .attr("title", d => d.title)
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

    /* Tooltip functions */

    function makeTooltip(d) {
      tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 40) + "px");

      tooltip.append("div")
        .attr("class", "tooltip-title")
        .text(d.title);

      tooltip.append("div")
        .attr("class", "tooltip-publish-date")
        .text("Published on " + d.publish_date.toDateString());
    }

    function handleMouseOver(d) {
      d.selected = true;

      // make the dot bigger and highlight it
      d3.select(this)
        .attr("r", heightRaw/50)
        .classed("highlighted-dot", true)
        .raise();

      // make tooltip
      makeTooltip(d);
    }

    function handleMouseOut(d) {
      d.selected = false;

      // make the dot smaller and remove highlight
      d3.select(this)
        .attr("r", 5)
        .classed("highlighted-dot", false)

      // remove tooltip
      d3.select(".tooltip").remove();
    }

    function clearScatterPlot() {
      // remove unfiltered-dot class from everything
      filterData();
      updateScatterPlot();
    }

    // Create fucntion to filter datapoints based on text box contents
    function filterData() {
      if (searchText === "" | searchText === undefined) {
        // remove selected property from all data points
        data.forEach(d => delete d.selected);
      } else if (searchText === "wind") {
        console.log("exclude 'wind river'");
        const regexPattern = new RegExp(`\\b${searchText.trim()}\\b`, 'i');
        // if the title matches the regex pattern and excludes the phrase "wind river", add the selected property
        data.forEach(d => {
          if (regexPattern.test(d.title) && !d.title.toLowerCase().includes("wind river")) {
            d.selected = true;
          } else {
            delete d.selected;
          }
        })
      } else {
        const regexPattern = new RegExp(`\\b${searchText.trim()}\\b`, 'i');
        // if the title matches the regex pattern, add the selected property
        data.forEach(d => {
          if (regexPattern.test(d.title)) {
            d.selected = true;
          } else {
            delete d.selected;
          }
        })
      }
    };

    function updateSearchText() {
      searchText = document.getElementById("searchBox").value.trim().toLowerCase();
    }

    function updateScatterPlot() {

      if (searchText === "" | searchText === undefined) {
        // show all dots and allow hover, remove filtered-dot class from everything
        d3.selectAll(".dot")
          .classed("filtered-dot", false)
          .classed("unfiltered-dot", false)
          .on("mouseover", handleMouseOver)
          .on("mouseout", handleMouseOut)
          .raise();
      } else {
        // color the filtred dots, only allow hover on filtered dots
        dots
          .on("mouseover", null)
          .on("mouseout", null)
          .classed("filtered-dot", d => d.selected)
          .classed("unfiltered-dot", d => !d.selected);
          
        d3.selectAll(".dot.filtered-dot")
          .on("mouseover", handleMouseOver)
          .on("mouseout", handleMouseOut)
          .raise();
      }

    };

    // Function to format the publish date as "YYYY-MM-DD"
    function formatDate(date) {
      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      };
      return new Date(date).toLocaleDateString(undefined, options);
    }

    // Function to highlight the search query within the title
    function highlightTitle(title) {
      searchText = document.getElementById("searchBox").value.trim().toLowerCase();
      const regex = new RegExp(searchText, "gi");
      return title.replace(regex, match => `<span class="highlight">${match}</span>`);
    }

    // Function to update the table with filtered data
    function updateHeadlineTable() {
      const tableBody = d3.select("#headline-table-body");

      // Remove existing rows from the table
      tableBody.selectAll("tr").remove();

      // Sort the filtered data by publish_date in descending order
      const filteredData = data.filter(d => d.selected);
      filteredData.sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date));

      // Create new rows for each data point and populate the table
      const rows = tableBody.selectAll("tr")
        .data(filteredData)
        .enter()
        .append("tr");

      // Populate the rows with title and publish_date information
      rows.append("td").html(d => highlightTitle(d.title)); // Use the highlightTitle function
      // add x,y values as a attribute on the row
      rows.attr("data-title", d => d.title);
      rows.append("td").text(d => formatDate(d.publish_date));

      // Bind mouseover and mouseout events to each row in the table
      const tableRows = document.querySelectorAll("#headline-table tbody tr");
      tableRows.forEach(row => {
        const title = row.getAttribute("data-title");
        const dataPoint = data.find(d => d.title === title);
        row.addEventListener("mouseover", () => handleRowMouseOver(dataPoint));
        row.addEventListener("mouseout", () => handleRowMouseOut(dataPoint));
      });

    }

    function handleRowMouseOver(dataPoint) {
      dataPoint.selected = true;
      if (dataPoint) {
        // Change the color of the corresponding dot
        const correspondingDot = svg.selectAll(".dot")
          .filter(d => d.title === dataPoint.title);

        // loop through correspondingDot
        correspondingDot.each(function(d) {
          d3.select(this)
            .attr("r", 10)
            .classed("highlighted-dot", true)
            .raise();

          const correspondingRow = d3.select(`#headline-table tbody tr[data-title="${dataPoint.title}"]`);
          correspondingRow
            .classed("highlighted-row", true)
        });
      }
    }

    function handleRowMouseOut(dataPoint) {
      dataPoint.selected = false;
      if (dataPoint) {
        // Change the color of the corresponding dot back to its original color
        const correspondingDot = svg.selectAll(".dot")
          .filter(d => d.title === dataPoint.title);
        // loop through correspondingDot
        correspondingDot.each(function(d) {
          d3.select(this)
            .classed("highlighted-dot", false)
            .attr("r", heightRaw/100);

          const correspondingRow = d3.select(`#headline-table tbody tr[data-title="${dataPoint.title}"]`);
          correspondingRow.classed("highlighted-row", false);
        });
      }
    }

    // Function to clear the data from the table and hide it
    function clearHeadlineTable() {
      const tableBody = d3.select("#headline-table-body");
      tableBody.selectAll("tr").remove();
      d3.select("#headline-table-wrapper").classed("hidden", true);
    }

    // show headline table
    function showHeadlineTable() {
      d3.select("#headline-table-wrapper").classed("hidden", false);
    }

    // Load the data
    function updateFilter() {
      updateSearchText();
      
      filterData.call(this);
      if (searchText) {
        if (urlParams.has('hideChart')) {
        // show the "mentioning span"
          document.getElementById("mentioning").classList.remove("hidden");
          document.getElementById("searchTermHeadline").innerHTML = document.getElementById("searchBox").value;
        }
        updateScatterPlot();
        updateHeadlineTable();
        showHeadlineTable();
      } else {
        // hide the "mentioning span"
        clearScatterPlot();
        clearHeadlineTable();
        if (urlParams.has('hideChart')) {
          document.getElementById("mentioning").classList.add("hidden");
        }
      }
    }

    // Search functionality
    d3.select("#searchBox").on("input change", updateFilter);

    // Event listener for the set filter button
    window.setFilterText = function(text) {
      d3.select("#searchBox").property("value", text).node().dispatchEvent(new Event("input"));
    };

    // Event listener for the clear button
    document.getElementById("clearButton").addEventListener("click", function() {
      document.getElementById("searchBox").value = ""; // Clear the search box
      updateFilter(); 
    });

    // Get the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    clearScatterPlot();

    // Check if the "hideChart" parameter is present
    if (urlParams.has('hideChart')) {
      // Hide elements with the "chart" class
      const chartElements = document.querySelectorAll('.chart');
      chartElements.forEach(element => {
        element.style.display = 'none';
      });
      document.getElementById('methodology-box').style.display = 'none';
      document.getElementById("headline").innerHTML = "Cowboy State Daily Headlines <span id=\"mentioning\" class=\"hidden\"> Mentioning \"<span id=\"searchTermHeadline\"></span>\"</span>"
      document.getElementById("searchTermHeadline").innerHTML = searchText;
      setFilterText('climate change');
      updateFilter();

    } else {
      // set h1 to "Explore All Of Cowboy State Daily's Coverage 
      document.getElementById("headline").innerHTML = "Explore All Of Cowboy State Daily's Coverage";      
    }

  }).catch(function(error) {
    console.log(error);
  });
});