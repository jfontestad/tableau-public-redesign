const visUrl = window.location.pathname.split("/");
const visId = visUrl[visUrl.length - 2];

d3.json("/api/visualization/" + visId + "/", function(data) {
	renderVisDetail(data);
});

function renderVisDetail(data) {
	const contentWidth = $("#tp-d-content").width();
	let embedCode = '<iframe src="http://public.tableausoftware.com/views/' + data.workbook + '/' + data.sheet + '?:showVizHome=no&:embed=true" width="' + contentWidth + '" height="1100"></iframe>';
	$("#tp-d-content").html(embedCode);
	$("#d-vis-title").text(data.title);
	$("#d-vis-views").text(data.views);
	$("#d-vis-date").text(moment(data.last_saved).fromNow());
	$("#d-vis-description").text(data.description);
	$("#d-vis-caption").text(data.caption);
	$("#d-profile-name").html('<a href="/profile/' + data.profile_data.id + '">' + data.profile_data.full_name + '</a>');
	$("#d-profile-location").text(data.profile_data.location);
	$("#d-profile-avatar").css({
		'background': 'url(/static/images/profile/' + data.profile_data.name + '.png)',
		'background-position': 'center center',
		'background-size': 'cover'
	});

	if((!data.description || data.description == "") && (!data.caption || data.caption == ""))
		$("#d-vis-description-container").hide();

	if(data.originally_published)
		$("#d-vis-permalink").html('Originally Published:<br/><a href="'+ d.originally_published + '">' + d.originally_published + '</a>');
}