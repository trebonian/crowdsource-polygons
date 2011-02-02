var frame;
var rectlayer, mouselayer, hitbuffer;
var mx1, my1, mx2, my2;
var moved, drawmode='r';
var rects = [];
var linewidth = 8;

function setup(filename){
	frame = document.getElementById('frame');
	setupLayers();
	mouselayer.onmousedown = function(e){mouseDown(e);}
	window.onkeypress = function(e){handleKey(e);}
	loadTile(filename);
}


function setupLayers(){
	rectlayer = document.getElementById('rectlayer');
	rectlayer.width = 700;
	rectlayer.height = 550;
	mouselayer = document.getElementById('mouselayer');
	mouselayer.width = 700;
	mouselayer.height = 550;
	mouselayer.style.cursor = "crosshair";
	hitbuffer = document.getElementById('hitbuffer');
	hitbuffer.width = 700;
	hitbuffer.height = 550;
	hitbuffer.style.visibility = 'hidden';
}

/////////////////////////
//
// User Interface
//
/////////////////////////

function handleKey(e){
	var c = e.charCode;
	c = String.fromCharCode(c);
	if('rl12345wasd'.indexOf(c)==-1) return;
	if(c=='l') drawmode='l';
	else if(c=='r') drawmode='r';
	else if(c=='1') linewidth=8;
	else if(c=='2') linewidth=10;
	else if(c=='3') linewidth=12;
	else if(c=='4') linewidth=14;
	else if(c=='5') linewidth=16;
	else if(c=='a') mx1--;
	else if(c=='d') mx1++;
	else if(c=='w') my1--;
	else if(c=='s') my1++;
	if(window.onmousemove) redrawMouseRect();
}

function mouseDown(e){
	e.preventDefault();
	moved=false;	
	mx1 = localx(e.clientX);	
	my1 = localy(e.clientY);
	if(drawmode=='l') snapToLine();
	window.onmousemove = function(e){mouseMove(e)};
	window.onmouseup = function(e){mouseUp(e)};
}

function snapToLine(){
	var idx = readHitBuffer(mx1,my1);
	if(idx<0) return;
	var r = rects[idx];
	if(r[0]!='l') return;
	if(dist(mx1,my1,r[1],r[2])<5){mx1=r[1];my1=r[2];}
	if(dist(mx1,my1,r[3],r[4])<5){mx1=r[3];my1=r[4];}
}


function mouseMove(e){
	mx2=localx(e.clientX), my2=localy(e.clientY);
	var dx=Math.abs(mx2-mx1), dy=Math.abs(my2-my1);
	if((!moved)&&((dx+dy)<6)) return;
	moved = true;
	redrawMouseRect();
}

function redrawMouseRect(){
	var ctx = mouselayer.getContext('2d');
	ctx.clearRect(0,0,10000,10000);
	ctx.fillStyle = 'rgba(255,255,0,0.7)';
	ctx.strokeStyle = 'rgba(255,255,0,0.7)';
	redrawRect(ctx, [drawmode, mx1, my1, mx2, my2, linewidth]);
}



function mouseUp(e){
	window.onmousemove = undefined;
	window.onmouseup = undefined;
	if(!moved) {handleClick(e);	return}
	var ctx = mouselayer.getContext('2d');
	ctx.clearRect(0,0,10000,10000);
	var x = localx(e.clientX);
	var y = localy(e.clientY);
	if(drawmode=='l'&&(Math.abs(x-mx1)<3)) x=mx1;
	if(drawmode=='l'&&(Math.abs(y-my1)<3)) y=my1;
	var rect = [drawmode, mx1, my1, x, y];
	if(drawmode=='l') rect.push(linewidth);
	rects.push(rect);
	redraw();
}

function handleClick(e){
	var lx=localx(e.clientX), ly=localy(e.clientY);
	var idx = readHitBuffer(lx,ly);
	if(idx<0) return;
	if(!e.shiftKey) return;
	rects.splice(idx, 1);
	redraw();
}

function redraw(){redrawRectLayer();redrawHitBuffer();}

