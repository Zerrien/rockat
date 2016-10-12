module.exports = class CelestialBody {
	constructor(size, map, target, orbit, speed, mass, name) {
		this.size = size;
		this.map = map;
		this.geometry = new THREE.SphereGeometry(this.size, 128, 128);
		this.material = new THREE.MeshLambertMaterial({map:map});
		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.target = target;
		this.orbit = orbit;
		this.speed = speed;
		this.mass = mass;
		this.name = name;

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