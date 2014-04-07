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
	
	function ls($folder) {
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
		
		header('Content-type: application/json');
		echo(json_encode($items));
	}
	
	function api_makeSmall($image) {
		GLOBAL $gallery;
		$src = $gallery['root'] . "/" . $image;
		$hash = hash("sha1", $src);
		$hashDir = $gallery['preview'] . "/" . substr($hash, 0, 2);
		
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
		$hash = hash("sha1", $src);
		$hashDir = $gallery['webquality'] . "/" . substr($hash, 0, 2);
		
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
?>