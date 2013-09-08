#!/bin/bash

for i in /mnt/data/fotky/* ; do
	j=`echo $i|sed 's/\/mnt\/data\/fotky\///'`;
	echo "$j";
	php ./genpreview.php "$j";
done;
