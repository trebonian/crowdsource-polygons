<?php
$name = $_REQUEST['name'];
$filename = 'rects/'.$name.'.txt';
write_tile($filename, file_get_contents("php://input"));
header('Content-Type: text/plain');
echo 'written';

function write_tile($filename, $data) {
	$f = @fopen($filename, 'w');
	if ($f) {
		$bytes = fwrite($f, $data);
		fclose($f);
		return $bytes;
	}

	return false;
}

?>
