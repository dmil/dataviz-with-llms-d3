// Define constants
const MAX_WIDTH = 1200; // Maximum width of the plot
const padding = { top: 20, right: 20, bottom: 30, left: 40 };

// Set up the SVG
const scatterPlotDiv = d3.select("#scatter-plot");
const svg = scatterPlotDiv.append("svg")
    .style("width", "100%")
    .style("height", "100%")
  .append("g")
    .attr("transform", `translate(${padding.left},${padding.top})`);

// Create tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Global variables
let xScale, yScale, allData;
let searchTerm = '';
let dateSlider;
let isInitialLoad = true;

// Parse and format dates
const parseDate = d3.timeParse("%Y-%m-%d");
const formatDate = d3.timeFormat("%Y-%m-%d");

// Function to update the plot size
function updatePlotSize() {
    const boundingRect = scatterPlotDiv.node().getBoundingClientRect();
    const containerWidth = boundingRect.width;
    const containerHeight = boundingRect.height;
    
    const width = Math.min(containerWidth, MAX_WIDTH) - padding.left - padding.right;
    const height = Math.min(containerWidth, MAX_WIDTH) - padding.top - padding.bottom;

    svg.attr("width", width + padding.left + padding.right)
       .attr("height", height + padding.top + padding.bottom);

    // Update scales
    xScale.range([0, width]);
    yScale.range([height, 0]);

    // Update existing points
    svg.selectAll(".dot")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y));
}

// Function to update URL with current search term and dates
function updateURL(searchTerm, startDate, endDate) {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (startDate) params.set('start', formatDate(startDate));
    if (endDate) params.set('end', formatDate(endDate));
    
    const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    history.pushState(null, '', newURL);
}

// Function to read URL parameters
function readURLParams() {
    const params = new URLSearchParams(window.location.search);
    const searchTerm = params.get('search') || '';
    const start = params.get('start') ? new Date(params.get('start')) : null;
    const end = params.get('end') ? new Date(params.get('end')) : null;
    return { searchTerm, start, end };
}

// Load the data
d3.csv("peachtreetimes.csv").then(function(data) {
    allData = data;
    
    // Process data
    allData.forEach(function(d) {
        d.x = +d.x;
        d.y = +d.y;
        d.date = parseDate(d.date);
    });

    // Sort data by date
    allData.sort((a, b) => a.date - b.date);

    // Set up scales
    xScale = d3.scaleLinear()
        .domain(d3.extent(allData, d => d.x));
    yScale = d3.scaleLinear()
        .domain(d3.extent(allData, d => d.y));

    // Initial update of plot size
    updatePlotSize();

    // Set up date slider
    const dateExtent = d3.extent(allData, d => d.date);
    const slider = document.getElementById('date-slider');

    // Read URL parameters
    const { searchTerm: initialSearchTerm, start: initialStart, end: initialEnd } = readURLParams();

    dateSlider = noUiSlider.create(slider, {
        start: initialStart && initialEnd ? [initialStart.getTime(), initialEnd.getTime()] : dateExtent.map(d => d.getTime()),
        connect: true,
        behaviour: 'drag',
        range: {
            'min': dateExtent[0].getTime(),
            'max': dateExtent[1].getTime()
        },
        step: 24 * 60 * 60 * 1000, // One day
    });

    // Set initial search term
    document.getElementById('search-box').value = initialSearchTerm;
    searchTerm = initialSearchTerm;

    // Update date display
    function updateDateDisplay(values, handle, unencoded, tap, positions, noUiSlider) {
        const dateValues = values.map(d => new Date(+d));
        document.getElementById('start-date').textContent = formatDate(dateValues[0]);
        document.getElementById('end-date').textContent = formatDate(dateValues[1]);
        updatePlot(dateValues[0], dateValues[1], searchTerm);
        
        // Only update URL if it's not the initial load and the change was from user interaction
        if (!isInitialLoad && !tap && !noUiSlider.options.animate) {
            updateURL(searchTerm, dateValues[0], dateValues[1]);
        }
        isInitialLoad = false;
    }

    dateSlider.on('update', updateDateDisplay);

    // Set up search functionality
    const searchBox = document.getElementById('search-box');
    const searchButton = document.getElementById('search-button');
    const resetButton = document.getElementById('reset-button');

    searchButton.addEventListener('click', performSearch);
    searchBox.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    resetButton.addEventListener('click', resetVisualization);

    // Initial plot
    updatePlot(initialStart || dateExtent[0], initialEnd || dateExtent[1], initialSearchTerm);

    // Add window resize event listener
    window.addEventListener('resize', updatePlotSize);

    // Clear URL if no initial parameters were set
    if (!initialSearchTerm && !initialStart && !initialEnd) {
        history.pushState(null, '', window.location.pathname);
    }
});

