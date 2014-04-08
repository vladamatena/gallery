<?php
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
?>
