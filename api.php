<?php
	include "config.php";
	include "functions.php";
		
	// Check user is logged in
	validate() or exit();

	// Execute requested function
	switch($_GET['fn']) {
		case "ls":
			ls($_GET['folder']);
			break;
		case "thumb":
			get("small", $_GET['img']);
			break;
		case "web":
			get("web", $_GET['img']);
			break;
		case "img":
			get("src", $_GET['img']);
			break;
		case "info":
			info($_GET['img']);
			break;
		case "update":
			update();
			break;
		default:
			apiError("Bad command: " . $_GET['fn']);
	}
	
	function apiError($message) {
		echo "API error: $message";
		exit();
	}
	
	function isFileImage($name) {
		return preg_match('/\.[jJ][pP][eE]?[gG]$/', $name);
	}
	
	function listFolder($folder) {
		GLOBAL $gallery;
		
		// Check for ".." in folder name
		if(preg_match('/\.\./', $folder))
			apiError("Invalid chars in folder name: $folder");
		
		// Get folder content
		$path = $gallery['root'] . "/$folder";
		$items = array();
		if($handle = opendir($path)) {
			while(false !== ($entry = readdir($handle))) {
				if($entry != "." && $entry != ".." && !preg_match('/^\..*/', $entry)) {
					// Add new item
					$item = array();
					$item['name'] = $entry;
					if(is_dir("$path/$entry"))
						$item['type'] = "directory";
					else if(isFileImage($entry))
						$item['type'] = "image";
						else continue;
					
					$items[] = $item;
				}
			}
			closedir($handle);
		}
		
		return $items;
	}
	
	function ls($folder) {
		header('Content-type: application/json');
		echo(json_encode(listFolder($folder)));
	}
	
	function api_makeSmall($image) {
		GLOBAL $gallery;
		$src = $gallery['root'] . "/" . $image;
		$hash = hash("sha1", "small/" . $image);
		$hashDir = $gallery['scaled'] . "/" . substr($hash, 0, 2);
		
		// Ensure hashdir
		if(!is_dir($hashDir))
			mkdir($hashDir);
		
		$small = $hashDir . "/" . $hash;
		
		// Ensure image
		if(!is_file($small)) {
			system('convert -thumbnail 128x128 "' . $src . '" "' . $small . '"');
			touch($small);
		}
		
		return $small;
	}
	
	function api_makeWeb($image) {
		GLOBAL $gallery;
		$src = $gallery['root'] . "/" . $image;
		$hash = hash("sha1", "web/" . $image);
		$hashDir = $gallery['scaled'] . "/" . substr($hash, 0, 2);
		
		// Ensure hashdir
		if(!is_dir($hashDir))
			mkdir($hashDir);
			
		$web = $hashDir . "/" . $hash;
		
		// Ensure image
		if(!is_file($web)) {
			system('convert "' . $src . '" -resize "1024x768>" -compress JPEG -quality 80  "' . $web . '"');
			touch($web);
		}
		
		return $web;
	}
	
	function get($size, $image) {
		GLOBAL $gallery;
		
		$src = $gallery['root'] . "/" . $image;
		
		switch($size) {
			case "src":
				$img = $src;
				break;
			case "small":
				$img = api_makeSmall($image);
				break;
			case "web":
				$img = api_makeWeb($image);
				break;
			default:
				apiError("Image size: " . $size . " not uspported");
		}
		
		header("Content-type: image/jpg");
		header("Content-Transfer-Encoding: binary");
		date_default_timezone_set('UTC');
		header("Last-Modified: " . date('r', filemtime($img)));
		
		readfile($img);
	}
		
	function info($image) {
		GLOBAL $gallery;
		
		$src = $gallery['root'] . "/" . $image;
		
		// Grather image informations
		$exif = exif_read_data($src, 'EXIF');
		$info = array();
		
		$info['date'] = $exif['DateTimeOriginal'];
		$info['dimensions'] = $exif['ExifImageWidth'] . "x" . $exif['ExifImageLength'];
		$info['size'] = formatBytes(filesize($src));
		$info['model'] = $exif['Make'] . "(" . $exif['Model'] . ")";
		$info['exposure'] = $exif['ExposureTime'];
		$info['fnumber'] = $exif['FNumber'];
		$info['iso'] = $exif['ISOSpeedRatings'];
		$info['description'] = $exif['ImageDescription'];
		
		header('Content-type: application/json');
		echo(json_encode($info));
	}
	
	function update() {
		if (ob_get_level() == 0)
			ob_start();
		
		header('Content-Type: text/html; charset=utf-8');
		echo "Generating scaled images...</br>";
		
		function updateDir($path) {
			$items = listFolder($path);
			
			echo "Processing directory: $path</br>";
			echo str_pad('',4096)."\n";
			ob_flush();
			flush();
			
			foreach($items as $item) {
				if($item['type'] == "directory") {
					if($path == "")
						updateDir($item['name']);
					else
						updateDir($path . "/" . $item['name']);
				} else {
					echo "Processing file: " . $path . "/" . $item['name'] . "...";
					echo str_pad('',4096)."\n";
					ob_flush();
					flush();
					
					api_makeSmall($path . "/" . $item['name']);
					api_makeWeb($path . "/" . $item['name']);
					
					echo "done</br>";
					echo str_pad('',4096)."\n";
					ob_flush();
					flush();
				}
			}
		}
		
		updateDir("");
		
		ob_end_flush();
	}
?>