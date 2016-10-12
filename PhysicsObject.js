var CelestialBody = require('./CelestialBody.js');
var phrases = {
	"Sol":"been vaporized on the surface of",
	"Fe":"touched down on",
	"Rojo":"kicked up dust on",
	"Terra":"returned to",
	"Luna":"landed on",
	"Wasser":"splashed down on",
	"Igloo":"discovered"
}
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
		this.dist = 0;
		this.canMakeSound = true;
		this.nearestCeles = null;
		this.lastName = "";
	}
	logic(dTime, tTime, entities) {
		this.mesh.rotation.y = this.pitch;
		this.mesh.rotation.z = this.yaw;
		this.mesh.rotation.x = this.roll;
		//console.log(this.pitch, this.yaw, this.roll);
		var tSize = 1 / 64;
		var pDir = new THREE.Vector3(1, 0, 0);
		pDir.applyMatrix4(navBallQ);
		var celestial = this.findNearestCelestial(entities);
		this.nearestCeles = celestial;
		var dir = celestial.pos.sub(this.pos);
		var gForce2 = 0.01 * (celestial.mass * this.mass) / (celestial.pos.distanceToSquared(this.pos));
		while(dTime > 0) {
			dTime -= tSize;
			if(isThrusting) {
				this.isGrounded = false;
			}
			if(!this.isGrounded) {
				
				dir = celestial.pos.sub(this.pos).normalize();
				var tStep = tSize / 100;

				this.mesh.position.x += tStep * (this.vel.x + tStep * this.acc.x / 2);
				this.mesh.position.y += tStep * (this.vel.y + tStep * this.acc.y / 2);
				this.mesh.position.z += tStep * (this.vel.z + tStep * this.acc.z / 2);

				celestial = this.findNearestCelestial(entities);
				this.nearestCeles = celestial;

				gForce2 = 0.01 * (celestial.mass * this.mass) / (celestial.pos.distanceToSquared(this.pos));
				this.dist = Math.sqrt(celestial.pos.distanceToSquared(this.pos)) - celestial.size;
				var tAccX2, tAccY2, tAccZ2;
				//var pitch = this.pitch;
				//var yaw = this.yaw;
				//var pDir = new THREE.Vector3(Math.cos(yaw) * Math.cos(pitch), Math.sin(pitch), Math.sin(yaw) * Math.cos(pitch));
				//console.log(this.pitch, this.yaw, this.roll);
				//var pDir = new THREE.Vector3(Math.cos(this.pitch) * Math.cos(this.yaw), Math.sin(this.yaw), Math.sin(this.pitch) * Math.cos(this.yaw));
				
				//console.log(pDir);
				//console.log(pDir);
				pDir = new THREE.Vector3(1, 0, 0);
				pDir.applyMatrix4(navBallQ);
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
					if(this.canMakeSound) {
						sounds[(soundIndex++) % 10].play();
						this.canMakeSound = false;
						setTimeout(function() {
							this.canMakeSound = true;
						}.bind(this), 250);

						if(this.nearestCeles.name !== "Terra" && this.nearestCeles.name !== this.lastName) {
							this.lastName = this.nearestCeles.name;
							var chatlog = $("<div>").addClass("chat");
							if(document.URL.match(/donater=(1+)/)) {
								chatlog.addClass("subchat");
							}
							chatlog.text($("#nameField").val().substring(0, 12) + (document.URL.match(/donater=(1+)/) ? " 💵" : "") + " has "+phrases[this.nearestCeles.name]+" " + this.nearestCeles.name + ".");
							$("#log").append(chatlog)
							setTimeout(function() {
								$("#log :first-child").remove();
							}, 3000);
						}
					}
					this.target = celestial;
					this.velocity.set(0, 0, 0);
				}
			} else {
				this.mesh.position.x = this.target.pos.x + this.anchorLoc.x * this.target.size;
				this.mesh.position.y = this.target.pos.y + this.anchorLoc.y * this.target.size;
				this.mesh.position.z = this.target.pos.z + this.anchorLoc.z * this.target.size;
			}
		}

		facingDir.vertices[0].set(this.pos.x, this.pos.y, this.pos.z);
		facingDir.vertices[1].set(this.pos.x + pDir.x * 5, this.pos.y + pDir.y * 5, this.pos.z + pDir.z * 5);
		facingDir.verticesNeedUpdate = true;

		prograde.vertices[0].set(this.pos.x, this.pos.y, this.pos.z);
		prograde.vertices[1].set(this.pos.x + this.vel.x * 5, this.pos.y + this.vel.y * 5, this.pos.z + this.vel.z * 5);
		prograde.verticesNeedUpdate = true;

		retrograde.vertices[0].set(this.pos.x, this.pos.y, this.pos.z);
		retrograde.vertices[1].set(this.pos.x - this.vel.x * 5, this.pos.y - this.vel.y * 5, this.pos.z - this.vel.z * 5);
		retrograde.verticesNeedUpdate = true;

		if(!this.isGrounded) {
			gravityDir.vertices[0].set(this.pos.x, this.pos.y, this.pos.z);
			gravityDir.vertices[1].set(this.pos.x + dir.x * gForce2 * 2.5, this.pos.y + dir.y * gForce2 * 2.5, this.pos.z + dir.z * gForce2 * 2.5);
			gravityDir.verticesNeedUpdate = true;
		} else {
			gravityDir.vertices[0].set(this.pos.x, this.pos.y, this.pos.z);
			gravityDir.vertices[1].set(this.pos.x, this.pos.y, this.pos.z);
			gravityDir.verticesNeedUpdate = true;
		}


		$("#altitude").html("Altitude<br>"+this.dist.toFixed(2) + "<br>" + this.vel.length().toFixed(2) + "u/s");
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