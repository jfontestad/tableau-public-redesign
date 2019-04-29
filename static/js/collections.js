
d3.json("/api/collection/", function(data) {
	data.results.forEach( function(d) {
		console.log(d);
		$('.collection-gallery[data-gallery="' + d.collection_group + '"]').append('<div class="collection-block"><a href="/collection/' + d.id + '"><img src="/static/images/collection/' + d.id + '.png" /></a></div>')
	});
});