<?php
	include "functions.php";
	
	login($_POST['passphrase']);
	
	
	
	header("Location: ".preg_replace('/login.php/i', '', "http://".$_SERVER['HTTP_HOST'].$_SERVER['PHP_SELF']));
	exit();
?>