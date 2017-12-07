<?php
	/*********************************
	 * Server configurations options *
	 ********************************/
	GLOBAL $gallery;
	$gallery = array();

	// Directory with images to browse
	$gallery['root'] = "/original_photos";
	
	// tem for storing scaled versions
	$gallery['scaled'] = "/scaled_photos";
	
	// Access password (empty means no password)
	$gallery['password'] = "";

	// SQL connection settings
	$gallery['sql_host'] = "localhost";
	$gallery['sql_user'] = "gallery";
	$gallery['sql_pass'] = "password";
	$gallery['sql_db'] = "gallery";
	
	/**********************************
	*  Client configuration options   *
	**********************************/
	GLOBAL $gallery_client;
	$gallery_client = array();
	
	// Specify, how the top folders are categorized
	// Allowed values are: year, name
	// year - categories based on year detected in folder name
	// name - categories based on the top folder name (if it contains only subfolders, not files)
	$gallery_client['categories'] = "name";
	
	// Speed limit for loading source images in bytes per second
	// Load sources on faster connections
	$gallery_client['speed_limit'] = 500000;
?>
