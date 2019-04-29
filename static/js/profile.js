
let galleryView = new GalleryView({ parentElement: "#gallery", collectAuthors: false, showAuthor: false });

const profileUrl = window.location.pathname.split("/");
const profileId = profileUrl[profileUrl.length - 2];

// Request and display collection details
d3.json("/api/profile/" + profileId + "/", function(data) {
	$("#profile-name").text(data.full_name);
	$("#profile-organization").text(data.organization);
	$("#profile-location").text(data.location);
	$("#profile-avatar").css({
		'background': 'url(/static/images/profile/' + data.name + '.png)',
		'background-position': 'center center',
		'background-size': 'cover'
	});
	$("#profile-bio").html(createExcerpt(data.bio));
	if(data.twitter) $("#profile-twitter").attr("href", data.twitter).css('display', 'block');
	if(data.linkedin) $("#profile-linkedin").attr("href", data.linkedin).css('display', 'block');
	if(data.facebook) $("#profile-facebook").attr("href", data.facebook).css('display', 'block');
	if(data.website) {
		let formattedWebsite = data.website.replace(/(^\w+:|^)\/\//, '');
		formattedWebsite = formattedWebsite.split("www.")[1];
		if(formattedWebsite.endsWith("/")) formattedWebsite = formattedWebsite.substring(0, formattedWebsite.length - 1);
		$("#profile-website-formatted").text(formattedWebsite);
		$("#profile-website").attr("href", data.website).css('display', 'block');
	}
	$("#profile-stats").append('<li><span class="profile-stats-value">' + data.vizzes + '</span> Visualizations</li>')
	if(data.followers > 0) $("#profile-stats").append('<li><span class="profile-stats-value">' + data.followers + '</span> Followers</li>')
	if(data.followers > 0) $("#profile-stats").append('<li><span class="profile-stats-value">' + data.followers + '</span> Following</li>')
});

// Request and display visualizations of selected collection
d3.json("/special-api/profile/" + profileId + "/", function(data) {
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