
/*
 * @description determine if an array contains one or more items from another array.
 * @param {array} haystack the array to search.
 * @param {array} arr the array providing items to check for in the haystack.
 * @return {boolean} true|false if haystack contains at least one item from arr.
 */
var findOne = function (haystack, arr) {
	return arr.some(function (v) {
	  return haystack.indexOf(v) >= 0;
	});
};


/*
 * @description converts a given number in a 3 letter abbreviation
 * @param {number} value the number that should be formatted.
 */
function abbreviateNumber(value) {
  var newValue = value;
  if (value >= 1000) {
    var suffixes = ["", "k", "m", "b","t"];
    var suffixNum = Math.floor( (""+value).length/3 );
    var shortValue = '';
    for (var precision = 2; precision >= 1; precision--) {
      shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
      var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
      if (dotLessShortValue.length <= 2) { break; }
    }
    if (shortValue % 1 != 0)  shortNum = shortValue.toFixed(1);
    newValue = shortValue+suffixes[suffixNum];
  }
  return newValue;
}

function createExcerpt(content) {
	if(content.length < 200) return content;

	// Split content after 350 elements
	let contentDivided = [];
	content.replace(/(.{200}\w+)\s(.+)/, function(_,a,b) { 
		contentDivided.push(a,b);
	});
	
	let excerptMore = '<span class="excerpt-more">... <span class="text-link excerpt-more-link excerpt-link">more <i class="fas fa-caret-down"></i></span></span>';
	let excerptLess = '<span class="text-link  excerpt-less-link excerpt-link">less <i class="fas fa-caret-up"></i></span>';
	let contentRest = '<span class="excerpt-full">' +  contentDivided[1] + '</span>';
	let advancedContent = '<span class="excerpt">' + contentDivided[0] + excerptMore + contentRest + excerptLess + '</span>';
	return advancedContent;
}
