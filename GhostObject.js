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
module.exports = class GhostObject {
	constructor(mesh, piggen) {
		this.mesh = mesh;
		this.update(piggen);
		this.canMakeSound = true;
		this.nearestCeles = null
		this.isDonate = false;
		this.lastName = "";
	}
	update(what) {
		this.mesh.position.x = what.pos.x;
		this.mesh.position.y = what.pos.y;
		this.mesh.position.z = what.pos.z;
		this.mesh.rotation.y = what.pitch;
		this.mesh.rotation.x = what.roll;
		this.mesh.rotation.z = what.yaw;
		if(this.canMakeSound) {
			if(this.piggen) {
				if(what.isGrounded && what.isGrounded !== this.piggen.isGrounded) {
					sounds[(soundIndex++) % 10].play();
					this.canMakeSound = false;
					setTimeout(function() {
						this.canMakeSound = true;
					}.bind(this), 250);

					if(this.nearestCeles.name !== "Terra" && this.nearestCeles.name !== this.lastName) {
						this.lastName = this.nearestCeles.name;
						var chatlog = $("<div>").addClass("chat");
						if(this.isDonate) {
							chatlog.addClass("subchat");
						}
						chatlog.text(this.charName + " has "+phrases[this.nearestCeles.name]+" " + this.nearestCeles.name + ".");
						$("#log").append(chatlog)
						setTimeout(function() {
							$("#log :first-child").remove();
						}, 3000);
					}
				}
			}
		}
		this.piggen = what;
	}
	logic(dTime, tTime, entities) {
		var tSize = dTime;
		var tStep = tSize / 100;
		var celestial = this.findNearestCelestial(entities);
		this.nearestCeles = celestial;
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
		if(pos.z > 1) {
			$("#"+this.uuid).hide();	
		} else {

			$("#"+this.uuid).show();
		}
		$("#"+this.uuid).css('left', Math.round((pos.x + 1) * ($("#renderContainer").innerWidth()) / 2))
		$("#"+this.uuid).css('top', Math.round((-1 * pos.y + 1) * (window.innerHeight * 0.8) / 2) - 64)

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