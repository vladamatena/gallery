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
	var $login = null;
	var $topbar = null;
	
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
			<div class="top-bar">\
				<div class="path">Loading...</div>\
				<div class="actions">\
					<div class="break"><div class="action zip">ZIP directory</div></div>\
					<div class="break"><div class="action logout">Logout</div></div>\
				</div>\
			</div>\
			<div class="listing">Loading...</div>\
			<div class="viewer" style="display:none;" data-zoom="1" data-pos-x="0" data-pos-y="0">\
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
			<div class="login" style="display: none;">\
				<div class="restricted">\
					<h1>RESTRICTED ACCESS</h1>\
					<p class="enter-pass">enter passphrase</p>\
					<form>\
					<p><input type="password" name="passphrase"/></p>\
					</form>\
				</div>\
			</div>\
		</div>'
	var itemImageTemplate = '\
		{{#.}}<div class="item {{type}}" data-name="{{name}}">\
				<div class="thumb" style="background-image: url(\'{{thumb}}\');"></div>\
				<span class="name">{{name}}</span>\
		</div>{{/.}}';
	var itemDirectoryTemplate = '<div class="item {{type}}" data-name="{{name}}" data-path="{{path}}">\
				<span class="name">{{name}}</span>\
		</div>';
	var itemDirectoryListTemplate = '{{#.}}' + itemDirectoryTemplate + '{{/.}}';
	var itemCategorizedListTemplate = '\
		<div class="category">{{category}}</div>\
		{{#dirs}}' +  itemDirectoryTemplate + '{{/dirs}}';
	var itemListingBreakTemplate = '\
		<div class="listing-break"></div>';
	var pathPartTemplate = '\
		{{#.}}<span class="path-part" data-path="{{path}}">{{name}}</span>{{/.}}';
	var imageInfoTemplate = '\
		<table class="info-table">\
			{{#.}}\
				<tr>\
					<td class="name">{{name}}</td>\
					<td class="value">{{value}}</td>\
				</tr>\
			{{/.}}\
		</table>';
	var videoPlayerTemplate = '\
		<video width="100%" height="100%" controls>\
			<source src="{{url}}" consols="true" autoplay="true">\
			Your browser does not support the video tag.\
		</video>';
		
		
	/** Gallery initialization */
	init = function() {
		// Render gallery and viewer element
		$wrapper.empty();
		$gallery = $(gallerytemplate).appendTo($wrapper);
		
		// Resolve gallery element references
		$listing = $gallery.find('.listing');
		$path = $gallery.find('.path');
		$viewer = $gallery.find('.viewer');
		$login = $gallery.find('.login');
		$logout = $gallery.find('.action.logout');
		$zip = $gallery.find('.action.zip');
		$topbar = $gallery.find('.top-bar');
		
		// Show viewer controls on hover
		$('.prev, .next, .menu', $viewer).hover(
			function () { $('.inner', this).fadeIn(50); },
			function () { $('.inner', this).fadeOut(); }
		);
		
		// Bind viewer actions
		$('.exit', $viewer).click(closeViewer);
		$('.prev', $viewer).click(prevImg);
		$('.next', $viewer).click(nextImg);
		$('body').keydown(function(event) {
			switch(event.which) {
				case 27:
					closeViewer();
					break;
				case 39:
					event.preventDefault();
					nextImg();
					break;
				case 37:
					event.preventDefault();
					prevImg();
					break;
			}
		});
		$(document).on("webkitfullscreenchange", function() {
			if(!document.webkitIsFullScreen)
				closeViewer();
		});
		$(document).on("mozfullscreenchange", function() {
	//		if(!document.mozIsFullScreen)
	//			closeViewer();
		});
		$zip.click(function() {
			var zip = api + "?" + $.param({fn: "zip", folder: self.path});
			window.location.href = zip;
		});
		
		// Prevent unwanted actions
		$viewer.dblclick(function(event) {
			event.preventDefault();
			event.stopPropagation();
		});
		
		// Hide logout when not logged in (passwordless gallery)
		if(document.cookie.match(/ticket/) == null)
			$logout.hide();
		
		// Login action
		$('form', $login).submit(function(event) {
			event.preventDefault();
			
			var passphrase = $('input', $login).val();
			
			// Get challange
			$.ajax({
				url: api,
				data: { fn: "login-challenge" }
			}).done(function(challenge) {
				// Respond to challenge
				var response = pidCrypt.SHA512(challenge.concat(passphrase));
				
				// Send response
				$.ajax({
					url: api,
					data: { fn: "login-response", response: response }
				}).done(function(data) {
					location.reload();
				});
			});
		});
		
		// Logout action
		$logout.click(function() {
			// Logout
			$.ajax({
				url: api,
				data: { fn: "logout" }
			}).done(function() {
				location.reload();
			});
		});
		
		// Check session and render root directory
		$.ajax({
			url: api,
			data: { fn: "session" }
		}).done(function(result) {
			if(result == "logged")
				cd(getCurrentPath());
			else
				showLogin();
		});
	};
	
	var getCurrentPath = function() {
		var search = location.search.substring(1);
		var obj = {'path': ''};
		
		if(search.length > 0)
			obj = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
		
		return obj.path;
	}
	
	var showLogin = function() {
		$login.show();
	}
	
	/** Change directory */
	cd = function(path) {
		// Set path
		self.path = path;
		renderPath(path);
		
		// Store path in history
		history.replaceState({value: 1, value2: "X"}, "title", "index.html?path=" + path);
		
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
		
		// Register path click events
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
		return Mustache.render(itemDirectoryListTemplate, dirs);
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
			this.video = api + "?fn=video&img=" + self.path + "/" + this.name;
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
			var path = $(this).data('path');
			cd(path);
		});
		
		// Register image click events
		$('.item.image, .item.video', $listing).click(function() {
			var name = $(this).data('name');
			// Find index for name
			var index = 0;
			$(self.images).each(function(i) {
				if(this.name == name)
					index = i;
			});
			openViewer(index);
		});
		
		$viewer.bind("mousewheel", function(event) {
		//	if(!event.ctrlKey)
		//		return;
			/*console.log("ctrl:", event.ctrlKey);
			console.log("cx: ", event.clientX);
			console.log("cy: ", event.clientY);
			console.log("ox: ", event.offsetX);
			console.log("oy: ", event.offsetY);
			console.log("px: ", event.pageX);
			console.log("py: ", event.pageY);
			console.log("delta: ", event.originalEvent.wheelDelta);
			console.log(event);
			*/
			
			
			var img = new Image();
			img.src = $viewer.css('background-image').replace(/url\(|\)$|"/ig, '');
					
			// Update zoom value
			var oldZoom = $viewer.data("zoom");
			var zoom = oldZoom;
			var zoomStep = 1.05;
			if(event.originalEvent.wheelDelta > 0)
				zoom *= zoomStep;
			else
				zoom /= zoomStep;
			if(zoom < 1)
				zoom = 1;
			$viewer.data("zoom", zoom);
			
			// Zoom image
			var scale = Math.min($viewer.height() / img.height, $viewer.width() / img.width);
			$viewer.css('background-size', scale * zoom * img.width + "px " + scale * zoom * img.height + "px");
			
			// Shift image
			var dx = (event.clientX - $viewer.width() / 2);
			var dy = (event.clientY - $viewer.height() / 2);
			
			
			console.log({dx: dx, dy:dy});
			
			
			var px = $viewer.data("pos-x");
			var py = $viewer.data("pos-y");
			
			px -= dx * 2;
			py -= dy * 2;
			
			$viewer.data("pos-x", px);
			$viewer.data("pos-y", py);
			
			console.log({px: px, py:py});
			
			sx = event.clientX;
			sy = event.clientY;
			
		//	$viewer.css('background-position', sx + "px " + sy + "px");
		
		});
	};
	
	var openViewer = function(index) {
		// Show viewer and hide gallery
		$viewer.show();
		$listing.hide();
		$topbar.hide();
		
		// Go fullscreen
		if (document.documentElement.requestFullScreen) {
			document.documentElement.requestFullScreen();
		} else if (document.documentElement.mozRequestFullScreen) {
			document.documentElement.mozRequestFullScreen();
		} else if (document.documentElement.webkitRequestFullScreen) {
			document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
		}
		
		display(index);
	}
	
	var closeViewer = function() {
		// Hide viewer show listing
		$listing.show();
		$viewer.hide();
		$topbar.show();
		
		resetViewer();
		
		// Stop fullscreen
		if (document.cancelFullScreen) {  
			document.cancelFullScreen();  
		} else if (document.mozCancelFullScreen) {  
			document.mozCancelFullScreen();  
		} else if (document.webkitCancelFullScreen) {  
			document.webkitCancelFullScreen();
		}
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
		display(getNext(self.currentImage));
	}
	
	var prevImg = function() {
		display(getPrev(self.currentImage));
	}
	
	var resetViewer = function() {
		// Remove old content
		$viewer.find('video').remove();
		$viewer.find('img').remove();
		$viewer.css("background-image", '');
		
		// Reset zoom
		$viewer.css('background-size', 'contain');
		$viewer.data("zoom", 1);
	}
	
	var display = function(index) {
		// Set current index
		self.currentImage = index;
		
		resetViewer();
		
		if(self.images[index].type == 'image')
			displayImage(index);
		if(self.images[index].type == 'video')
			displayVideo(index);
	}
	
	var displayVideo = function(index) {
		var content = Mustache.render(videoPlayerTemplate, {url: self.images[index].video});
		$(content).prependTo($viewer);
	}
	
	var displayImage = function(index) {
		// Get next expected image
		var nextIndex = getNext(index);
		if(self.currentImage > index)
			nextIndex = getPrev(index);
		
		// Set current index
		self.currentImage = index;
		
		// Set image and preloaders
		$viewer.ready(function() {
			if(self.currentImage == index) {
				console.log("Web image loaded: " + self.images[index].name);
				var next = new Image();
				next.src = self.images[nextIndex].web;
				next.onload = function() {
					console.log("Prealoaded web image: " + self.images[nextIndex].name);
					if(self.currentImage == index) {
						var orig = new Image();
						orig.src = self.images[index].src;
						orig.onload = function() {
							console.log("Source image loaded: " + self.images[index].name);
							if(self.currentImage == index) {
								$viewer.css("background-image", 'url(\'' + self.images[index].src + '\')');
								var nextOrig = new Image();
								nextOrig.src = self.images[nextIndex].src;
								nextOrig.onload = function() {
									console.log("Preloaded source image: " + self.images[nextIndex].name);
								};
							}
						};
					}
				};
			}
		});
		$viewer.css("background-image", 'url(\'' + self.images[index].web + '\')');
		
		// Set image name
		$('.name', $viewer).text(self.images[index].name);
		
		// Load image info
		$('.info', $viewer).empty();
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
	
	// Initialize gallery
	init();
}