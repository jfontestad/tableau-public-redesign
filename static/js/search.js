let galleryView = new GalleryView({ parentElement: "#gallery" });

let searchTerm = urlManager.params.get("q");

d3.json("/api/visualization/?limit=500&searchTerm=" + searchTerm, function(data) {
	$("#tp-results-search").val(searchTerm);
	loadVisualizationsInGallery(galleryView, data);
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