function redrawRectLayer(){
	var ctx = rectlayer.getContext('2d');
	ctx.clearRect(0,0,10000,10000);
	ctx.fillStyle = 'rgba(255,255,0,0.7)';
	ctx.strokeStyle = 'rgba(255,255,0,0.7)';
	for(var i in rects) redrawRect(ctx, rects[i]);
}

function redrawHitBuffer(){
	var ctx = hitbuffer.getContext('2d');
	ctx.clearRect(0,0,10000,10000);
	for(var i=0;i<rects.length;i++){
		var n = i+1;
		var low = hexdigit(n&0xf);
		var mid = hexdigit((n>>4)&0xf);
		var high = hexdigit((n>>8)&0xf);
		ctx.fillStyle = '#'+high+'F'+mid+'F'+low+'F';
		ctx.strokeStyle = '#'+high+'F'+mid+'F'+low+'F';
		redrawRect(ctx, rects[i]);
	}
}

function redrawRect(ctx, r){
	var type=r[0]; x1=r[1], y1=r[2], x2=r[3], y2=r[4];
	if(type=='r'){
		fillRoundRect(ctx, x1, y1, x2, y2, 3);
	} else if(type=='l'){
		ctx.lineCap="round";
		ctx.lineWidth =  r[5];
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();		
	}
}


function fillRoundRect(ctx, ix1, iy1, ix2, iy2, r){
	var x1=Math.min(ix1, ix2), y1=Math.min(iy1,iy2);
	var x2=Math.max(ix1, ix2), y2=Math.max(iy1,iy2);
	ctx.beginPath();
	ctx.moveTo(x1+r,y1);
	ctx.lineTo(x2-r,y1);
	ctx.quadraticCurveTo(x2,y1,x2,y1+r);
	ctx.lineTo(x2,y2-r);
	ctx.quadraticCurveTo(x2,y2,x2-r,y2);
	ctx.lineTo(x1+r,y2);
	ctx.quadraticCurveTo(x1,y2,x1,y2-r);
	ctx.lineTo(x1,y1+r);
	ctx.quadraticCurveTo(x1,y1,x1+r,y1);
	ctx.fill();	
}


function readHitBuffer(x,y){
	var ctx = hitbuffer.getContext('2d');
	var pixels = ctx.getImageData(x, y, 2, 2).data;
	if(pixels[0]==0) return -1;
	var high = pixels[0]>>4;
	var mid = pixels[1]>>4;
	var low = pixels[2]>>4;
	return (high<<8)+(mid<<4)+low-1;
}


function localx(gx){
	var lx = gx-mouselayer.getBoundingClientRect().left;
	return Math.max(0, Math.min(700, Math.round(lx)));
}

function localy(gy){
	var ly = gy-mouselayer.getBoundingClientRect().top;
	return Math.max(0, Math.min(550, Math.round(ly)));
}

function hexdigit(n){return '0123456789ABCDEF'.charAt(n);}
function dist(x1,y1,x2,y2){return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));}

/////////////////////////
//
// Load and Save
//
/////////////////////////

function loadTile(filename){
  var request=new XMLHttpRequest()
  request.onreadystatechange=function(){tileLoaded(request);}
  request.open('GET','rects/'+filename+'.txt',true)
  request.send(null);
}

function tileLoaded(request){
  if (request.readyState!=4) return;
  if (request.status!=200) return;
  var array = request.responseText.split('\r\n');
  array.pop();
	for(var i=0;i<array.length;i++) array[i]=array[i].split(' ');
	for(var i=0;i<array.length;i++) parseInts(array[i]);
	rects = array;
	redraw();
}

function parseInts(a){
	for(var i=1;i<a.length;i++) a[i]=parseInt(a[i]);
}

function submit(name){
	saveTile(name, rectsString());
}

function saveTile(name, str){
	var request = new XMLHttpRequest();
	request.onreadystatechange=function(){tileSaved(request);};
	request.open('PUT', 'savetile.php?name='+name, true);
	request.setRequestHeader("Content-Type", 'text/plain');
	request.send(str);
}


function tileSaved(req, start, len){
	if (req.readyState!=4) return;
	if (req.status!=200) return;
	alert("tile submitted: "+req.responseText);
}


function rectsString(){
	var res = '';
	for(var i in rects) res=res+rects[i].join(' ')+'\r\n';
	return res;
}


