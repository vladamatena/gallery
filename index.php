<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="cs" lang="cs">
	<head>
		<meta name="generator" content="Kate" />
		<meta http-equiv="content-type" content="text/html; charset=utf-8" />
		<link rel="stylesheet" type="text/css" href="style.css" />
		<title>Galerie</title>
	</head>
	<body>
		<?php
			include "functions.php";
			
			if(validate()) {
				gallery();
			} else {
				// generate challenge
				$challenge = genchallenge();
				
				echo '<script type="text/javascript" src="../javascripts/pidcrypt.js"></script>';
				echo '<script type="text/javascript" src="../javascripts/pidcrypt_util.js"></script>';
				echo '<script type="text/javascript" src="../javascripts/sha512.js"></script>';
				
				echo '	<script type="text/javascript">
							function process() {
								var login = document.login;
								
								passphrase = login.passphrase.value;
								salt = "' . $challenge . '";
								plaintext = salt.concat(passphrase);

								login.passphrase.value = pidCrypt.SHA512(plaintext);
							}
						</script>';
				
				
				echo '<div class="restricted_background">';
					echo '<div class="restricted_content">';
						echo '<h1 class="restricted_access">RESTRICTED ACCESS</h1>';
						echo '<p class="enter_pass">enter passphrase</p>';
						echo '<form name="login" id="login" method="post" action="login.php" onsubmit="javascript:process();">';
							echo '<p><input type="password" name="passphrase"/></p>';
						echo '</form>';
					echo '</div>';
				echo '</div>';
			}
			
			function gallery() {
				$quality = "LQ";
				if(isset($_GET['quality'])) {
					$quality = $_GET['quality'];
					setcookie("quality", $quality);
				} else if (isset($_COOKIE['quality']))
					$quality = $_COOKIE['quality'];
				
				if(isset($_GET['folder']))
					if(isset($_GET['image']))
						show_image($_GET['folder'], $_GET['image'], $quality);
					else
						list_images($_GET['folder'], $quality);
				else
					list_folders($quality);
			}
			
			function list_folders($quality = "LQ") {
				echo '<div class="logout">';
				echo '<a class="mbutton cmbutton" href="index.php">Root directory</a>';
				if(is_logged())
					echo '<a class="mbutton lbutton" href="logout.php">Logout</a>';
				if($quality == "HQ")
						echo '<a class="mbutton lbutton" href="index.php?quality=LQ">High Quality</a>';
					else
						echo '<a class="mbutton lbutton" href="index.php?quality=HQ">Low Quality</a>';
				echo '</div>';
				
				$folders = get_folders();
				
				$folders_done = array();
				
				echo '<div class="listing">';
				
				for($year = 1900; $year != 2100; $year++) {
				
					$yearfolders = array();
					
					foreach($folders as $folder) {
						if(strpos($folder, (string)$year) !== FALSE) {
							$yearfolders[] = $folder;
							$folders_done[] = $folder;
						}
					}
					
					if(!empty($yearfolders)) {
						echo '<div class="gallery_year">';
						echo "$year<br/>";
						foreach($yearfolders as $folder)
							echo '<a class="download" href="index.php?folder=' . $folder . '&amp;quality=' . $quality . '">' . $folder . '</a>';
						echo '</div>';
					}
				}
				
				echo '<div class="gallery_year">';
				echo "Other<br/>";
				foreach($folders as $folder) {
					if(!in_array($folder, $folders_done))
						echo '<a class="download" href="index.php?folder=' . $folder . '&amp;quality=' . $quality . '">' . $folder . '</a>';
				}
				echo '</div>';
				
				echo '</div>';
			}
			
			function list_images($folder, $quality = "LQ") {
				echo '<div class="logout">';
				echo '<a class="mbutton" href="index.php">Root directory</a>';
				echo '<a class="cmbutton mbutton" href="index.php?folder=' . $folder . '">' . $folder . '</a>';
				if(is_logged())
					echo '<a class="mbutton lbutton" href="logout.php">Logout</a>';
				if($quality == "HQ")
						echo '<a class="mbutton lbutton" href="index.php?folder=' . $folder . '&amp;quality=LQ">High Quality</a>';
					else
						echo '<a class="mbutton lbutton" href="index.php?folder=' . $folder . '&amp;quality=HQ">Low Quality</a>';
				echo '</div>';
				
				$images = get_images($folder);
				
				echo '<div class="listing">';
					foreach($images as $image)
						echo "<a class=\"previewlink\" href=\"index.php?folder=$folder&amp;image=$image&amp;quality=$quality\" style=\"background: url('getimage.php?folder=$folder&amp;image=$image&amp;quality=preview') no-repeat center; background-size:contain;\">$image</a>";
				echo '</div>';
			}
			
			function show_image($folder, $image, $quality ="LO") {
				// get next and prev
				$images = get_images($folder);
				$index = array_search($image, $images);
				if(array_key_exists($index + 1, $images))
					$next = $images[$index + 1];
				else
					$next = $image;
				if($index > 0)
					$prev = $images[$index - 1];
				else
					$prev = $image;
				
				// fullscreen div
				echo '<div class="image_show_back">';
					
					// menu
					echo '<div class="logout">';
					echo '<a class="mbutton" href="index.php">Root directory</a>';
					echo '<a class="mbutton" href="index.php?folder=' . $folder . '">' . $folder . '</a>';
					
					if($prev != $image)
						echo '<a class="mbutton" href="index.php?folder=' . $folder . '&amp;image=' . $prev . '&amp;quality=' . $quality . '">Prev</a>';
					else
						echo '<a class="cmbutton mbutton" href="index.php?folder=' . $folder . '&amp;image=' . $prev . '&amp;quality=' . $quality . '">Prev</a>';
					
					echo '<a class="cmbutton mbutton" href="index.php?folder=' . $folder . '&amp;image=' . $image . '&amp;quality=' . $quality . '">' . $image . '</a>';
					
					if($next != $image)
						echo '<a class="mbutton" href="index.php?folder=' . $folder . '&amp;image=' . $next . '&amp;quality=' . $quality . '">Next</a>';
					else
						echo '<a class="cmbutton mbutton" href="index.php?folder=' . $folder . '&amp;image=' . $next . '&amp;quality=' . $quality . '">Next</a>';
					
					if(is_logged())
						echo '<a class="mbutton lbutton" href="logout.php">Logout</a>';
					
					if($quality == "HQ")
						echo '<a class="mbutton lbutton" href="index.php?folder=' . $folder . '&amp;image=' . $image . '&amp;quality=LQ">High Quality</a>';
					else
						echo '<a class="mbutton lbutton" href="index.php?folder=' . $folder . '&amp;image=' . $image . '&amp;quality=HQ">Low Quality</a>';
					echo '</div>';
					
					
					// image
					echo "<a href=\"getimage.php?folder=$folder&amp;image=$image&amp;quality=original\">";
						echo '<div class="image_show_container">';
							if($quality == "HQ")
								echo "<div class=\"image_show_image\" style=\"background: url('getimage.php?folder=$folder&amp;image=$image&amp;quality=original') no-repeat center; background-size:contain;\" ></div>";
							else
								echo "<div class=\"image_show_image\" style=\"background: url('getimage.php?folder=$folder&amp;image=$image&amp;quality=web') no-repeat center; background-size:contain;\" ></div>";
							
						echo '</div>';
					echo '</a>';
					
					// footer
					echo '<div class="image_footer">';
						GLOBAL $gallery;
						$img = $gallery['root'] . "/" . $folder . "/" . $image;
						$size = getimagesize($img);
						$exif = exif_read_data($img, 0, true);
						
						if(isset($exif['EXIF']['DateTimeOriginal']))
							echo "Captured:" . $exif['EXIF']['DateTimeOriginal'] . " ";
						if(isset($size))
							echo "Dimensions:" . $size[0] . "x" . $size[1] . " ";
						echo "Size:" . formatbytes(filesize($img)) . " ";
						if(isset($exif['IFD0']['Model']) && $exif['IFD0']['Make'])
							echo "Camera: " . $exif['IFD0']['Model'] . "(" . $exif['IFD0']['Make'] . ") ";
						if(isset($exif['EXIF']['ExposureTime']))
							echo "Exposure: " . $exif['EXIF']['ExposureTime'] . " ";
						if(isset($exif['EXIF']['FNumber']))
							echo "Aperture: " . $exif['EXIF']['FNumber'] . " ";
						if(isset($exif['EXIF']['ISOSpeedRatings']))
							echo "ISO:" . $exif['EXIF']['ISOSpeedRatings'] . " ";
						
					echo '</div>';
					
				echo '</div>';
			}
		?>
	 </body>
</html>
