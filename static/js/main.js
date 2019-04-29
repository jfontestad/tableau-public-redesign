

const parseDateTime = d3.timeParse("%Y-%m-%dT%H:%M:%S");

let chartTypesDefault = true;


/*
 * URL parameter manager
 */

let urlManager = {}
urlManager.url = new URL(window.location.href);
urlManager.params = new URLSearchParams(urlManager.url.search);


/*
 * Loading spinner
 */


var spinnerOptions = {
    lines: 10, // The number of lines to draw
    length: 7, // The length of each line
    width: 4, // The line thickness
    radius: 10, // The radius of the inner circle
    corners: 1, // Corner roundness (0..1)
    rotate: 0, // The rotation offset
    color: '#000', // #rgb or #rrggbb
    speed: 1, // Rounds per second
    trail: 60, // Afterglow percentage
    shadow: false, // Whether to render a shadow
    hwaccel: false, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: 25, // Top position relative to parent in px
    left: 25 // Left position relative to parent in px
};


/*
 * Search
 * Get search term and send API request
 */

// Navigation search toggle
$("body").on("click", ".tp-search-toggle, .tp-search-close", function() {
  $("body").toggleClass("primary-search-active");
});

// Primary search
$("#tp-primary-search").autocomplete({
  source: searchForTerm,
  appendTo: "#tp-search-outer",
  position: {
      my: "left+0 top+40"
  },
  minLength: 2,
  select: function(event,ui) { 
    window.location.href = "/vis/" + ui.item.value + "/";
  },
  open: function() {
    $("ul.ui-menu").width( $(this).innerWidth() );
  }
});

// Results search (secondary)
$("#tp-results-search").autocomplete({
  source: searchForTerm,
  minLength: 2,
  select: function(event,ui) { 
    window.location.href = "/vis/" + ui.item.value + "/";
  },
  open: function() {
    $("ul.ui-menu").width( $(this).innerWidth() );
  }
});

$("#tp-clear-results-search").click( function() {
  $("#tp-results-search").val('');
  $("#tp-results-search").focus();
});

// Search listener for 'enter' key
$("#tp-primary-search").add('#tp-results-search').keypress( function(e) {
  if(e.keyCode == 13) {
   e.preventDefault();
   window.location.href = "/search/?q=" + encodeURIComponent(this.value);
  }
});

function searchForTerm(request, response) {
  $.get('/api/visualization/?fields=id,title&limit=10&searchTerm=' + request.term, function(data) {
    // Need 'value' and 'label' for jQuery Autocomplete 
    displayData = [];
    data.results.forEach(function(d) {
      displayData.push({ value: d.id, label: d.title });
    });
    response(displayData);
  });
}


/*
 * General method for loading vis data into a gallery view
 */

function loadVisualizationsInGallery(galleryView, data) {
  data.results.forEach( function(d) {
    d.last_saved = parseDateTime(d.last_saved);
  });
  galleryView.data = data.results;
  galleryView.wrangleData();
}


/*
 * Filter listener
 */

// Chart types
$("body").on("click", ".tp-filter-chart-type-image", function() {
  if(chartTypesDefault) {
    $(".tp-filter-chart-type-image").removeClass("active");
    $(this).addClass("active");
    chartTypesDefault = false;
  } else {
    $(this).toggleClass("active");
  }

  // Collect all active chart types
  let chartTypes = $(".tp-filter-chart-type-image.active").map(function() {
   return $(this).data("chart-type");
  }).get();

  // Barchart and columnchart is combined in one glyph, therefore 'join' and then 'split'
  let chartTypesString = chartTypes.join(",");
  galleryView.config.filter.chartTypes = chartTypesString.split(",");
  galleryView.wrangleData();
});



/*
 * Other listeners
 */

$("body").on("click", ".excerpt-link", function() {
  $(this).closest(".excerpt").toggleClass("active");
});
