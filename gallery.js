function Gallery(wrapper, api) {
	var self = this;
	
	/// Gallery version
	this.version = 0;
	
	/// Gallery wrapping element
	var $wrapper = $(wrapper);
	var $gallery = null;
	var $path = null;
	var $listing = null;
	var $viewer = null;
	
	/// Gallery API URL
	var api = api;
	/// Path to current directory
	var path = null;
	/// Current directory content
	var items = null;
	/// Current directory images
	var images = null;
	/// Current open image index relative to images
	var currentImage = null;
	
	var gallerytemplate = '\
		<div class="gallery">\
			<div class="path"></div>\
			<div class="listing"></div>\
			<div class="viewer" style="display:none;">\
				<div class="prev">\
					<div class="inner" style="display: none;">\
						<span class="nav"><</span>\
					</div>\
				</div>\
				<div class="next">\
					<div class="inner" style="display: none;">\
						<span class="nav">></span>\
					</div>\
				</div>\
				<div class="menu">\
					<div class="inner" style="display: none;">\
						<div class="info"></div>\
						<div class="name"></div>\
						<div class="exit">x</div>\
					</div>\
				</div>\
			</div>\
		</div>'
	var itemDirectoryTemplate = '\
		{{#.}}\
			<div class="item {{type}}" data-name="{{name}}">\
				<span class="name">{{name}}</span>\
			</div>\
		{{/.}}';
	var itemImageTemplate = '\
		{{#.}}\
			<div class="item {{type}}" data-name="{{name}}">\
				<div class="thumb" style="background-image: url(\'{{thumb}}\');"></div>\
				<span class="name">{{name}}</span>\
			</div>\
		{{/.}}';
	var itemCategorizedListTemplate = '\
		<div class="category">{{category}}</div>\
		{{#dirs}}\
			<div class="item {{type}}" data-name="{{name}}">\
				<span class="name">{{name}}</span>\
			</div>\
		{{/dirs}}';
	var itemListingBreakTemplate = '\
		<div class="listing-break"></div>';
	var pathPartTemplate = '\
		{{#.}}\
			<span class="path-part" data-path="{{path}}">{{name}}</span>\
		{{/.}}';
	var imageInfoTemplate = '\
		<table class="info-table">\
			{{#.}}\
				<tr>\
					<td class="name">{{name}}</td>\
					<td class="value">{{value}}</td>\
				</tr>\
			{{/.}}\
		</table>';
		
	/** Gallery initialization */
	init = function() {
		// Render gallery and viewer element
		$wrapper.empty();
		$gallery = $(gallerytemplate).appendTo($wrapper);
		
		// Resolve gallery element references
		$listing = $gallery.find('.listing');
		$path = $gallery.find('.path');
		$viewer = $gallery.find('.viewer');
		
		// Show viewer controls on hover
		$('.prev, .next, .menu', $viewer).hover(
			function () { $('.inner', this).fadeIn(50); },
			function () { $('.inner', this).fadeOut(); }
		);
		
		// Bind viewer actions
		$('.exit', $viewer).click(closeViewer);
		$('.prev', $viewer).click(prevImg);
		$('.next', $viewer).click(nextImg);
		
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
		// Categorize items by year contained in name
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
		// Set current directory content
		items = sortItems(items);
		self.items = items;
		
		// Add data to items
		$(items).each(function() {
			this.thumb = api + "?fn=thumb&img=" + self.path + "/" + this.name;
			this.web = api + "?fn=web&img=" + self.path + "/" + this.name;
			this.src = api + "?fn=img&img=" + self.path + "/" + this.name;
		});
		
		// Render elements
		var content = "";
		
		// Split items by type
		self.images = [];
		var dirs = [];
		$(items).each(function() {
			if(this.type == "directory")
				dirs.push(this);
			else
				self.images.push(this);
		});
		
		// Render content
		if(categorize == true)
			content += renderDirCategorized(dirs);
		else
			content += renderDirFlat(dirs);
		content += itemListingBreakTemplate;
		content += renderImages(self.images);
		$listing.html(content);
		
		// Register directory click events
		$('.item.directory', $listing).click(function() {
			var name = $(this).data('name');
			if(self.path == "")
				cd(name);
			else
				cd(self.path + "/" + name);
		});
		
		// Register image click events
		$('.item.image', $listing).click(function() {
			var name = $(this).data('name');
			// Find index for name
			var index = 0;
			$(self.images).each(function(i) {
				if(this.name == name)
					index = i;
			});
			openViewer(index);
		});
	};
	
	var openViewer = function(index) {
		// Show viewer and hide gallery
		$viewer.show();
		$listing.hide();
		
		displayImage(index);
	}
	
	var closeViewer = function() {
		// Hide viewer show listing
		$listing.show();
		$viewer.hide();
	}
	
	var getNext = function(index) {
		if(index + 1 < self.images.length)
			return index + 1;
		else
			return 0;
	}
	
	var getPrev = function(index) {
		if(index - 1 >= 0)
			return index - 1;
		else
			return self.images.length - 1;
	}
	
	var nextImg = function() {
		displayImage(getNext(self.currentImage));
		preloadImage(getNext(self.currentImage));
	}
	
	var prevImg = function() {
		displayImage(getPrev(self.currentImage));
		preloadImage(getPrev(self.currentImage));
	}
	
	var displayImage = function(index) {
		self.currentImage = index;
		
		// Set image
		$viewer.css("background-image", 'url(\'' + self.images[index].web + '\')');
		
		// Set image name
		$('.name', $viewer).text(self.images[index].name);
		
		// Load image info
		$.ajax({
			url: api,
			data: { fn: 'info', img: self.path + "/" + self.images[index].name }
		}).done(function(info) {
			var data = [];
			for(key in info)
				data.push({name: key, value: info[key]});
			
			$('.info', $viewer).html(Mustache.render(imageInfoTemplate, data));
		});
		
		
	}
	
	var preloadImage = function(index) {
		var img = new Image();
		img.src = self.images[index].web;
	}
	
	// Initialize gallery
	init();
}