function performSearch() {
    searchTerm = document.getElementById('search-box').value.toLowerCase();
    const dateValues = dateSlider.get().map(d => new Date(+d));
    updatePlot(dateValues[0], dateValues[1], searchTerm);
    updateURL(searchTerm, dateValues[0], dateValues[1]);
}

function resetVisualization() {
    // Reset search
    document.getElementById('search-box').value = '';
    searchTerm = '';

    // Reset date slider
    const dateExtent = d3.extent(allData, d => d.date);
    dateSlider.set(dateExtent.map(d => d.getTime()));

    // Update plot and clear URL
    updatePlot(dateExtent[0], dateExtent[1], '');
    history.pushState(null, '', window.location.pathname);
}

function updatePlot(startDate, endDate, searchTerm = '') {
    // Filter data
    const filteredData = allData.filter(d => 
        d.date >= startDate && 
        d.date <= endDate && 
        (searchTerm === '' || d.title.toLowerCase().includes(searchTerm) || d.text.toLowerCase().includes(searchTerm))
    );

    // Update the plot
    const dots = svg.selectAll(".dot")
        .data(filteredData, d => d.title);

    dots.enter()
        .append("circle")
        .attr("class", "dot")
        .attr("r", 5)
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .style("fill", "grey")
        .style("opacity", 0.5)
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .on("click", handleClick);

    dots
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y));

    dots.exit().remove();

    // Update info box with search results
    const infoBox = d3.select("#info-box");
    if (searchTerm !== '') {
        infoBox.html(`Showing ${filteredData.length} results for "${searchTerm}" within the selected date range.<br/><br/>Hover over a point to see the details. Click to navigate to the article.`);
    } else {
        infoBox.html(`Showing ${filteredData.length} results within the selected date range.<br/><br/>Hover over a point to see the details. Click to navigate to the article.`);
    }
}

function highlightText(text, term) {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function handleMouseOver(event, d) {
    d3.select(this)
        .raise()
        .transition()
        .duration(150)
        .attr("r", 10)
        .style("fill", "red")
        .style("opacity", 1)
        .style("stroke", "black")
        .style("stroke-width", "1px");

    tooltip.transition()
        .duration(200)
        .style("opacity", .9);

    const tooltipLeft = (event.pageX > window.innerWidth - 200) ? (event.pageX - 100) : event.pageX;
    const tooltipTop = (event.pageY > window.innerHeight - 100) ? (event.pageY - 50) : (event.pageY - 28);
    
    tooltip.html(highlightText(d.title, searchTerm) + "<br/>" + d.date)
        .style("left", tooltipLeft + "px")
        .style("top", tooltipTop + "px");

    const source = d.url ? d.url : "#§" + d.title.replace(/\s+/g, '-').toLowerCase();
    d3.select("#info-box").html(
        "<strong>Title:</strong> " + highlightText(d.title, searchTerm) +
        "<br/><strong>Date:</strong> " + d.date +
        "<br/><strong>Author:</strong> " + d.author +
        "<br/><strong>Text:</strong> " + highlightText(d.text, searchTerm) + 
        "<br/><strong>Source:</strong> " + `<a href="${source}" target="_blank">${d.url}</a>`
    );
}

function handleMouseOut() {
    d3.select(this)
        .transition()
        .duration(150)
        .attr("r", 5)
        .style("fill", "grey")
        .style("opacity", 0.5)
        .style("stroke", "none");

    tooltip.transition()
        .duration(500)
        .style("opacity", 0);
}

function handleClick(event, d) {
    const source = d.url ? d.url : "#§" + d.title.replace(/\s+/g, '-').toLowerCase();
    window.open(source, "_blank");
}