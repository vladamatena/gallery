function Gallery(wrapper, api) {
	/// Gallery version
	this.version = 0;
	
	/// Gallery wrapping element
	var $wrapper = $(wrapper);
	/// Gallery API URL
	var api = api;
	/// Path to current directory
	var path = "."
	
	/** Gallery initialization */
	init = function() {
		// Render root directory
		cd(".");
	};
	
	/** Change directory */
	cd = function(path) {
		$.ajax({
			url: api,
			data: { fn: 'ls', folder: path }
		}).done(function(items) {
			renderDir(items);
		});
	};
	
	var renderDir = function(items) {
		var content = Mustache.render($('#gallery_items').html(), items);
		$wrapper.html(content);
	};
	
	// Initialize gallery
	init();
}