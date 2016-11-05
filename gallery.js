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
	var $viewerWeb = null;
	var $viewerFull = null;
	var $viewerButtons = {
		exit: null,
		next: null,
		prev: null,
		download: null,
		original: null,
		save: null
	};
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
				<div class="web"></div>\
				<div class="full"></div>\
				<div class="prev">\
					<div class="inner" style="display: none;">\
						<span class="nav" title="previous image"><</span>\
					</div>\
				</div>\
				<div class="next">\
					<div class="inner" style="display: none;">\
						<span class="nav" title="next image">></span>\
					</div>\
				</div>\
				<div class="top-menu">\
					<div class="inner" style="display: none;">\
						<div class="info"></div>\
						<div class="name"></div>\
						<div class="link"><a href="http://seznam.cz"></a></div>\
						<div class="exit button" title="exit">x</div>\
					</div>\
				</div>\
				<div class="bottom-menu">\
					<div class="inner" style="display: none;">\
						<div class="original button" title="full resolution">&#x2592;</div>\
						<div class="save button" title="download full resolution image">&#x21E9;</div>\
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
		<div class="images">\
			{{#.}}<div class="item {{type}}" data-name="{{name}}">\
				<div class="thumb" style="background-image: url(\'{{thumb}}\');"></div>\
				<span class="name">{{name}}</span>\
			</div>{{/.}}\
		</div>';
	var itemDirectoryTemplate = '\
		<div class="item {{type}}" data-name="{{name}}" data-path="{{path}}">\
			<span class="name">{{name}}</span>\
		</div>';
	var itemDirectoryListTemplate = '\
		<div class="dirs noncategorized">\
			{{#.}}\
				' + itemDirectoryTemplate + '\
			{{/.}}\
		</div>';
	var itemCategorizedListTemplate = '\
		<div class="dirs categorized"> \
			{{#.}}\
			<div class="category">\
				<span class="label">{{category}}</span>\
				<div class="dirs">\
					{{#dirs}}' + itemDirectoryTemplate + '{{/dirs}}\
				</div>\
			</div>\
			{{/.}}\
		</div>';
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
		$viewerWeb = $viewer.find('.web');
		$viewerFull = $viewer.find('.full');
		$viewerButtons.exit = $viewer.find('.exit')
		$viewerButtons.next = $viewer.find('.next')
		$viewerButtons.prev = $viewer.find('.prev')
		$viewerButtons.download = $viewer.find('.download')
		$viewerButtons.original = $viewer.find('.original')
		$viewerButtons.save = $viewer.find('.save')
		$login = $gallery.find('.login');
		$logout = $gallery.find('.action.logout');
		$zip = $gallery.find('.action.zip');
		$topbar = $gallery.find('.top-bar');
		
		// Show viewer controls on hover
		$('.prev, .next, .top-menu, .bottom-menu', $viewer).hover(
			function () { $('.inner', this).fadeIn(50); },
			function () { $('.inner', this).fadeOut(); }
		);
		
		// Bind viewer actions
		$viewerButtons.exit.click(closeViewer);
		$viewerButtons.prev.click(prevImg);
		$viewerButtons.next.click(nextImg);
		$viewerButtons.save.click(downloadSourceImage);
		$viewerButtons.original.click(displayOriginal);
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
			if(result == "logged") {
				cd(null);
			} else {
				showLogin();
			}
		});
	};
	
	var decodeURL = function() {
		var search = location.search.substring(1);
		var obj = {'path': ''};
		
		if(search.length > 0)
			obj = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
		
		if(typeof obj.path == 'undefined')
			obj.path = "";
		
		return obj;
	}
	
	var showLogin = function() {
		$login.show();
	}
	
	/** Change directory */
	var cd = function(path) {
		if(path != null) {
			// Store path in history
			updateURL(path, null);
		} else {
			path = decodeURL().path;
		}
		
		// Set path
		self.path = path;
		renderPath(path);
		
		// Load listing
		$.ajax({
			url: api,
			data: { fn: 'ls', folder: path }
		}).done(function(items) {
			// Open path
			renderDir(items, path=='');
			
			// Open image if set and found
			$(items).each(function(index) {
				if(self.items[index].name == decodeURL().image) {
					openViewer(index);
				}
			})
		});
	};
	
	var updateURL = function(path, image) {
		url = "?path=" + path;
		if(image) {
			url = url + "&image=" + image;
		}
		history.pushState({}, "title", url);
	}
	
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
		
		var data = [];
		for(cat in categ) {
			data.push({category: cat, dirs: categ[cat]});
		}
		
		return Mustache.render(itemCategorizedListTemplate, data);
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
			var img = encodeURIComponent(self.path + "/" + this.name)
			this.thumb = api + "?fn=thumb&img=" + img;
			this.web = api + "?fn=web&img=" + img;
			this.src = api + "?fn=img&img=" + img;
			this.video = api + "?fn=video&img=" + img;
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
		
		// Handle zooming the image by mouse wheel
		$viewer.bind("mousewheel", function(event) {
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
		});
		
		
		/// Handle drag and drop image shifting
		$viewer.bind("mousedown", function(event) {
			$viewer.mouseStart = {
				x:event.clientX,
				y:event.clientY
			};
		});
		
		$viewer.bind("mouseup", function(event) {
			delete $viewer.mouseStart;
		});
		
		$viewer.bind("mousemove", function(event) {
			// Do nothing when mouse is not down
			if(typeof $viewer.mouseStart == 'undefined')
				return;
			
			$viewer.shift.x += event.clientX - $viewer.mouseStart.x;
			$viewer.shift.y += event.clientY - $viewer.mouseStart.y;
			
			$viewer.mouseStart = {
				x:event.clientX,
				y:event.clientY
			};
			
			$viewer.css("background-position", "calc(50% + " + $viewer.shift.x + "px) calc(50% + " + $viewer.shift.y + "px)");
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
		// Update URL to remove image
		updateURL(decodeURL().path, null);
		
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
		
		// Scroll to image in image listing
		var $target = $('.image[data-name="' + self.images[self.currentImage].name + '"]');
		$("body").scrollTop($target.offset().top - $(window).height() / 2 + $target.height() / 2);
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
		$viewerWeb.css("background-image", '');
		$viewerFull.css("background-image", '');
	
		// Reset zoom
		$viewerWeb.data("zoom", 1);
		$viewerFull.data("zoom", 1);
		$viewerWeb.css('background-size', 'contain');
		$viewerFull.css('background-size', 'contain');
		
		// Reset shift
		$viewer.css("background-position", "50% 50%");
		$viewer.shift = {
			x:0,
			y:0
		};

		// Reset full quality switch
		$viewerButtons.original.show();
	}
	
	var display = function(index) {
		// Set current index
		self.currentImage = index;
		
		resetViewer();
		
		updateURL(decodeURL().path, self.images[index].name);
		
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
		$viewerWeb.css("background-image", 'url(\'' + self.images[index].web + '\')');
		$viewerWeb.ready(function() {
			if(self.currentImage == index) {
				console.log("Web image loaded: " + self.images[index].name);
				var next = new Image();
				next.src = self.images[nextIndex].web;
				next.onload = function() {
					console.log("Prealoaded web image: " + self.images[nextIndex].name);
				};
			}
		});
		
		// Set image name
		$('.name', $viewer).text(self.images[index].name);
		$link = $('.link a', $viewer);
		$link.text(location.href);
		$link.attr('href', location.href);
		
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
	
	/**
	 * Downloads current image source
	 */
	var downloadSourceImage = function() {
		window.location.href = self.images[self.currentImage].src;
	}
	
	/**
	 * Displays original image version in the viewer
	 */
	var displayOriginal = function() {
		$viewerFull.css("background-image", 'url(\'' + self.images[self.currentImage].src + '\')');
		$viewerButtons.original.hide();
	}
	
	// Initialize gallery
	init();
}
