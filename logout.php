<?php
	include "functions.php";
	
	logout();
	
	header("Location: ".preg_replace('/logout.php/i', '', "http://".$_SERVER['HTTP_HOST'].$_SERVER['PHP_SELF']));
	exit();
?>