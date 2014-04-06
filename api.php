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
		default:
			apiError("Bad command: " . $_GET['fn']);
	}
	
	function apiError($message) {
		echo "API error: $message";
		exit();
	}
	
	function isFileImage($name) {
		return preg_match('/\.[jJ][pP][gG]$/', $name);
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
?>