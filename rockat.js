var CelestialBody = require('./CelestialBody.js');
var PhysicsObject = require('./PhysicsObject.js');
var GhostObject = require('./GhostObject.js');
var assetsObj = require('./assets.js');

var entityArray = [];
var assets = {
	textures: {},
	models: {}
};

var systemRenderer = new THREE.WebGLRenderer();
systemRenderer.setSize(window.innerWidth, window.innerHeight);
var systemScene = new THREE.Scene();
window.systemCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000000);
var hudRenderer = new THREE.WebGLRenderer({alpha:true});
hudRenderer.setSize(window.innerWidth, window.innerHeight);
var hudScene = new THREE.Scene();
var hudCamera = new THREE.OrthographicCamera(-window.innerWidth / 2, window.innerWidth / 2, -window.innerHeight / 2, window.innerHeight / 2, 1, 10000);
hudCamera.position.z = -1000;
hudCamera.up = new THREE.Vector3(0, 1, 0);
hudCamera.lookAt(new THREE.Vector3(0, 0, 0));

var terra, luna, sol, fe;
var piggen;
var navBall;

var manager = new THREE.LoadingManager();
var textureLoader = new THREE.ImageLoader(manager);
var modelLoader = new THREE.OBJLoader(manager);

var sTime, pTime, dTime;
window.tTime;

var mouse = {
	isDown: false,
	isHeld: false,
	deltaY: 0,
	clickPos: {
		x: null,
		y: null
	},
	curPos: {
		x: null,
		y: null
	}
};
var keyArray = [];
var cameraObj = {
	pitch: -Math.PI / 2,
	yaw: Math.PI / 2,
	roll: 0,
	oPitch: -Math.PI / 2,
	oYaw: 0,
	oRoll: 0,
	distance: 50
}

$(function() {
	loadAssets();
});

function loadAssets() {
	var i = 0;
	for(let key in assetsObj.textures) {
		i++;
		let src = assetsObj.textures[key];
		assets.textures[key] = new THREE.Texture();
		textureLoader.load(src, function(image) {
			assets.textures[key].image = image;
			assets.textures[key].needsUpdate = true;
			if(--i === 0) {
				init();
			}
		})
	}
	for(let key in assetsObj.models) {
		i++;
		let obj = assetsObj.models[key];
		assets.models[key] = null;
		modelLoader.load(obj.src, function(mesh) {
			mesh.traverse(function(child) {
				if(child instanceof THREE.Mesh) {
					child.material.map = assets.textures[obj.texture];
				}
			});
			assets.models[key] = mesh;
			console.log(assets.models[key].clone());
			if(--i === 0) {
				init();
			}
		});
	}
}

function setupScenes() {
	//var ambient = new THREE.AmbientLight( 0x222222 );
	var ambient = new THREE.AmbientLight( 0xFFFFFF );
	systemScene.add( ambient );
	var point = new THREE.PointLight(0xFFFFFF)
	point.position.set( 0, 1, 0 );

	systemScene.add( point );
	document.body.appendChild(systemRenderer.domElement);

	var hudElem = hudRenderer.domElement;
	hudElem.style.position = "absolute";
	hudElem.style.left = 0;
	hudElem.style.top = 0;
	document.body.appendChild(hudElem);


}
var line;
var geo;
var mat;
function setupSystem() {
	sol = new CelestialBody(128 * 10, assets.textures.sol, null, 0, 0, 128000 * 100);
	sol.material.emissiveMap = assets.textures.sol;
	sol.material.emissive.r = 1;
	sol.material.emissive.g = 1;
	sol.material.emissive.b = 1;
	systemScene.add(sol.mesh);
	entityArray.push(sol);

	fe = new CelestialBody(16, assets.textures.fe, sol, sol.size * 4, 0.125 / 8 / 8 / 8 / 8, 10000);
	systemScene.add(fe.mesh);
	entityArray.push(fe);
	
	terra = new CelestialBody(32, assets.textures.terra, sol, sol.size * 32, 0.125 / 32 / 8 / 8 / 8, 128000);
	systemScene.add(terra.mesh);
	entityArray.push(terra);
	
	luna = new CelestialBody(4, assets.textures.luna, terra, terra.size * 8, 0.125 / 32 / 8 / 8 / 8, 500);
	systemScene.add(luna.mesh);
	entityArray.push(luna);


	var MAX_POINTS = 500;
	var geometry = new THREE.BufferGeometry();
	var positions = new Float32Array(MAX_POINTS * 3);
	geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.setDrawRange(0, 500);
	var material = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 1 } );

	// line
	line = new THREE.Line( geometry,  material );
	systemScene.add( line );

	for(var i = 0; i < 1; i++) {
		piggen = new PhysicsObject(assets.models.piggen.clone(), terra, 1);
		systemScene.add(piggen.mesh);
		entityArray.push(piggen);
		//piggen.mesh.position.y = terra.size * 4;
		//piggen.mesh.position.x = terra.size * 2;
		//piggen.mesh.position.x = terra.pos.x - 40 + Math.random() * 80;
		//piggen.mesh.position.z = terra.pos.z - 40 + Math.random() * 80;
		//piggen.velocity.x = 4;
		//piggen.isGrounded = false;
		piggen.mesh.scale.set(10, 10, 10);
	}


	var geo = new THREE.SphereGeometry(100, 32, 32);
	var mat = new THREE.MeshLambertMaterial({map:assets.textures.navball});
	navBall = new THREE.Mesh(geo, mat);
	navBall.position.y = window.innerHeight / 2 - 100;
	hudScene.add(navBall);
	hudScene.add(new THREE.AmbientLight(0xFFFFFF));
	navBall.target = piggen;

	geo = new THREE.SphereGeometry(5, 8, 8);
	mat = new THREE.MeshLambertMaterial({color: 0xFF0000});
	cursorDot = new THREE.Mesh(geo, mat);
	cursorDot.position.y = window.innerHeight / 2 - 100;
	cursorDot.position.z = -100;
	hudScene.add(cursorDot);

}

