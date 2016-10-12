var CelestialBody = require('./CelestialBody.js');
var PhysicsObject = require('./PhysicsObject.js');
var GhostObject = require('./GhostObject.js');
var assetsObj = require('./assets.js');

var entityArray = [];
var assets = {
	textures: {},
	models: {}
};

window.sounds = [];
window.soundIndex = 0;
for(var i = 0; i < 10; i++) {
	sounds.push(new Audio('plop'+((i % 5)+1)+'.wav'))
	sounds[i].volume = 0.125;
}



var faceRenderer = new THREE.WebGLRenderer();
faceRenderer.setSize(128, 128);
var faceCamera = new THREE.PerspectiveCamera(30, 1, 1, 10000000);

var terra, luna, sol, fe;
var rojo, wasser, igloo;
var piggen;
var navBall;
var skyBox;

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
		(function() {
			var key2 = key;
			i++;
			let src = assetsObj.textures[key2];
			assets.textures[key2] = new THREE.Texture();
			textureLoader.load(src, function(image) {
				assets.textures[key2].image = image;
				assets.textures[key2].needsUpdate = true;
				if(--i === 0) {
					//init();
					nameInit();
				}
			})
		})();
	}
	for(let key in assetsObj.models) {
		(function() {
			var key2 = key;
			i++;
			let obj = assetsObj.models[key2];
			assets.models[key2] = null;
			modelLoader.load(obj.src, function(mesh) {
				mesh.traverse(function(child) {
					if(child instanceof THREE.Mesh) {
						child.material.map = assets.textures[obj.texture];
					}
				});
				assets.models[key2] = mesh;
				//console.log(assets.models[key].clone());
				if(--i === 0) {
					//init();
					nameInit();
				}
			});
		})();
	}
}
function nameInit() {
	$("#nameForm").show();
}

