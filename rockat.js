var scene, camera, renderer;
var geometry, material, mesh;

$(function() {
	init();
})


var sTime, pTime, dTime, tTime;
var obj;
var keyArray = [];

function init() {
	window.onwheel = function(e) {
		mouse.deltaY = e.deltaY;
	}
	window.onmousedown = function(e) {
		mouse.isDown = true;
		mouse.isHeld = true;
		mouse.clickPos.x = e.offsetX;
		mouse.clickPos.y = e.offsetY;

		cameraObj.oYaw = cameraObj.yaw;
		cameraObj.oPitch = cameraObj.pitch;
	}
	window.onmouseup = function(e) {
		mouse.isDown = false;
		mouse.isHeld = false;
		mouse.clickPos.x = null;
		mouse.clickPos.y = null;
		mouse.movePos.x = null;
		mouse.movePos.y = null;
	}
	window.onmousemove = function(e) {
		mouse.movePos.x = e.offsetX;
		mouse.movePos.y = e.offsetY;
	}
	window.onkeydown = function(e) {
		// WASD
		// 87, 65, 83, 68
		// QE
		// 81, 69
		keyArray[e.keyCode] = true;
	}
	window.onkeyup = function(e) {
		keyArray[e.keyCode] = false;
	}


	var manager = new THREE.LoadingManager();
	manager.onProgress = function(xhr) {
		if(xhr.lengthComputable) {
			var percentComplete = xhr.loaded / xhr.total * 100;
		}
	}
	var texture = new THREE.Texture();
	var worldTexture = new THREE.Texture();
	var lunaTexture = new THREE.Texture();
	var loader = new THREE.ImageLoader(manager);
	loader.load('piggen_colored.png', function(image) {
		texture.image = image;
		texture.needsUpdate = true;
	});
	loader.load('world.png', function(image) {
		worldTexture.image = image;
		worldTexture.needsUpdate = true;
	});
	loader.load('luna.png', function(image) {
		lunaTexture.image = image;
		lunaTexture.needsUpdate = true;
	});
	var loader = new THREE.OBJLoader(manager);
	loader.load('piggen.obj', function(object) {
		object.traverse(function(child) {
			if(child instanceof THREE.Mesh) {
				child.material.map = texture;
			}
		});
		object.position.y = TERRA_SIZE;
		object.position.x = 0;
		object.position.z = 0;
		obj = object;
		obj.velocity = {
			x: 0,
			y: 0,
			z: 0
		}
		obj.acceleration = {
			x: 0,
			y: 0,
			z: 0
		}
		scene.add(obj);
	}, function() {

	}, function() {

	});

	scene = new THREE.Scene();
	var ambient = new THREE.AmbientLight( 0x222222 );
	scene.add( ambient );
	directionalLight = new THREE.DirectionalLight( 0xCCCCCC);
	directionalLight.position.set( 0, 1, 0 );
	scene.add( directionalLight );
	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000000000);
	camera.position.z = 2;
	camera.position.y = 1;
	
	//geometry = new THREE.BoxGeometry(200, 200, 200);
	//material = new THREE.MeshBasicMaterial({color:0xff0000, wireframe: true});

	//mesh = new THREE.Mesh(geometry, material);

	//scene.add(mesh);
	// Radius of Earth is 6.371m units
	var geometry = new THREE.SphereGeometry(TERRA_SIZE, 256, 256);
	var material = new THREE.MeshLambertMaterial( {map: worldTexture} );
	plane = new THREE.Mesh( geometry, material );
	//plane.rotation.x = -Math.PI / 2;
	//plane.position.y = -6371000 / 16;
	plane.rotation.x = Math.PI / 2;
	plane.rotation.z = Math.PI / 2;
	scene.add( plane );

	var geo = new THREE.SphereGeometry(LUNA_SIZE, 128, 128);
	var mat = new THREE.MeshLambertMaterial({map: lunaTexture});
	luna = new THREE.Mesh(geo, mat);
	luna.position.y = TERRA_SIZE * 2;
	scene.add(luna);


	geometry = new THREE.SphereGeometry(6371000 / 8, 256, 256);
	material = new THREE.MeshLambertMaterial( {color: 0xFFFF00} );

	material.emissive.r = 1
	material.emissive.g = 1
	plane2 = new THREE.Mesh( geometry, material );
	//plane.rotation.x = -Math.PI / 2;
	plane2.position.y = 6371000 * 10;
	scene.add( plane2 );

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);

	document.body.appendChild(renderer.domElement);

	sTime = (new Date()).getTime();
	pTime = sTime;
	tTime = 0;
	setInterval(main, 10 / speedModifier);


	scene2 = new THREE.Scene();
	var ballTexture = new THREE.Texture();
	var loader = new THREE.ImageLoader(manager);
	loader.load('ball-texture.png', function(object) {
		ballTexture.image = object;
		ballTexture.needsUpdate = true;
	})
	renderer2 = new THREE.WebGLRenderer({alpha:true});
	renderer2.setSize(window.innerWidth, window.innerHeight);
	//renderer2.setClearColorHex( 0x000000, 1 );
	camera2 = new THREE.OrthographicCamera(-window.innerWidth / 2, window.innerWidth / 2, -window.innerHeight / 2, window.innerHeight / 2, 1, 10000);
	//camera2.position.x = -2;
	camera2.position.z = -1000;
	camera2.up = new THREE.Vector3(0, 1, 0);
	camera2.lookAt(new THREE.Vector3(0, 0, 0));
	var elem = renderer2.domElement;
	elem.style.position = "absolute";
	elem.style.left = 0;
	elem.style.top = 0;

	geometry = new THREE.SphereGeometry(100, 32, 32);
	material = new THREE.MeshBasicMaterial({map: ballTexture});
	navBall = new THREE.Mesh(geometry, material);
	navBall.position.x = 0;
	navBall.position.y = window.innerHeight / 2 - 100;
	navBall.position.z = 0;
	navBall.rotation.x = Math.PI / 2;
	scene2.add(navBall);

	document.body.appendChild(elem);


	renderer3 = new THREE.WebGLRenderer();
	camera3 = new THREE.PerspectiveCamera(15, window.innerWidth / window.innerHeight, 1, 100);
	renderer3.setSize(200, 200);
	var elem2 = renderer3.domElement
	elem2.style.position = "absolute";
	elem2.style.right = 16;
	elem2.style.bottom = 16;

	elem2.style.border = "1px solid white"
	elem2.style.borderRadius = "16px"
	document.body.appendChild(elem2);

}

