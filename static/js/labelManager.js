let visId = null;

let chartTypes = [
	{ title: "Bar Chart", value: "barchart" },
	{ title: "Column Chart", value: "columnchart" },
	{ title: "Line Chart", value: "linechart" },
	{ title: "Area Chart", value: "areachart" },
	{ title: "Scatter Plot", value: "scatterplot" },
	{ title: "Map", value: "map" },
	{ title: "Choropleth", value: "choropleth" },
	{ title: "Table", value: "table" },
	{ title: "Pie Chart", value: "piechart" },
	{ title: "Donut Chart", value: "donutchart" },
	{ title: "Box Plot", value: "boxplot" },
	{ title: "Bubble Chart", value: "bubblechart" },
	{ title: "Treemap", value: "treemap" },
	{ title: "Heatmap", value: "heatmap" },
	{ title: "Tree", value: "tree" },
	{ title: "Radar Chart", value: "radarchart" },
	{ title: "Venn Diagram", value: "venndiagram" },
	{ title: "Word Cloud", value: "wordcloud" },
	{ title: "Slopegraph", value: "slopegraph" },
	{ title: "Network Diagram", value: "networkdiagram" },
	{ title: "Parallel Coordinates", value: "parallelcoordinates" },
	{ title: "Sankey Diagram", value: "sankeydiagram" },
	{ title: "(Other)", value: "other" },
	{ title: "(Only Text)", value: "text" },
];

// Initialize chart type selection
chartTypes.forEach( function(d) {
	$("#label-manager-chart-types").append('<div>\
			<div class="label-manager-chart-type" data-chart-type="' + d.value + '">' + d.title + '</div>\
		</div>');
});


// Get random unlabeled vis
d3.json("/supervised/get-unlabeled-vis", function(d) {
	if(d == null) {
		$("#label-manager-image-container").text("No unlabeled visualizations.");
	} else {
		$("#label-manager-image").attr("src", "/static/images/vis/l/" + d.id + ".png");
		visId = d.id;
	}
});


// Toggle buttons
$("body").on("click", ".label-manager-chart-type, .label-manager-other", function() {
	$(this).toggleClass("active");
});


// Label as missing
$("#label-manager-image-missing").click( function() {
	$.get("/supervised/set-missing-image/?id=" + visId, function(data) {
		location.reload();
	});
});


// Reload unknwon
$("#label-manager-unknown").click( function() {
	location.reload();
});


// Save labels
$("#label-manager-save").click( function() {
	let selectedChartTypes = [];
	$('.label-manager-chart-type.active').each(function() {
    selectedChartTypes.push($(this).data('chart-type'));
	});

	let backgroundImage = $("#label-manager-background-image").hasClass("active");
	let interactiveFilter = $("#label-manager-interactive-filter").hasClass("active");
	let outstanding = $("#label-manager-outstanding").hasClass("active");
	let selectedChartTypesString = selectedChartTypes.join(",");
	let url = encodeURI("/supervised/set-vis-labels/?id=" + visId + "&chartTypes=" + selectedChartTypesString + "&interactiveFilter=" + interactiveFilter + "&backgroundImage=" + backgroundImage  + "&outstanding=" + outstanding);
	console.log(url);
	$.get(url, function(data) {
		location.reload();
	});
});


// Automatically select similar labels
$(".label-manager-chart-type[data-chart-type='choropleth']").click( function() {
	$(".label-manager-chart-type[data-chart-type='map']").addClass("active");
});
$(".label-manager-chart-type[data-chart-type='parallelcoordinates']").click( function() {
	$(".label-manager-chart-type[data-chart-type='linechart']").addClass("active");
});
$(".label-manager-chart-type[data-chart-type='slopegraph']").click( function() {
	$(".label-manager-chart-type[data-chart-type='linechart']").addClass("active");
});

