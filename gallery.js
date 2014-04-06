function Gallery(wrapper, api) {
	var self = this;
	
	/// Gallery version
	this.version = 0;
	
	/// Gallery wrapping element
	var $wrapper = $(wrapper);
	var $gallery = null;
	var $path = null;
	var $listing = null;
	
	/// Gallery API URL
	var api = api;
	/// Path to current directory
	var path = "."
	
	var gallerytemplate = '<div class="gallery"><div class="path"></div><div class="listing"></div></div>'
	var itemListTemplate = '{{#.}}<div class="item {{type}}" data-name="{{name}}">{{^isDir}}<div class="thumb"></div>{{/isDir}}<span class="name">{{name}}</span></div>{{/.}}';
	var pathPartTemplate = '{{#.}}<span class="path-part" data-path="{{path}}">{{name}}</span>{{/.}}';
		
	/** Gallery initialization */
	init = function() {
		// Render gallery element
		$wrapper.empty();
		$(gallerytemplate).appendTo($wrapper);
		
		// Resolve gallery element references
		$gallery = $wrapper.find('.gallery');
		$listing = $gallery.find('.listing');
		$path = $gallery.find('.path');
		
		// Render root directory
		cd(".");
	};
	
	/** Change directory */
	cd = function(path) {
		// Set path
		self.path = path;
		console.log(path);
		renderPath(path);
		
		// Load listing
		$.ajax({
			url: api,
			data: { fn: 'ls', folder: path }
		}).done(function(items) {
			renderDir(items);
		});
	};
	
	var renderPath = function(path) {
		// Get path parts
		parts = path.split('/');
		var path = "";
		var partObjs = [];
		$(parts).each(function() {
			if(path != '')
				path += "/";
			path += this;
			var name = this;
			if(name == '.')
				name = "Gallery";
			partObjs.push({name: name, path: path});
		});
		console.log(partObjs);
		
		// Render path content
		var content = Mustache.render(pathPartTemplate, partObjs);
		$path.html(content);
		
		// register path click events
		$('.path-part', $path).click(function() {
			var path = $(this).data('path');
			cd(path);
		});
	}
	
	var renderDir = function(items) {
		// Define methods on items
		$(items).each(function() {
			this.isDir = this.type=="directory";
		});
		
		// Render elements
		var content = Mustache.render(itemListTemplate, items);
		$listing.html(content);
		
		// Register directory click events
		$('.item.directory', $listing).click(function() {
			var name = $(this).data('name');
			cd(self.path + "/" + name);
		});
	};
	
	// Initialize gallery
	init();
}