function setupScenes() {
	//var ambient = new THREE.AmbientLight( 0x222222 );
	var ambient = new THREE.AmbientLight( 0x222222 );
	systemScene.add( ambient );
	var point = new THREE.PointLight(0xFFFFFF)
	point.position.set( 0, 1, 0 );

	systemScene.add( point );
	$("#renderContainer").append(systemRenderer.domElement);

	/*
	var hudElem = hudRenderer.domElement;
	hudElem.style.position = "absolute";
	hudElem.style.left = 0;
	hudElem.style.top = 0;
	$("#renderContainer").append(hudElem);
	*/

	var faceElem = faceRenderer.domElement;
	faceElem.style.position = "absolute";
	faceElem.style.left = "calc(100% - 128px - 32px)";
	faceElem.style.top = "calc(100% - 128px - 32px)";
	faceElem.style.borderRadius = "32px";
	faceElem.style.border = "2px solid rgba(100, 0, 0, 1)";
	$("#renderContainer").append(faceElem);

	systemScene.add(proLine);
	systemScene.add(retroLine);
	systemScene.add(gravityLine);
	systemScene.add(facingLine);
}
var line;
var geo;
var mat;
function setupSystem() {
	sol = new CelestialBody(128 * 10, assets.textures.sol, null, 0, 0, 128000 * 100 * 1000, "Sol");
	sol.material.emissiveMap = assets.textures.sol;
	sol.material.emissive.r = 1;
	sol.material.emissive.g = 1;
	sol.material.emissive.b = 1;
	systemScene.add(sol.mesh);
	entityArray.push(sol);

	fe = new CelestialBody(16, assets.textures.fe, sol, sol.size * 4, 0.125 / 8, 128000 / 2, "Fe");
	systemScene.add(fe.mesh);
	entityArray.push(fe);
	
	terra = new CelestialBody(32, assets.textures.terra, sol, sol.size * 32, 0.125 / 32 / 8 / 8 / 8 , 128000, "Terra");
	systemScene.add(terra.mesh);
	entityArray.push(terra);
	
	luna = new CelestialBody(4, assets.textures.luna, terra, terra.size * 8, 0.125 / 32 , 128000 / 32, "Luna");
	systemScene.add(luna.mesh);
	entityArray.push(luna);

	rojo = new CelestialBody(48, assets.textures.rojo, sol, sol.size * 16, 0.125 / 32 / 8 / 8, 128000, "Rojo");
	systemScene.add(rojo.mesh);
	entityArray.push(rojo);

	wasser = new CelestialBody(128, assets.textures.wasser, sol, sol.size * 64, 0.125 / 32 / 8 / 8 / 8, 128000 * 8, "Wasser");
	systemScene.add(wasser.mesh);
	entityArray.push(wasser);

	igloo = new CelestialBody(8, assets.textures.igloo, sol, sol.size * 128, 0.125 / 32 / 8 / 8 / 8 , 128000, "Igloo");
	systemScene.add(igloo.mesh);
	entityArray.push(igloo);

	var MAX_POINTS = 500;
	var geometry = new THREE.BufferGeometry();
	var positions = new Float32Array(MAX_POINTS * 3);
	geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
	geometry.setDrawRange(0, 500);
	var material = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 1 } );

	// line
	line = new THREE.Line( geometry,  material );
	//systemScene.add( line );

	for(var i = 0; i < 1; i++) {

		var isDonator;
		if(document.URL.match(/donater=(1+)/)) {
			isDonator = true;
		} else {
			isDonator = false;
		}
		if(isDonator) {
			piggen = new PhysicsObject(assets.models.katsuit_orange.clone(), terra, 1);
			var katpack = assets.models.katpack_orange.clone();
			piggen.mesh.add(katpack)
			var ushank = assets.models.ushanka.clone();
			piggen.mesh.add(ushank);
		} else {
			piggen = new PhysicsObject(assets.models.katsuit.clone(), terra, 1);
			var katpack = assets.models.katpack.clone();
			piggen.mesh.add(katpack)
		}

		piggen.mesh.add(faceCamera);
		var katface = assets.models.kat.clone();
		piggen.mesh.add(katface)
		var kathelm = assets.models.kathelmet.clone();
		piggen.mesh.add(kathelm);
		systemScene.add(piggen.mesh);
		entityArray.push(piggen);
		//piggen.mesh.position.y = terra.size * 4;
		//piggen.mesh.position.x = terra.size * 2;
		//piggen.mesh.position.x = terra.pos.x - 40 + Math.random() * 80;
		//piggen.mesh.position.z = terra.pos.z - 40 + Math.random() * 80;
		//piggen.velocity.x = 4;
		//piggen.isGrounded = false;
		if(isDonator) {
			piggen.mesh.scale.set(0.75,0.75,0.75);
		} else {
			piggen.mesh.scale.set(0.5,0.5,0.5);
		}
		faceCamera.up = new THREE.Vector3(0, 1, 0);
		faceCamera.position.set(8, 5, 0);
		faceCamera.lookAt(new THREE.Vector3(0, 5, 0));
	}


	var geo = new THREE.SphereGeometry(100, 32, 32);
	var mat = new THREE.MeshLambertMaterial({map:assets.textures.navball});
	navBall = new THREE.Mesh(geo, mat);
	navBall.position.y = (window.innerHeight * 0.8) / 2 - 100;
	//hudScene.add(navBall);
	//hudScene.add(new THREE.AmbientLight(0xFFFFFF));
	navBall.target = piggen;

	geo = new THREE.SphereGeometry(5, 8, 8);
	mat = new THREE.MeshLambertMaterial({color: 0xFF0000});
	cursorDot = new THREE.Mesh(geo, mat);
	cursorDot.position.y = (window.innerHeight * 0.8) / 2 - 100;
	cursorDot.position.z = -100;
	//hudScene.add(cursorDot);

	var materialArray = [];
	var order = ["left", "right", "up", "down", "front", "back"];
	for(var i = 0; i < 6; i++) {
		materialArray.push(new THREE.MeshBasicMaterial({
			map: assets.textures["sky_" + order[i]],
			side: THREE.BackSide
		}))
	}
	var skyGeo = new THREE.CubeGeometry(10000000, 10000000, 10000000);
	var skyMat = new THREE.MeshFaceMaterial(materialArray);
	skyBox = new THREE.Mesh(skyGeo, skyMat);
	skyBox.position.x = piggen.mesh.position.x;
	skyBox.position.y = piggen.mesh.position.y;
	skyBox.position.z = piggen.mesh.position.z;
	systemScene.add(skyBox);

}

