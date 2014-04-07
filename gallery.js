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
	var path = null;
	
	var gallerytemplate = '<div class="gallery"><div class="path"></div><div class="listing"></div></div>'
	var itemDirectoryTemplate = '{{#.}}<div class="item {{type}}" data-name="{{name}}"><span class="name">{{name}}</span></div>{{/.}}';
	var itemImageTemplate = '{{#.}}<div class="item {{type}}" data-name="{{name}}"><div class="thumb" style="background-image: url(\'{{src}}\');"></div><span class="name">{{name}}</span></div>{{/.}}';
	var itemCategorizedListTemplate = '<div class="category">{{category}}</div>{{#dirs}}<div class="item {{type}}" data-name="{{name}}"><span class="name">{{name}}</span></div>{{/dirs}}';
	var itemListingBreakTemplate = '<div class="listing-break"></div>';
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
		cd("");
	};
	
	/** Change directory */
	cd = function(path) {
		// Set path
		self.path = path;
		renderPath(path);
		
		// Load listing
		$.ajax({
			url: api,
			data: { fn: 'ls', folder: path }
		}).done(function(items) {
			renderDir(items, path=='');
		});
	};
	
	var renderPath = function(path) {
		// Get path parts
		parts = path==""?path.split('/'):[""].concat(path.split('/'));
		var path = "";
		var partObjs = [];
		$(parts).each(function() {
			if(path != "")
				path += "/";
			path += this;
			var name = this;
			if(name == '')
				name = "Gallery";
			partObjs.push({name: name, path: path});
		});
		
		// Render path content
		var content = Mustache.render(pathPartTemplate, partObjs);
		$path.html(content);
		
		// register path click events
		$('.path-part', $path).click(function() {
			var path = $(this).data('path');
			cd(path);
		});
	}
	
	/** Sort items, directories first
	 * 
	 * @param items Items to sort
	 * @return Sorted items
	 */
	var sortItems = function(items) {
		return items.sort(function(a, b) {
			return a.name.localeCompare(b.name);
		});
	}
	
	var renderDirFlat = function(dirs) {
		dirs = sortItems(dirs);
		return Mustache.render(itemDirectoryTemplate, dirs);
	}
	
	var renderDirCategorized = function(dirs) {
		dirs = sortItems(dirs);
		var categ = {};
		$(dirs).each(function() {
			var test = this.name.match(/19[0-9][0-9]|2[0-9][0-9][0-9]/);
			cat = "Other";
			if(test)
				cat = test[0];
			if(typeof categ[cat] == "undefined")
				categ[cat] = [];
			categ[cat].push(this);
		});
		
		var ret = "";
		
		for(cat in categ)
			ret += Mustache.render(itemCategorizedListTemplate, {category: cat, dirs: categ[cat]});
		
		return ret;
	}
	
	var renderImages = function(images) {
		images = sortItems(images);
		return Mustache.render(itemImageTemplate, images);
	}
	
	var renderDir = function(items, categorize) {
		// Add data to items
		$(items).each(function() {
			this.src = api + "?fn=thumb&img=" + self.path + "/" + this.name;
		});
		
		// Render elements
		var content = "";
		
		// Split items by type
		var images = [];
		var dirs = [];
		$(items).each(function() {
			if(this.type == "directory")
				dirs.push(this);
			else
				images.push(this);
		});
		
		// Render content
		if(categorize == true)
			content += renderDirCategorized(dirs);
		else
			content += renderDirFlat(dirs);
		content += itemListingBreakTemplate;
		content += renderImages(images);
		$listing.html(content);
		
		// Register directory click events
		$('.item.directory', $listing).click(function() {
			var name = $(this).data('name');
			if(self.path == "")
				cd(name);
			else
				cd(self.path + "/" + name);
		});
	};
	
	// Initialize gallery
	init();
}