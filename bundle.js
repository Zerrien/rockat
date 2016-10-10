/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var CelestialBody = __webpack_require__(1);
	var PhysicsObject = __webpack_require__(2);
	var GhostObject = __webpack_require__(3);
	var assetsObj = __webpack_require__(4);

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
		ws = new WebSocket('ws://goaggro.com:3000');
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

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = class CelestialBody {
		constructor(size, map, target, orbit, speed, mass) {
			this.size = size;
			this.map = map;
			this.geometry = new THREE.SphereGeometry(this.size, 128, 128);
			this.material = new THREE.MeshLambertMaterial({map:map});
			this.mesh = new THREE.Mesh(this.geometry, this.material);
			this.target = target;
			this.orbit = orbit;
			this.speed = speed;
			this.mass = mass;

			var parentPos = this.orbit;
			var parent = this.target;
			while(parent) {
				parentPos += parent.orbit;
				parent = parent.target;
			}
			this.mesh.position.x = parentPos;
			
		}
		logic(dTime, tTime, entities) {
			var finalPos = new THREE.Vector3(0, 0, 0);
			var parent = this.target;
			while(parent) {
				finalPos.add(parent.pos);
				parent = parent.target;
			}
			this.mesh.position.x = finalPos.x + Math.cos(tTime / 1000 * this.speed) * this.orbit;
			this.mesh.position.z = finalPos.z + Math.sin(tTime / 1000 * this.speed) * this.orbit;
		}
		get pos() {
			return new THREE.Vector3(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z) 
		}
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var CelestialBody = __webpack_require__(1);
	module.exports = class PhysicsObject {
		constructor(mesh, target, mass) {
			this.mesh = mesh;
			this.isGrounded = true;
			this.target = target;
			this.acceleration = new THREE.Vector3(0, 0, 0);
			this.velocity = new THREE.Vector3(0, 0, 0);
			this.mass = mass;
			this.mesh.position.x = this.target.pos.x;
			this.mesh.position.y = this.target.pos.y + this.target.size;
			this.mesh.position.z = this.target.pos.z;
			this.anchorLoc = {
				x: 0,
				y: 1,
				z: 0
			}
			this.pitch = 0;
			this.yaw = 0;
			this.roll = 0;
		}
		logic(dTime, tTime, entities) {
			this.mesh.rotation.x = this.pitch;
			this.mesh.rotation.z = this.yaw;
			this.mesh.rotation.y = this.roll;
			//console.log(this.pitch, this.yaw, this.roll);
			var tSize = 1 / 64;
			while(dTime > 0) {
				dTime -= tSize;
				if(isThrusting) {
					this.isGrounded = false;
				}
				if(!this.isGrounded) {
					var celestial = this.findNearestCelestial(entities);
					var dir = celestial.pos.sub(this.pos).normalize();
					var tStep = tSize / 100;

					this.mesh.position.x += tStep * (this.vel.x + tStep * this.acc.x / 2);
					this.mesh.position.y += tStep * (this.vel.y + tStep * this.acc.y / 2);
					this.mesh.position.z += tStep * (this.vel.z + tStep * this.acc.z / 2);


					var gForce2 = 0.01 * (celestial.mass * this.mass) / (celestial.pos.distanceToSquared(this.pos));
					var tAccX2, tAccY2, tAccZ2;
					//var pitch = this.pitch;
					//var yaw = this.yaw;
					//var pDir = new THREE.Vector3(Math.cos(yaw) * Math.cos(pitch), Math.sin(pitch), Math.sin(yaw) * Math.cos(pitch));
					//console.log(this.pitch, this.yaw, this.roll);
					var pDir = new THREE.Vector3(Math.cos(this.pitch) * Math.cos(this.yaw), Math.sin(this.yaw), Math.sin(this.pitch) * Math.cos(this.yaw));
					//console.log(pDir);
					var thrustModifier = 1.5;
					if(isThrusting) {
						tAccX2 = dir.x * gForce2 + pDir.x * thrustModifier;
						tAccY2 = dir.y * gForce2 + pDir.y * thrustModifier;
						tAccZ2 = dir.z * gForce2 + pDir.z * thrustModifier;
					} else {
						tAccX2 = dir.x * gForce2;
						tAccY2 = dir.y * gForce2;
						tAccZ2 = dir.z * gForce2;
					}
					
					this.velocity.x += tStep * (this.acc.x + tAccX2) / 2;
					this.velocity.x *= 0.999999995;
					this.velocity.y += tStep * (this.acc.y + tAccY2) / 2;
					this.velocity.y *= 0.999999995;
					this.velocity.z += tStep * (this.acc.z + tAccZ2) / 2;
					this.velocity.z *= 0.999999995;

					this.acceleration.x = tAccX2;
					this.acceleration.y = tAccY2;
					this.acceleration.z = tAccZ2;

					if(this.pos.distanceTo(celestial.pos) < celestial.size) {
						dir.negate();
						this.mesh.position.x = celestial.pos.x + dir.x * celestial.size;
						this.mesh.position.y = celestial.pos.y + dir.y * celestial.size;
						this.mesh.position.z = celestial.pos.z + dir.z * celestial.size;
						this.anchorLoc.x = dir.x;
						this.anchorLoc.y = dir.y;
						this.anchorLoc.z = dir.z;
						this.isGrounded = true;
						this.target = celestial;
						this.velocity.set(0, 0, 0);
					}
				} else {
					this.mesh.position.x = this.target.pos.x + this.anchorLoc.x * this.target.size;
					this.mesh.position.y = this.target.pos.y + this.anchorLoc.y * this.target.size;
					this.mesh.position.z = this.target.pos.z + this.anchorLoc.z * this.target.size;
				}
			}
		}
		get acc() {
			return this.acceleration;
		}
		get vel() {
			return this.velocity;
		}
		get pos() {
			return new THREE.Vector3(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);
		}
		findNearestCelestial(entities) {
			//Eventually refactor this so that it takes into sphere of influences, based on mass etc.
			var nearest = null;
			var nearestDist = Infinity;
			for(var i = 0; i < entities.length; i++) {
				var entity = entities[i];
				if(entity instanceof CelestialBody) {
					var dist = this.pos.distanceToSquared(entity.pos);
					if(dist < nearestDist) {
						nearestDist = dist;
						nearest = entity;
					}
				}
			}
			return nearest;
		}
	}

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var CelestialBody = __webpack_require__(1);
	module.exports = class GhostObject {
		constructor(mesh, piggen) {
			this.mesh = mesh;
			this.update(piggen);
		}
		update(what) {
			this.mesh.position.x = what.pos.x;
			this.mesh.position.y = what.pos.y;
			this.mesh.position.z = what.pos.z;
			this.mesh.rotation.x = what.pitch;
			this.mesh.rotation.y = what.roll;
			this.mesh.rotation.z = what.yaw;
			this.piggen = what;
		}
		logic(dTime, tTime, entities) {
			/*
			this.mesh.position.x += tStep * (this.vel.x + tStep * this.acc.x / 2);
			this.mesh.position.y += tStep * (this.vel.y + tStep * this.acc.y / 2);
			this.mesh.position.z += tStep * (this.vel.z + tStep * this.acc.z / 2);
			*/
			var tSize = dTime;
			var tStep = tSize / 100;
			var celestial = this.findNearestCelestial(entities);
			if(!this.piggen.isGrounded) {
				this.mesh.position.x += tStep * (this.piggen.vel.x + tStep * this.piggen.acc.x / 2);
				this.mesh.position.y += tStep * (this.piggen.vel.y + tStep * this.piggen.acc.y / 2);
				this.mesh.position.z += tStep * (this.piggen.vel.z + tStep * this.piggen.acc.z / 2);
				this.piggen.vel.x += tStep * (this.piggen.acc.x) / 2;
				this.piggen.vel.x *= 0.999999995;
				this.piggen.vel.y += tStep * (this.piggen.acc.y) / 2;
				this.piggen.vel.y *= 0.999999995;
				this.piggen.vel.z += tStep * (this.piggen.acc.z) / 2;
				this.piggen.vel.z *= 0.999999995;
			} else {
				this.mesh.position.x = celestial.pos.x + this.piggen.anchorLoc.x * celestial.size;
				this.mesh.position.y = celestial.pos.y + this.piggen.anchorLoc.y * celestial.size;
				this.mesh.position.z = celestial.pos.z + this.piggen.anchorLoc.z * celestial.size;
			}
			/*
			var pos = new THREE.Vector3(piggen.pos.x, piggen.pos.y, piggen.pos.z);
			pos.project(systemCamera);
			nameTag.css('left', Math.round((pos.x + 1) * window.innerWidth / 2))
			nameTag.css('top', Math.round((-1 * pos.y + 1) * window.innerHeight / 2))
			*/
			var pos = new THREE.Vector3(this.piggen.pos.x, this.piggen.pos.y, this.piggen.pos.z);
			pos.project(systemCamera);
			$("#"+this.uuid).css('left', Math.round((pos.x + 1) * window.innerWidth / 2))
			$("#"+this.uuid).css('top', Math.round((-1 * pos.y + 1) * window.innerHeight / 2))


			/*
			this.mesh.rotation.x = this.pitch;
			this.mesh.rotation.z = this.yaw;
			this.mesh.rotation.y = this.roll;
			//console.log(this.pitch, this.yaw, this.roll);
			var tSize = 1 / 64;
			while(dTime > 0) {
				dTime -= tSize;
				if(isThrusting) {
					this.isGrounded = false;
				}
				if(!this.isGrounded) {
					var celestial = this.findNearestCelestial(entities);
					var dir = celestial.pos.sub(this.pos).normalize();
					var tStep = tSize / 100;

					this.mesh.position.x += tStep * (this.vel.x + tStep * this.acc.x / 2);
					this.mesh.position.y += tStep * (this.vel.y + tStep * this.acc.y / 2);
					this.mesh.position.z += tStep * (this.vel.z + tStep * this.acc.z / 2);


					var gForce2 = 0.01 * (celestial.mass * this.mass) / (celestial.pos.distanceToSquared(this.pos));
					var tAccX2, tAccY2, tAccZ2;
					//var pitch = this.pitch;
					//var yaw = this.yaw;
					//var pDir = new THREE.Vector3(Math.cos(yaw) * Math.cos(pitch), Math.sin(pitch), Math.sin(yaw) * Math.cos(pitch));
					//console.log(this.pitch, this.yaw, this.roll);
					var pDir = new THREE.Vector3(Math.cos(this.pitch) * Math.cos(this.yaw), Math.sin(this.yaw), Math.sin(this.pitch) * Math.cos(this.yaw));
					//console.log(pDir);
					var thrustModifier = 1.5;
					if(isThrusting) {
						tAccX2 = dir.x * gForce2 + pDir.x * thrustModifier;
						tAccY2 = dir.y * gForce2 + pDir.y * thrustModifier;
						tAccZ2 = dir.z * gForce2 + pDir.z * thrustModifier;
					} else {
						tAccX2 = dir.x * gForce2;
						tAccY2 = dir.y * gForce2;
						tAccZ2 = dir.z * gForce2;
					}
					
					this.velocity.x += tStep * (this.acc.x + tAccX2) / 2;
					this.velocity.x *= 0.999999995;
					this.velocity.y += tStep * (this.acc.y + tAccY2) / 2;
					this.velocity.y *= 0.999999995;
					this.velocity.z += tStep * (this.acc.z + tAccZ2) / 2;
					this.velocity.z *= 0.999999995;

					this.acceleration.x = tAccX2;
					this.acceleration.y = tAccY2;
					this.acceleration.z = tAccZ2;

					if(this.pos.distanceTo(celestial.pos) < celestial.size) {
						dir.negate();
						this.mesh.position.x = celestial.pos.x + dir.x * celestial.size;
						this.mesh.position.y = celestial.pos.y + dir.y * celestial.size;
						this.mesh.position.z = celestial.pos.z + dir.z * celestial.size;
						this.anchorLoc.x = dir.x;
						this.anchorLoc.y = dir.y;
						this.anchorLoc.z = dir.z;
						this.isGrounded = true;
						this.target = celestial;
						this.velocity.set(0, 0, 0);
					}
				} else {
					this.mesh.position.x = this.target.pos.x + this.anchorLoc.x * this.target.size;
					this.mesh.position.y = this.target.pos.y + this.anchorLoc.y * this.target.size;
					this.mesh.position.z = this.target.pos.z + this.anchorLoc.z * this.target.size;
				}
			}
			*/
		}
		findNearestCelestial(entities) {
			//Eventually refactor this so that it takes into sphere of influences, based on mass etc.
			var nearest = null;
			var nearestDist = Infinity;
			for(var i = 0; i < entities.length; i++) {
				var entity = entities[i];
				if(entity instanceof CelestialBody) {
					var pos = new THREE.Vector3(this.piggen.pos.x,this.piggen.pos.y,this.piggen.pos.z);
					var dist = pos.distanceToSquared(entity.pos);
					if(dist < nearestDist) {
						nearestDist = dist;
						nearest = entity;
					}
				}
			}
			return nearest;
		}
	}

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = {
		textures: {
			piggen: "piggen_colored.png",
			terra: "world.png",
			luna: "luna.png",
			sol: "sol.png",
			fe: "fe.png",
			navball: "ball-texture.png"
		},
		models: {
			piggen: {
				src: "piggen.obj",
				texture: "piggen"
			}
		}
	};

/***/ }
/******/ ]);