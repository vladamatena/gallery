<?php

	include 'functions.php';
	
	if(!validate()) {
		echo "Permission denied";
		exit();
	}
	
	$folder = $_GET['folder'];
	$image = $_GET['image'];
	$quality = $_GET['quality'];
	$root = $gallery['root'];
	
	$img = "badfile.jpg";
		
	switch($quality) {
		case "original":
			$img = "$root/$folder/$image";
			break;
		case "web":
			$img = makeweb($folder, $image);
			break;
		case "preview":
			$img = makepreview($folder, $image);
			break;
	}
	
	header("Content-type: image/jpg");
	header("Content-Transfer-Encoding: binary");
	header("Content-Disposition: filename=\"$image\"");
	date_default_timezone_set('UTC');
	$imgmodified = date('r', filemtime($img));
	header("Last-Modified: $imgmodified");
	
	readfile($img);
	
	exit();
?>