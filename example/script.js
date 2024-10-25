d3.csv("../stories-with-embeddings.csv").then(data => {
    // Parse numeric values and prepare the domain data for coloring
    data.forEach(d => {
        d.x = +d.x;
        d.y = +d.y;
    });

    // SVG dimensions
    const width = 600, height = 400;

    // Define scales for positioning
    const xScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.x), d3.max(data, d => d.x)])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.y), d3.max(data, d => d.y)])
        .range([height, 0]);

    // Define an ordinal scale for colors
    const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d.domain)) // Extract the unique domains
        .range(d3.schemeCategory10); // Use a D3 color scheme

    // Create SVG element
    const svg = d3.select("#scatterplot").append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Draw circles with color based on domain
    svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", 5)
        .style("fill", d => colorScale(d.domain)) // Apply color scale here
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`Title: ${d.title}<br/>Publication Date: ${d.publication_date}<br/>Domain: ${d.domain}`)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Implement search functionality
    d3.select("#search-box").on("keyup", function() {
        const searchTerm = this.value.toLowerCase();
        svg.selectAll("circle")
            .style("display", d => d.title.toLowerCase().indexOf(searchTerm) > -1 ? null : "none");
    });
});