function setupEventListeners() {
	window.onwheel = function(e) {
		mouse.deltaY = e.deltaY;
	}
	window.onmousedown = function(e) {
		mouse.isDown = mouse.isHeld = true;
		mouse.clickPos.x = e.offsetX;
		mouse.clickPos.y = e.offsetY;
	}
	window.onmouseup = function(e) {
		mouse.clickPos.x = mouse.clickPos.y = null;
		mouse.isDown = mouse.isHeld = false;
	}
	window.onmousemove = function(e) {
		mouse.curPos.x = e.offsetX;
		mouse.curPos.y = e.offsetY;
	}
	window.onkeydown = function(e) {
		keyArray[e.keyCode] = true;
	}
	window.onkeyup = function(e) {
		keyArray[e.keyCode] = false;
	}
}
var ws;
var uuid;
var key;
var ghosts = {

}
function init() {
	setupEventListeners();
	setupScenes();
	setupSystem();
	ws = new WebSocket('ws://localhost:3000');
	ws.onopen = function() {
		var interval = setInterval(function() {
			ws.send(JSON.stringify({
				messageType: "piggen_update",
				data: {
					key: key,
					piggen: {
						pos: {
							x:piggen.pos.x,
							y:piggen.pos.y,
							z:piggen.pos.z
						},
						vel: {
							x:piggen.vel.x,
							y:piggen.vel.y,
							z:piggen.vel.z
						},
						acc: {
							x:piggen.acc.x,
							y:piggen.acc.y,
							z:piggen.acc.z
						},
						pitch: piggen.pitch,
						yaw: piggen.yaw,
						roll: piggen.roll,
						isGrounded:piggen.isGrounded,
						anchorLoc:{
							x:piggen.anchorLoc.x,
							y:piggen.anchorLoc.y,
							z:piggen.anchorLoc.z
						}
					}
				}

			}))
		}, 10);
		ws.onclose = function() {
			window.clearInterval(interval);
			// Clear all the ghosts, etc.
		}
		ws.onmessage = function(e) {
			try {
				var message = JSON.parse(e.data);
				switch(message.messageType) {
					case "connection_confirmed":
						console.log("My uuid is: ", message.data.uuid);
						uuid = message.data.uuid;
						tTime = message.data.tTime;
						key = message.data.key;
						break;
					case "world_update":
					/*
					piggen = new PhysicsObject(assets.models.piggen.clone(), terra, 1);
					*/

						if(ghosts[message.data.uuid]) {
							ghosts[message.data.uuid].piggen = message.data.piggen;
							ghosts[message.data.uuid].obj.update(message.data.piggen);
						} else {
							console.log("New ghost detected.");
							ghosts[message.data.uuid] = {
								piggen: message.data.piggen,
								obj: new GhostObject(assets.models.piggen.clone(), message.data.piggen)
							}

							ghosts[message.data.uuid].obj.mesh.scale.set(10, 10, 10);

							ghosts[message.data.uuid].obj.uuid = message.data.uuid
							var nameTag = $("<div>");
							ghosts[message.data.uuid].dom = nameTag
							nameTag.addClass("nameTag");

							nameTag.text(message.data.uuid);
							$("body").append(nameTag);
							var pos = new THREE.Vector3(piggen.pos.x, piggen.pos.y, piggen.pos.z);
							pos.project(systemCamera);
							nameTag.css('left', Math.round((pos.x + 1) * window.innerWidth / 2))
							nameTag.css('top', Math.round((-1 * pos.y + 1) * window.innerHeight / 2))
							nameTag.attr("id", message.data.uuid);
							console.log(message.data.uuid);

							systemScene.add(ghosts[message.data.uuid].obj.mesh);
							entityArray.push(ghosts[message.data.uuid].obj);
						}
						//console.log(message.data);
						break;
					default:
						console.log("Unknown messageType: ", message.messageType);
						break;
				}
			} catch(e) {
				console.log("Error parsing server message", e);
				ws.close();
			}
		}
	}
	
	sTime = (new Date()).getTime();
	pTime = sTime;
	tTime = 0;
	setInterval(main, 10);
}
var lineIndex = 0;
var step = 0;
function main() {
	sTime = (new Date()).getTime();
	dTime = sTime - pTime;
	tTime += dTime;
	control();
	logic();
	if(step++ % 8 === 0) {
		var pos = line.geometry.attributes.position.array;
		pos[lineIndex] = piggen.pos.x;
		pos[lineIndex + 1] = piggen.pos.y;
		pos[lineIndex + 2] = piggen.pos.z;
		line.geometry.attributes.position.needsUpdate = true;
		lineIndex += 3;
		if(lineIndex >= 500 * 3) {
			lineIndex = 0;
		}
	}
	render();
	pTime = sTime;
}
function control() {
	if(mouse.isHeld) {
		mouse.isHeld = false;
		cameraObj.oYaw = cameraObj.yaw;
		cameraObj.oPitch = cameraObj.pitch;
		cameraObj.oRoll = cameraObj.roll;
	}
	if(mouse.isDown) {
		cameraObj.yaw = cameraObj.oYaw + (mouse.curPos.x - mouse.clickPos.x) / window.innerWidth * Math.PI * 2;
		cameraObj.pitch = Math.min(Math.max(cameraObj.oPitch + (mouse.curPos.y - mouse.clickPos.y) / window.innerHeight * Math.PI * 2, -Math.PI + 0.0000001), -0.0000001);
	}
	if(mouse.deltaY !== 0) {
		cameraObj.distance += mouse.deltaY / 100;
		if(cameraObj.distance < 2) {
			cameraObj.distance = 2;
		}
		mouse.deltaY = 0;
	}

	// 32 Space
	if(keyArray[32]) {
		//Space
		isThrusting = true;
	} else {
		isThrusting = false;
	}
	// WASD
	// 87, 65, 83, 68
	// QE
	// 81, 69
	var delta = dTime / 1000 * 2;
	if(keyArray[87]) {
		//W
		var m1 = new THREE.Matrix4();
		m1.makeRotationX(delta);
		navBallQ.premultiply(m1);
		
	} else if (keyArray[83]) {
		//S
		var m1 = new THREE.Matrix4();
		m1.makeRotationX(-1 * delta);
		navBallQ.premultiply(m1);
	}
	if(keyArray[65]) {
		//A
		var m1 = new THREE.Matrix4();
		m1.makeRotationY(-1 * delta);
		navBallQ.premultiply(m1);
	} else if(keyArray[68]) {
		//D
		var m1 = new THREE.Matrix4();
		m1.makeRotationY(delta);
		navBallQ.premultiply(m1);
	}
	if(keyArray[81]) {
		//Q
		var m1 = new THREE.Matrix4();
		m1.makeRotationZ(-1 * delta);
		navBallQ.premultiply(m1);
	} else if(keyArray[69]) {
		//E
		var m1 = new THREE.Matrix4();
		m1.makeRotationZ(delta);
		navBallQ.premultiply(m1);
	}
	var e = new THREE.Euler();
	e.setFromRotationMatrix(navBallQ);
	piggen.yaw = e.x;
	piggen.roll = e.z;
	piggen.pitch = e.y;
}
window.isThrusting = false;
var navBallQ = new THREE.Matrix4();

function logic() {
	//navBall.rotation.x = navBall.target.pitch + Math.PI / 2;
	//navBall.rotation.z = navBall.target.yaw;
	navBall.rotation.setFromRotationMatrix(navBallQ, 'XYZ')
	for(var i = 0; i < entityArray.length; i++) {
		if(entityArray[i].logic) {
			entityArray[i].logic(dTime, tTime, entityArray);
		}
	}
	var pos = piggen.pos;

	pos.add(new THREE.Vector3(Math.cos(cameraObj.yaw) * Math.sin(cameraObj.pitch) * cameraObj.distance, Math.cos(cameraObj.pitch) * cameraObj.distance, Math.sin(cameraObj.yaw) * Math.sin(cameraObj.pitch) * cameraObj.distance));

	systemCamera.position.set(pos.x, pos.y, pos.z);
	systemCamera.up = new THREE.Vector3(0, 1, 0);
	systemCamera.lookAt(piggen.pos);
}
function render() {
	systemRenderer.render(systemScene, systemCamera);
	hudRenderer.render(hudScene, hudCamera);

}
function ui() {
	for(var i = 0; i < entityArray.length; i++) {
		if(entityArray[i].ui) {
			entityArray[i].ui(dTime, tTime, entityArray);
		}
	}
}