document.addEventListener("DOMContentLoaded", function() {

  // Load data from CSV file
  d3.csv("../stories-with-embeddings.csv").then(function(data) {
    // load from metadata.json
    d3.json("metadata.json").then(function(metadata) {
      
      // Convert x and y values to numbers
      data.forEach(function(d) {
        d.x = +d.x;
        d.y = +d.y;
        d.id = +d.id;
        d.publication_date = new Date(d.publication_date); // Convert publish_date to Date object
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
      let selectedTopic;
      let selectedDomains = [];

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
      // Define a color scale for domains
      // Get unique domains from your data
      const uniqueDomains = [...new Set(data.map(d => d.domain))];

      // Define the number of unique domains
      const numberOfDomains = uniqueDomains.length;

      // Define a color scale with a specified number of colors
      const colorScale = d3.scaleOrdinal(d3.schemePaired) // You can use a built-in color scheme
        .domain(uniqueDomains);

      const dots = svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", heightRaw/100)
        .attr("title", d => d.title)
        .style('fill', d => colorScale(d.domain)) // Assign color based on the domain
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .on("click", handleMouseClick);

      /* Make topic buttons */
      const topicButtonsContainer = document.getElementById('topicButtons');
      // get the first 10 topics that have a summary
      const topics = metadata.topics;

      // Skip creating topic buttons since we removed the container
      if (topicButtonsContainer) {
        topics.forEach(topic => {
          const button = document.createElement('button');
          button.textContent = topic.topic_summary;
          button.value = topic.topic;
          button.classList.add('topic-button'); // Add a class for styling or event binding
          button.addEventListener('click', handleTopicButtonClick);
          topicButtonsContainer.appendChild(button);
        });
      }

      // function to handle topic button click
      function handleTopicButtonClick(topic) {

        // if this topic was already selected, remove the selection
        if (selectedTopic === this.value) {
          selectedTopic = undefined;
          this.classList.remove('selected');
        } else {

          // Remove the "selected" class from all buttons
          const topicButtons = document.querySelectorAll('.topic-button');
        
          // Loop through the buttons and remove the "selected" class from each one
          topicButtons.forEach(btn => {
            btn.classList.remove('selected');
          });

          // Add the "selected" class to the clicked button
          this.classList.add('selected');

          // set selectedTopic to the value of the button
          selectedTopic = this.value;
        }

        // Rest of your filtering and updating logic
        updateFilter();
      }

      // Select the container where you want to add the filter buttons
      const filterButtonsContainer = document.getElementById('filterButtons'); // Update with your container ID or selector
      
      // Create buttons for each unique domain
      uniqueDomains.forEach(domain => {
        console.log(domain);
        const button = document.createElement('button');
        const numArticles = data.filter(d => d.domain === domain).length;
        // add number of articles in domain
        button.textContent = `${domain} (${numArticles})`;
        button.value = domain;
        button.classList.add('domain-button'); // Add a class for styling or event binding
        button.style.backgroundColor = colorScale(domain);
        button.addEventListener('click', handleDomainButtonClick);
        filterButtonsContainer.appendChild(button);
      });

      // function to handle domain button click
      function handleDomainButtonClick(domain) {

        // if this domain was already in selectedDomains, remove the selection from selecteDomains
        if (selectedDomains.includes(this.value)) {
          selectedDomains = selectedDomains.filter(d => d !== this.value);
          this.classList.remove('selected');
        } else {

          // Remove the "selected" class from all buttons
          const domainButtons = document.querySelectorAll('.domain-button');
        
          // Loop through the buttons and remove the "selected" class from each one
          // domainButtons.forEach(btn => {
          //   btn.classList.remove('selected');
          // });

          // Add the "selected" class to the clicked button
          this.classList.add('selected');

          // add domain to selectedDomains 
          selectedDomains.push(this.value);
        }

        // Rest of your filtering and updating logic
        updateFilter();
      }


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
          .text("Published on " + d.publication_date);

        tooltip.append("div")
          .attr("class", "tooltip-domain")
          .text(d.domain);
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

      function handleMouseClick(d) {
        // open the article in a new tab
        window.open(d.url, "_blank");
      }

      function clearScatterPlot() {
        // remove unfiltered-dot class from everything
        filterData();
        updateScatterPlot();
      }

      function isBlank(searchText){
        searchText === "" | searchText === undefined;
      }

      // Create fucntion to filter datapoints based on text box contents
      function filterData() {

        const regexPattern = new RegExp(`\\b${searchText.trim()}\\b`, 'i');
        
        // loop through the data and remove anything that doesn't match filter
        data.forEach(d => {

          d.selected = true; // set selected to true by default
          
          // if filter is set, remove anything not matching filter
          if (!isBlank(searchText) && !regexPattern.test(d.title)) {
            delete d.selected; 
          } 
          
          // if topic is set, remove anything not matching topic
          if (selectedTopic && d.topic != selectedTopic) {
            delete d.selected;
          }

          // if domains are selected, remove anything not in selected domains
          if (selectedDomains.length != 0 && !selectedDomains.includes(d.domain)) {
            delete d.selected;
          }

        })

        // update text of all buttons to include the filtered counts
        const domainButtons = document.querySelectorAll('.domain-button');
        domainButtons.forEach(btn => {
          const domain = btn.value;
          const numArticles = data.filter(d => d.domain === domain && d.selected).length;
          btn.textContent = `${domain} (${numArticles})`;
        });
        
      };

      function updateSearchText() {
        searchText = document.getElementById("searchBox").value.trim().toLowerCase();
      }

      function updateScatterPlot() {
        // check if searchText is blank and filtered topics are blank and selectedDomains is empty
        if ((searchText === "" | searchText === undefined)  && selectedTopic === undefined && selectedDomains.length === 0) {
          // show all dots and allow hover, remove filtered-dot class from everything
          d3.selectAll(".dot")
            .classed("filtered-dot", false)
            .classed("unfiltered-dot", false)
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)
            .on("click", handleMouseClick)
            .raise();
        } else {
          // color the filtred dots, only allow hover on filtered dots
          dots
            .on("mouseover", null)
            .on("mouseout", null)
            .on("click", null)
            .classed("filtered-dot", d => d.selected)
            .classed("unfiltered-dot", d => !d.selected);
            
          d3.selectAll(".dot.filtered-dot")
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)
            .on("click", handleMouseClick)
            .raise();
        }

      };

      // Function to format the publish date as "YYYY-MM-DD"
      function formatDate(date) {
        return new Date(date).toISOString().split('T')[0];
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

        // Sort the filtered data by publication_date in descending order
        const filteredData = data.filter(d => d.selected);
        filteredData.sort((a, b) => new Date(b.publication_date) - new Date(a.publication_date));

        // Create new rows for each data point and populate the table
        const rows = tableBody.selectAll("tr")
          .data(filteredData)
          .enter()
          .append("tr");

        // Populate the rows with title and publication_date information
        rows.append("td").html(d => highlightTitle(d.title)); // Use the highlightTitle function
        // add x,y values as a attribute on the row
        rows.attr("data-title", d => d.title);
        rows.append("td").text(d => formatDate(d.publication_date));
        rows.append("td").text(d => d.domain);

        // Bind mouseover and mouseout events to each row in the table
        const tableRows = document.querySelectorAll("#headline-table tbody tr");
        tableRows.forEach(row => {
          const title = row.getAttribute("data-title");
          const dataPoint = data.find(d => d.title === title);
          row.addEventListener("mouseover", () => handleRowMouseOver(dataPoint));
          row.addEventListener("mouseout", () => handleRowMouseOut(dataPoint));
          row.addEventListener("click", () => handleRowMouseClick(dataPoint));
        });

      }

      function handleRowMouseClick(dataPoint) {
        // open the article in a new tab
        window.open(dataPoint.url, "_blank");
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
        // check for searchText or filtered topic
        if (searchText || selectedTopic || selectedDomains.length != 0) {
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
        document.getElementById("headline").innerHTML = "Headlines <span id=\"mentioning\" class=\"hidden\"> Mentioning \"<span id=\"searchTermHeadline\"></span>\"</span>"
        document.getElementById("searchTermHeadline").innerHTML = searchText;
        setFilterText('climate change');
        updateFilter();

      } else {
        // set h1 to "Explore All Of Cowboy State Daily's Coverage 
        // start date and end date as max and min publication_date from articles
        const startDate = d3.min(data, d => d.publication_date);
        const endDate = d3.max(data, d => d.publication_date);

        // add to headline
        document.getElementById("headline").innerHTML = "Explore Media Coverage Between " + formatDate(startDate) + " and " + formatDate(endDate);
        
        // set subheadline of query_raw from metadata.json
        document.getElementById("subhed").innerHTML = metadata.query_raw;
      }

    }).catch(function(error) {
      console.log(error);
    });
  }).catch(function(error) {
    console.log(error);
  });
});