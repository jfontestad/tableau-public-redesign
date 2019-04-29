
let galleryView = new GalleryView({ parentElement: "#gallery" });

const collectionUrl = window.location.pathname.split("/");
const collectionId = collectionUrl[collectionUrl.length - 2];

var target = document.getElementById("spinner-container");
var spinner = new Spinner(spinnerOptions).spin(target);

// Request and display collection details
d3.json("/api/collection/" + collectionId + "/", function(data) {
	$("#collection-title").html(data.title);
	$("#collection-description").html(data.description);
});

// Request and display visualizations of selected collection
d3.json("/special-api/collection/" + collectionId + "/", function(data) {
	data.results.forEach( function(d) {
		d.profile_data = {
			full_name: d.full_name,
			id: d.profile_id,
			name: d.profile_name
		}
	});
	loadVisualizationsInGallery(galleryView, data);

	spinner.stop();
});


// Event listener
$("#gallery-sort").on("change", function() {
	galleryView.config.sortBy = this.value;
  $("#gallery-sort-label").text($("#gallery-sort option:selected").text());
  galleryView.wrangleData();
});
$(".gallery-display").on("click", function() {
	$(".gallery-display").removeClass("active");
	$(this).addClass("active");
	galleryView.config.display = $(this).data("display");
  galleryView.wrangleData();
});