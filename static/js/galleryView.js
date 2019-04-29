GalleryView = function(_) {
  this.parentElement = _.parentElement;

  this.config = {
    sortBy: "score",
    filter: {
      chartTypes: []
    },
    display: "grid",
    showScore: true
  }

  this.nOfResults = 0;

  this.previousDisplaySetting = null;

  if(_.collectAuthors != undefined)
    this.config.collectAuthors = _.collectAuthors;
  else
    this.config.collectAuthors = true;

  if(_.showAuthor != undefined)
    this.config.showAuthor = _.showAuthor;
  else
    this.config.showAuthor = true;
  
  this.init();
}


GalleryView.prototype.init = function() {
  let vis = this;

  $(vis.parentElement).html('<div id="gallery-inner"></div>');
  vis.result = d3.select("#gallery-inner");
  vis.authorsContainer = d3.select("#gallery-authors");
}


GalleryView.prototype.wrangleData = function() {
  let vis = this;

  if(vis.config.filter.chartTypes.length > 0) {
    vis.filteredData = vis.data.filter( function(d) {
      if(d.s_chart_types)
        return findOne(d.s_chart_types.split(","), vis.config.filter.chartTypes);
      else
        return false;
    });
  } else {
    vis.filteredData = vis.data;
  }

  vis.filteredData = vis.filteredData.sort(function(a, b) {
    return b[vis.config.sortBy] - a[vis.config.sortBy];
  });

  // Count visualizations per author and sort results descending
  if(vis.config.collectAuthors) {
    vis.authors = d3.nest()
      .key(function(d) { return d.profile_data.id + ";" + d.profile_data.full_name + ";" + d.profile_data.name; })
      .rollup(function(leaves) { return leaves.length; })
      .entries(vis.filteredData);
    vis.authors = vis.authors.sort(function(a, b) {
      return b.value - a.value;
    });
  }

  vis.nOfResults = vis.filteredData.length;

  vis.filteredData = vis.filteredData.slice(0,50);

  vis.update();
}


GalleryView.prototype.update = function() {
  let vis = this;

  // Grid vs. list view
  vis.result.attr("class", function() {
    if(vis.config.display == "grid")
      return "uk-child-width-1-4 uk-grid-small gallery-grid uk-grid";
    else {
      return "uk-child-width-1-1 uk-grid-small gallery-list uk-grid";
    }
  });

  if(vis.previousDisplaySetting != vis.config.display)
    $("#gallery-inner").empty();


  // Visualizations
  var resultItems = vis.result.selectAll('.vis-result-item')
      .data(vis.filteredData, function(d) { return d.id; });

  // Enter
  var resultItemsEnter = resultItems.enter().append("a")
      .attr("class", function(d) {
        return "vis-result-item vis-result-item-" + vis.config.display;
      })
      .attr("href", function(d) {
        return "/vis/" + d.id;
      })
      .html( function(d) {
        return vis.resultItemHtml(d);
      });

  // Enter + update
  resultItemsEnter.merge(resultItems)
      .transition().duration(500);
      
  resultItems.exit().remove();
  resultItems.order();

  if(vis.config.collectAuthors) {
    vis.authors = vis.authors.slice(0,5);
    
    // Authors
    var resultAuthors = vis.authorsContainer.selectAll('.author-result')
        .data(vis.authors, function(d) { 
          d.id = d.key.split(";")[0];
          d.full_name = d.key.split(";")[1];
          d.name = d.key.split(";")[2];
          return d.id;
        })

    // Enter
    var resultAuthorsEnter = resultAuthors.enter().append("a")
        .attr("class", "author-result")
    
    // Enter + update
    resultAuthorsEnter.merge(resultAuthors)
        .attr("href", function(d) {
          return "/profile/" + d.id;
        })
        .html( function(d) {
          return '<div><div class="uk-grid-collapse" uk-grid>\
                    <div class="uk-width-auto uk-border-circle author-result-avatar" style="background: url(&quot;/static/images/profile/' + d.name + '.png&quot;) center center / cover;"></div>\
                    <div class="uk-width-expand author-result-name">' + d.full_name + '</div>\
                    <div class="uk-width-auto author-result-count">' + d.value + '</div>\
                  </div></div>';
        });

    resultAuthors.exit().remove();
  }
}

GalleryView.prototype.resultItemHtml = function(d) {
  var vis = this;

  var content = '';

  $("#gallery-result-stats").text(vis.nOfResults + " results");

  if(vis.config.display == "list")
    content += '<div uk-grid>\
              <div class="uk-width-2-5">';

  content += '<div class="uk-cover-container uk-height-small vis-preview">\
                <img src="/static/images/vis/s/' + d.id + '.png" uk-cover>\
              </div>';

  if(vis.config.display == "list")
    content += '</div><div class="uk-width-3-5">';

  content += '<div class="vis-title vis-title">' + d.title.replace(/_/g,' ') + '</div>';

  if(vis.config.showAuthor && vis.config.display == "grid")
    content += '<div class="vis-meta-line text-meta">\
                  <a class="vis-meta vis-meta-author" href="/profile/' + d.profile_data.id + '">' + d.profile_data.full_name + '</a>\
                </div>';
    
  content += '<div class="vis-meta-line text-meta">';

  if(vis.config.showAuthor && vis.config.display == "list")
    content += '<a class="vis-meta vis-meta-author" href="/profile/' + d.profile_data.id + '">' + d.profile_data.full_name + '</a>&nbsp;';
                
  content += '<span class="vis-meta vis-meta-views">' + abbreviateNumber(d.views) + ' views</span>\
              <span class="vis-meta vis-meta-date">' + moment(d.last_saved).fromNow() + '</span>';

  if(vis.config.showScore)
    content += '<span class="vis-meta vis-meta-views">Score: ' + d.score + '</span>';
  
  content += '</div>';

  if(vis.config.display == "list")
    content += '<div class="vis-desc">' + d.description + '</div></div></div>';

  return content;
}
