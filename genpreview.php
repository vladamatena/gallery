<?php
	include 'functions.php';
	
	if(!isset($argv[1])) {
		echo "no folder specified\n";
		die;
	}
	
	$folder = $argv[1];
	
	echo "generating Images in: " . $folder . "\n";

	$images = get_images($folder);
	
	foreach($images as $image) {
		echo "Running makepreview on: " . $folder . "/" . $image . "\n";
		$preview = makepreview($folder, $image);
		$web = makeweb($folder, $image);
	}
?>