var navBall;
var scene2, renderer2, camera2;

var render3, camera3;

var directionalLight;
var plane2;
var mouse = {
	isDown: false,
	isHeld: false,
	clickPos: {
		x: null,
		y: null
	},
	movePos: {
		x: null,
		y: null
	},
	deltaY: 0
}
var speedModifier = 1;
function main() {
	sTime = (new Date()).getTime();
	dTime = sTime - pTime;
	dTime *= speedModifier;
	tTime += dTime;
	control();
	logic();
	render();
	pTime = sTime;
}

var piggenPhysics = {
	vel: {
		x: 0,
		y: 0,
		z: 0
	},
	acc: {
		x: 0,
		y: 0,
		z: 0
	}
}

var TERRA_SIZE = 16;
var LUNA_SIZE = 4;
var luna;
function control() {
	if(mouse.isHeld) {
		cameraObj.yaw = cameraObj.oYaw + (mouse.movePos.x - mouse.clickPos.x) / window.innerWidth * Math.PI * 2;
		cameraObj.pitch = Math.min(Math.max(cameraObj.oPitch + (mouse.movePos.y - mouse.clickPos.y) / window.innerHeight * Math.PI * 2, -Math.PI), -0.0000001);
	}
	if(mouse.deltaY !== 0) {
		cameraObj.distance = Math.max(cameraObj.distance + mouse.deltaY / 100, 2);
		mouse.deltaY = 0;
	}
	/*

		// WASD
		// 87, 65, 83, 68
		// QE
		// 81, 69
	*/
	// This is all hacky.
	// Need to do HARD MATH to figure it out.
	if(keyArray[81]) {
		navBall.rotation.y += 0.001 * dTime;
		obj.rotation.y += 0.001 * dTime;
	} else if (keyArray[69]) {
		navBall.rotation.y -= 0.001 * dTime;
		obj.rotation.y -= 0.001 * dTime;
	}
	if(keyArray[87]) {
		navBall.rotation.z += 0.001 * dTime;
		obj.rotation.z += 0.001 * dTime;
		birb.pitch += 0.001 * dTime;
	} else if (keyArray[83]) {
		navBall.rotation.z -= 0.001 * dTime;
		obj.rotation.z -= 0.001 * dTime;
		birb.pitch -= 0.001 * dTime;
	}

	if(keyArray[65]) {
		navBall.rotation.x += 0.001 * dTime;
		obj.rotation.x += 0.001 * dTime;
		birb.yaw += 0.001 * dTime;
	} else if (keyArray[68]) {
		navBall.rotation.x -= 0.001 * dTime;
		obj.rotation.x -= 0.001 * dTime;
		birb.yaw -= 0.001 * dTime;
	}
	if(keyArray[32]) {
		isThrusting = true;
		isGrounded = false;
	} else {
		isThrusting = false;
	}
}
var isThrusting = false;
var cameraObj = {
	oYaw: 0,
	yaw: 0,
	oPitch: 0,
	pitch: -Math.PI / 2,
	distance: 2
}
var birb = {
	yaw: 0,
	pitch: Math.PI / 2,
	roll: 0
}
var isGrounded = true;
var groundPos = {
	x:0, y:1, z:0,
	rX: 0, rY: 0, rZ: 0
}
function logic() {
	// TODOS:
	// Nav Ball needs to rotate relative to it's current position, not WASDQE only affecting pitch/yaw/roll directly
	// Grounded things should rotate on the surface with their parent object


	//navBall.rotation.y = tTime / 1000;
	directionalLight.position.set( Math.cos(tTime / 100000 + Math.PI / 4), Math.sin(tTime / 100000 + Math.PI / 4), 0 );
	//plane.position.y = 6371000 * 10;
	plane2.position.set(Math.cos(tTime / 100000 + Math.PI / 4) * 6371000 * 10, Math.sin(tTime / 100000 + Math.PI / 4) * 6371000 * 10, 0)

	luna.position.set(Math.cos(tTime / 10000 + Math.PI / 4) * TERRA_SIZE * 4, Math.sin(tTime / 10000 + Math.PI / 4) * TERRA_SIZE * 4, 0)
	luna.rotation.x = tTime / 100000;
	plane.rotation.x = tTime / 10000;

	// 0.01 mass. Tiny little birb.
	var nearestCelestial = null;
	var nearestSize = null;
	var lunaDist = Math.sqrt(Math.pow(obj.position.x - luna.position.x,2) + Math.pow(obj.position.y - luna.position.y ,2) + Math.pow(obj.position.z - luna.position.z ,2));
	var terraDist = Math.sqrt(Math.pow(obj.position.x,2) + Math.pow(obj.position.y ,2) + Math.pow(obj.position.z,2));
	if(terraDist < lunaDist) {
		nearestCelestial = plane;
		nearestSize = TERRA_SIZE;
	} else {
		nearestCelestial = luna;
		nearestSize = LUNA_SIZE;
	}
	var a = new THREE.Vector3(obj.position.x - nearestCelestial.position.x, obj.position.y - nearestCelestial.position.y, obj.position.z - nearestCelestial.position.z);
	a.normalize();
	obj.acceleration.y = -9.8 * 0.01 * a.y;
	obj.acceleration.x = -9.8 * 0.01 * a.x;
	obj.acceleration.z = -9.8 * 0.01 * a.z;

	if(!isGrounded) {
		if(isThrusting) {
			//console.log(Math.cos(obj.rotation.x), Math.cos(obj.rotation.y), Math.sin(obj.rotation.z));
			// X component
			// X = cos(yaw) * cos(pitch)
			// Y = sin(pitch)
			// Z = sin(yaw) * cos(pitch)
			// y component

			// z component
			var xDir = Math.cos(birb.yaw) * Math.cos(birb.pitch);
			var yDir = Math.sin(birb.pitch);
			var zDir = Math.sin(birb.yaw) * Math.cos(birb.pitch);
			//console.log(xDir, yDir, zDir);
			obj.acceleration.y = 0.01 / 0.01 * dTime / 100 * yDir;
			obj.acceleration.x = 0.01 / 0.01 * dTime / 100 * xDir;
			obj.acceleration.z = 0.01 / 0.01 * dTime / 100 * zDir;
		}

		obj.position.y += obj.velocity.y * dTime / 100;
		obj.velocity.y += obj.acceleration.y * dTime / 100;

		obj.position.x += obj.velocity.x * dTime / 100;
		obj.velocity.x += obj.acceleration.x * dTime / 100;

		obj.position.z += obj.velocity.z * dTime / 100;
		obj.velocity.z += obj.acceleration.z * dTime / 100;


		/*
		if(obj.position.y < 0) {
			obj.position.y = 0;
			obj.velocity.y = 0;
			obj.acceleration.y = 0;
		}
		*/
		if(Math.sqrt(Math.pow(obj.position.x - nearestCelestial.position.x,2) + Math.pow(obj.position.y - nearestCelestial.position.y,2) + Math.pow(obj.position.z - nearestCelestial.position.z,2)) < nearestSize) {
			//obj.position.y = 0;
			var a = new THREE.Vector3(obj.position.x - nearestCelestial.position.x, obj.position.y - nearestCelestial.position.y, obj.position.z - nearestCelestial.position.z);
			a.normalize();
			//obj.position.x = nearestCelestial.position.x + nearestSize * a.x;
			//obj.position.y = nearestCelestial.position.y + nearestSize * a.y;
			//obj.position.z = nearestCelestial.position.z + nearestSize * a.z;
			obj.velocity.y = 0;
			obj.acceleration.y = 0;
			obj.velocity.x = 0;
			obj.acceleration.x = 0;
			obj.velocity.z = 0;
			obj.acceleration.z = 0;
			isGrounded = true;
			groundPos = {
				x: a.x, y: a.y, z: a.z,
				rX:nearestCelestial.rotation.x, rY:nearestCelestial.rotation.y, rZ:nearestCelestial.rotation.z
			}
			console.log(groundPos);
		}
	} else {
		// Gotta take rotation and modify vector (uhg)
		var v = THREE.Vector3;
		var q = THREE.Quaternion;
		var e = THREE.Euler;

		//console.log(nearestCelestial.rotation.x, nearestCelestial.rotation.y, nearestCelestial.rotation.z);

		

		/*
		var cos = Math.cos;
		var sin = Math.sin;
		var yaw = nearestCelestial.rotation.x;
		var roll = nearestCelestial.rotation.y;
		var pitch = nearestCelestial.rotation.z;
		var x = -cos(yaw) * sin(pitch) * sin(roll)-sin(yaw)*cos(roll)
		var y = -sin(yaw) * sin(pitch) * sin(roll)+cos(yaw)*cos(roll)
		var z = cos(pitch)*sin(roll)
		//console.log(x, y, z);
		//console.log(groundPos.x, groundPos.y, groundPos.z);

		var q1 = new q();
		q1.setFromAxisAngle(new v(x, y, z), Math.PI );
		var v1 = new v(groundPos.x, groundPos.y, groundPos.z);
		v1.applyQuaternion(q1);
		console.log(v1);
		//console.log(x, y, z);
		*/

		var e1 = new e(nearestCelestial.rotation.x - groundPos.rX, nearestCelestial.rotation.y - groundPos.rY, nearestCelestial.rotation.z - groundPos.rZ, 'XYZ');
		//console.log(e1)
		var q1 = new q();
		q1.setFromEuler(e1);
		var v1 = new v(groundPos.y, groundPos.x, groundPos.z);
		v1.applyQuaternion(q1);

		obj.position.x = nearestCelestial.position.x + nearestSize * v1.x; // Vector direction of landing
		obj.position.y = nearestCelestial.position.y + nearestSize * v1.y;
		obj.position.z = nearestCelestial.position.z + nearestSize * v1.z;

	}

	$("#altitude").text("Distance: " + (Math.sqrt(Math.pow(obj.position.x,2) + Math.pow(obj.position.y,2) + Math.pow(obj.position.z,2)) / nearestSize));
	$("#velocity").text("Velocity: " + obj.velocity.x.toFixed(4) +", " + obj.velocity.y.toFixed(4) + ", " + obj.position.z.toFixed(4));
	$("#acceleration").text("Acceleration: " + obj.acceleration.x.toFixed(4)  + ", "+ obj.acceleration.y.toFixed(4) + ", " + obj.position.z.toFixed(4));
	$("#actualRotation").text("Actual Rotation: " + obj.rotation.x + ", " + obj.rotation.y + ", " + obj.rotation.z);
	$("#componentRotation").text("P/Y/R: " + birb.pitch.toFixed(2) + ", " + birb.yaw.toFixed(2) + ", " + birb.roll.toFixed(2));

	camera.position.set(obj.position.x + Math.cos(cameraObj.yaw) * Math.sin(cameraObj.pitch) * cameraObj.distance, obj.position.y +  Math.cos(cameraObj.pitch) * cameraObj.distance, obj.position.z +  Math.sin(cameraObj.yaw) * Math.sin(cameraObj.pitch) * cameraObj.distance);
	camera.up = new THREE.Vector3(0, 1, 0);
	camera.lookAt(new THREE.Vector3(obj.position.x, obj.position.y, obj.position.z));

	camera3.position.set(obj.position.x + 1.5, obj.position.y + 0.75, obj.position.z);
	camera3.up = new THREE.Vector3(0, 1, 0);
	camera3.lookAt(new THREE.Vector3(obj.position.x, obj.position.y + 0.75, obj.position.z));

}
function render() {
	renderer.render( scene, camera );
	renderer2.render(scene2, camera2);
	renderer3.render(scene, camera3);
}