function setupEventListeners() {
	window.onresize = function(e) {
		systemRenderer.setSize(($("#renderContainer").innerWidth()), (window.innerHeight * 0.8));
		window.systemCamera = new THREE.PerspectiveCamera(60, ($("#renderContainer").innerWidth()) / (window.innerHeight * 0.8), 1, 10000000);
	}
	window.onwheel = function(e) {
		mouse.deltaY = e.deltaY;
	}
	window.onmousedown = function(e) {
		mouse.isDown = mouse.isHeld = true;
		mouse.clickPos.x = e.clientX;
		mouse.clickPos.y = e.clientY;
	}
	window.onmouseup = function(e) {
		mouse.clickPos.x = mouse.clickPos.y = null;
		mouse.isDown = mouse.isHeld = false;
	}
	window.onmousemove = function(e) {
		mouse.curPos.x = e.clientX;
		mouse.curPos.y = e.clientY;
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
var systemRenderer, systemScene;
window.init = function init() {
	;
	
	systemRenderer = new THREE.WebGLRenderer();
	systemRenderer.setSize(($("#renderContainer").innerWidth()), (window.innerHeight * 0.8));
	//systemRenderer.setSize(($("#renderContainer").innerWidth()), (window.innerHeight * 0.8));
	systemScene = new THREE.Scene();
	window.systemCamera = new THREE.PerspectiveCamera(60, ($("#renderContainer").innerWidth()) / (window.innerHeight * 0.8), 1, 10000000);
	/*
	var hudRenderer = new THREE.WebGLRenderer({alpha:true});
	hudRenderer.setSize(($("#renderContainer").innerWidth()), (window.innerHeight * 0.8));
	var hudScene = new THREE.Scene();
	var hudCamera = new THREE.OrthographicCamera(-($("#renderContainer").innerWidth()) / 2, ($("#renderContainer").innerWidth()) / 2, -(window.innerHeight * 0.8) / 2, (window.innerHeight * 0.8) / 2, 1, 10000);
	hudCamera.position.z = -1000;
	hudCamera.up = new THREE.Vector3(0, 1, 0);
	hudCamera.lookAt(new THREE.Vector3(0, 0, 0));
	*/




	$(".planetContainer").tooltip();
	$("#nameForm").hide();
	setupEventListeners();
	setupScenes();
	setupSystem();
	ws = new WebSocket('ws://localhost:3000');
	var isDonator;
	if(document.URL.match(/donater=(1+)/)) {
		isDonator = true;
	} else {
		isDonator = false;
	}
	ws.onopen = function() {
		var interval = setInterval(function() {
			if(key) {
				ws.send(JSON.stringify({
					messageType: "piggen_update",
					data: {
						name: $("#nameField").val(),
						key: key,
						isDonator: isDonator,
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
			}
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
						var nameTag = $("<div>");
						var nameEmote = $("<div>");
						nameTag.append(nameEmote);
						
						nameEmote.addClass("emote")
						nameTag.addClass("nameTag");
						nameTag.attr('id', message.data.uuid);
						var nameText = $("<div>");
						nameText.text($("#nameField").val().substring(0, 12) + (isDonator ? " 💵" : ""));
						nameTag.append(nameText);
						if(isDonator) {
							nameTag.addClass("isDonator");
						}
						$("#renderContainer").append(nameTag);
						nameTag.css("left", "calc(100% - 128px - 32px + 64px - "+nameTag.outerWidth()/2+"px)");
						nameTag.css("top", "calc(100% - 128px - 32px + 128px - "+nameTag.outerHeight()+"px)");

						var chatlog = $("<div>").addClass("chat");
						if(isDonator) {
							chatlog.addClass("subchat");
						}
						chatlog.text($("#nameField").val().substring(0, 12) + (isDonator ? " 💵" : "") + " has joined.");
						$("#log").append(chatlog)
						setTimeout(function() {
							$("#log :first-child").remove();
						}, 3000);


						break;
					case "world_update":
						if(ghosts[message.data.uuid]) {
							ghosts[message.data.uuid].piggen = message.data.piggen;
							ghosts[message.data.uuid].name = message.data.name;
							ghosts[message.data.uuid].obj.update(message.data.piggen);
							console.log()
							if(message.data.emote !== -1) {
								console.log($("#"+message.data.uuid+" .emote"));
								$("#"+message.data.uuid+" .emote").append($("<img>").attr("src", "em"+message.data.emote+".png"));
								setTimeout(function() {
									$("#"+message.data.uuid+" .emote").text("");
								}, 3000);
								//console.log("EMOTE DETECTED!");
							}
						} else {
							console.log("New ghost detected.");
							var tDon = message.data.isDonator;
							var tobj;
							if(tDon) {
								tobj =  new GhostObject(assets.models.katsuit_orange.clone(), message.data.piggen)
								tobj.isDonate = true;
							} else {
								tobj =  new GhostObject(assets.models.katsuit.clone(), message.data.piggen)
							}

							tobj.charName = message.data.name.substring(0, 12) + (message.data.isDonator ? " 💵" : "");
							ghosts[message.data.uuid] = {
								piggen: message.data.piggen,
								obj: tobj
							}
							var chatlog = $("<div>").addClass("chat");
							if(tDon) {
								chatlog.addClass("subchat");
							}
							chatlog.text(message.data.name.substring(0, 12) + (message.data.isDonator ? " 💵" : "") + " has joined.");
							$("#log").append(chatlog)
							setTimeout(function() {
								$("#log :first-child").remove();
							}, 3000);
							ghosts[message.data.uuid].name = message.data.name;
							var t = ghosts[message.data.uuid].obj.mesh;
							var katface = assets.models.kat.clone();
							t.add(katface)
							//var katpack = assets.models.katpack.clone();
							//t.add(katpack)
							var kathelm = assets.models.kathelmet.clone();
							t.add(kathelm);
							if(tDon) {
								t.add(assets.models.ushanka.clone());
								ghosts[message.data.uuid].obj.mesh.scale.set(0.75, 0.75, 0.75);
								var katpack = assets.models.katpack_orange.clone();
								t.add(katpack)
							} else {
								ghosts[message.data.uuid].obj.mesh.scale.set(0.5, 0.5, 0.5);
								var katpack = assets.models.katpack.clone();
								t.add(katpack)
							}
							ghosts[message.data.uuid].obj.uuid = message.data.uuid
							var nameTag = $("<div>");
							ghosts[message.data.uuid].dom = nameTag
							nameTag.addClass("nameTag");

							var nameEmote = $("<div>");
							nameEmote.addClass("emote");
							nameTag.append(nameEmote);
							var nameText = $("<div>");
							nameText.text(message.data.name.substring(0, 12) + (message.data.isDonator ? " 💵" : ""));
							nameTag.append(nameText);


							/*
							var nameTag = $("<div>");
						var nameEmote = $("<div>");
						nameTag.append(nameEmote);
						
						nameEmote.addClass("emote")
						nameTag.addClass("nameTag");
						nameTag.attr('id', message.data.uuid);
						var nameText = $("<div>");
						nameText.text($("#nameField").val().substring(0, 12) + (isDonator ? " 💵" : ""));
						nameTag.append(nameText);
							*/
							$("#renderContainer").append(nameTag);
							if(message.data.isDonator) {
								nameTag.addClass('isDonator')
							}
							var pos = new THREE.Vector3(piggen.pos.x, piggen.pos.y, piggen.pos.z);
							pos.project(systemCamera);

							nameTag.css('left', Math.round((pos.x + 1) * (window.innerWidth - 300) / 2))
							nameTag.css('top', Math.round(window.innerHeight * 0.1 + (-1 * pos.y + 1) * (window.innerHeight * 0.8) / 2))
							nameTag.attr("id", message.data.uuid);

							systemScene.add(ghosts[message.data.uuid].obj.mesh);
							entityArray.push(ghosts[message.data.uuid].obj);
						}
						//console.log(message.data);
						break;
					case "dead_unit":
						if(ghosts[message.data.uuid]) {
							systemScene.remove(ghosts[message.data.uuid].obj.mesh);
							$("#"+message.data.uuid).remove();
						}
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
var canEmote = true;
function doEmoji(n) {
	$("#"+uuid + " .emote").append($("<img>").attr("src", "em"+n+".png"));
	canEmote = false;
	ws.send(JSON.stringify({
		messageType: "emote",
		data: {
			key: key,
			num: n
		}
	}));
	setTimeout(function() {
		$("#"+uuid + " .emote").html("");
		canEmote = true;
	}, 3000);
}
function control() {
	// 48 -> 57
	if(canEmote) {
		if(keyArray[48]) {
			doEmoji(0);
		}
		if(keyArray[49]) {
			doEmoji(1);
			
		}
		if(keyArray[50]) {
			doEmoji(2);
			
		}
		if(keyArray[51]) {
			doEmoji(3);
			
		}
		if(keyArray[52]) {
			doEmoji(4);
			
		}
		if(keyArray[53]) {
			doEmoji(5);
			
		}
		if(keyArray[54]) {
			doEmoji(6);
			
		}
		if(keyArray[55]) {
			doEmoji(7);
			
		}
		if(keyArray[56]) {
			doEmoji(8);
			
		}
		if(keyArray[57]) {
			doEmoji(9);

		}
	}
	if(mouse.isHeld) {
		mouse.isHeld = false;
		cameraObj.oYaw = cameraObj.yaw;
		cameraObj.oPitch = cameraObj.pitch;
		cameraObj.oRoll = cameraObj.roll;
	}
	if(mouse.isDown) {
		cameraObj.yaw = cameraObj.oYaw + (mouse.curPos.x - mouse.clickPos.x) / ($("#renderContainer").innerWidth()) * Math.PI * 2;
		cameraObj.pitch = Math.min(Math.max(cameraObj.oPitch + (mouse.curPos.y - mouse.clickPos.y) / (window.innerHeight * 0.8) * Math.PI * 2, -Math.PI + 0.0000001), -0.0000001);
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
		m1.makeRotationZ(-1 * delta);
		navBallQ.multiply(m1);
		
	} else if (keyArray[83]) {
		//S
		var m1 = new THREE.Matrix4();
		m1.makeRotationZ(delta);
		navBallQ.multiply(m1);
	}
	if(keyArray[65]) {
		//A
		var m1 = new THREE.Matrix4();
		m1.makeRotationY(delta);
		navBallQ.multiply(m1);
	} else if(keyArray[68]) {
		//D
		var m1 = new THREE.Matrix4();
		m1.makeRotationY(-1 * delta);
		navBallQ.multiply(m1);
	}
	if(keyArray[81]) {
		//Q
		var m1 = new THREE.Matrix4();
		m1.makeRotationX(-1 * delta);
		navBallQ.multiply(m1);
	} else if(keyArray[69]) {
		//E
		var m1 = new THREE.Matrix4();
		m1.makeRotationX(delta);
		navBallQ.multiply(m1);
	}
	var e = new THREE.Euler();
	e.setFromRotationMatrix(navBallQ);
	piggen.yaw = e.z;
	piggen.roll = e.x;
	piggen.pitch = e.y;
	var v1 = new THREE.Vector3(1, 0, 0);
	v1.applyMatrix4(navBallQ);
	//console.log(v1);

	

	navBall.rotation.x = e.z; // Yeah, ok
	navBall.rotation.y = e.y;
	navBall.rotation.z = e.x; // Yep, makes sense.
}


var proMat = new THREE.LineBasicMaterial({color:0x00FF00})
window.prograde = new THREE.Geometry();
prograde.vertices.push(
	new THREE.Vector3(0, 0, 0),
	new THREE.Vector3(0, 0, 0)
)
var proLine = new THREE.Line(prograde, proMat);
proLine.frustumCulled = false;
var retroMat = new THREE.LineBasicMaterial({color:0xFF0000})
window.retrograde = new THREE.Geometry();
retrograde.vertices.push(
	new THREE.Vector3(0, 0, 0),
	new THREE.Vector3(0, 0, 0)
)
var retroLine = new THREE.Line(retrograde, retroMat);
retroLine.frustumCulled = false;
var gravityMat = new THREE.LineBasicMaterial({color:0x0000FF})
window.gravityDir = new THREE.Geometry();
gravityDir.vertices.push(
	new THREE.Vector3(0, 0, 0),
	new THREE.Vector3(0, 0, 0)
)
var gravityLine = new THREE.Line(gravityDir, gravityMat);
gravityLine.frustumCulled = false;
var facingMat = new THREE.LineBasicMaterial({color:0xFFFFFF})
window.facingDir = new THREE.Geometry();
facingDir.vertices.push(
	new THREE.Vector3(0, 0, 0),
	new THREE.Vector3(0, 0, 0)
)
var facingLine = new THREE.Line(facingDir, facingMat);
facingLine.frustumCulled = false;


/*
var mat2 = new THREE.LineBasicMaterial({color:0xFFFF00})
window.geo2 = new THREE.Geometry();
geo2.vertices.push(
	new THREE.Vector3(-10000000, 0, 0),
	new THREE.Vector3(10000000, 0, 0)
)
var testLine = new THREE.Line(geo2);
testLine.frustumCulled = false;
*/

window.isThrusting = false;
window.navBallQ = new THREE.Matrix4();

function logic() {
	//navBall.rotation.x = navBall.target.pitch + Math.PI / 2;
	//navBall.rotation.z = navBall.target.yaw;
	//navBall.rotation.setFromRotationMatrix(navBallQ, 'YXZw')

	for(var i = 0; i < entityArray.length; i++) {
		if(entityArray[i].logic) {
			entityArray[i].logic(dTime, tTime, entityArray);
		}
	}
	var pos = piggen.pos;

	skyBox.position.x = piggen.mesh.position.x;
	skyBox.position.y = piggen.mesh.position.y;
	skyBox.position.z = piggen.mesh.position.z;

	pos.add(new THREE.Vector3(Math.cos(cameraObj.yaw) * Math.sin(cameraObj.pitch) * cameraObj.distance, Math.cos(cameraObj.pitch) * cameraObj.distance, Math.sin(cameraObj.yaw) * Math.sin(cameraObj.pitch) * cameraObj.distance));

	systemCamera.position.set(pos.x, pos.y + 2.5, pos.z);
	systemCamera.up = new THREE.Vector3(0, 1, 0);
	systemCamera.lookAt(piggen.pos.add(new THREE.Vector3(0, 2.5, 0)));

	//faceCamera.up = new THREE.Vector3(0, 1, 0);
	//faceCamera.position.set(piggen.pos.x + 4 * pDir.x, piggen.pos.y + 2.5 * pDir.z, piggen.pos.z);
	//faceCamera.lookAt(piggen.pos.add(new THREE.Vector3(0, 2.5, 0)));
}
function render() {
	systemRenderer.render(systemScene, systemCamera);
	//hudRenderer.render(hudScene, hudCamera);
	faceRenderer.render(systemScene, faceCamera);
}
function ui() {
	for(var i = 0; i < entityArray.length; i++) {
		if(entityArray[i].ui) {
			entityArray[i].ui(dTime, tTime, entityArray);
		}
	}
}