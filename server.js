var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 3000});

var connections = [];
var sTime = (new Date()).getTime();
function hasValidXYZ(obj) {
	if(typeof obj.x === "number" && typeof obj.y === "number" && typeof obj.z === "number") {
		return true;
	}
	return false;
}
wss.on('connection', function connection(ws) {
	console.log("Incoming connection...");
	connections.push(ws);
	ws.uuid = (new Date()).getTime() + "" + Math.round(Math.random() * 999999);
	ws.key = Math.round(Math.random() * 9999999999);
	ws.piggen = null;
	ws.canEmote = true;
	ws.nextEmote = -1;
	ws.send(JSON.stringify({
		messageType: "connection_confirmed",
		data: {
			uuid: ws.uuid,
			key: ws.key,
			tTime: (new Date()).getTime() - sTime
		}
	}));
	ws.on('message', function(e) {
		try {
			var message = JSON.parse(e);
			switch(message.messageType) {
				case "piggen_update":
					if(message.data.key === ws.key) {
						if(typeof message.data.name === "string" && typeof message.data.isDonator === "boolean") {
							if(typeof message.data.piggen.pos === "object" && typeof message.data.piggen.vel === "object" && typeof message.data.piggen.acc === "object" && typeof message.data.piggen.anchorLoc === "object") {
								if(typeof message.data.piggen.pitch === "number" && typeof message.data.piggen.yaw === "number" && typeof message.data.piggen.roll === "number" && typeof message.data.piggen.isGrounded === "boolean") {
									if(hasValidXYZ(message.data.piggen.pos) && hasValidXYZ(message.data.piggen.vel) && hasValidXYZ(message.data.piggen.acc) && hasValidXYZ(message.data.piggen.anchorLoc)) {
										ws.piggen = message.data.piggen;
										ws.name = message.data.name.substring(0, 12);
										ws.isDonator = message.data.isDonator;
									} else {
										throw new Error("pos, vel, acc, or anchor loc doesn't have valid xyz");
									}
								} else {
									throw new Error("pitch, yaw, roll, or isGrounded type mismatch");
								}
							} else {
								throw new Error("pos, vel, acc, or anchorLoc not objects.");
							}
						} else {
							throw new Error("name or isDonator type-mismatch");
						}
					} else {
						console.log("Key mismatch... Naughty, naughty?");
					}
					break;
				case "emote":
					if(message.data.key === ws.key) {
						ws.canEmote = false;
						setTimeout(function() {
							ws.canEmote = true;

						}, 3000);
						ws.nextEmote = message.data.num;
					} else {
						console.log("Key mismatch... Naughty, naughty?");
					}
					break;
				default:
					console.log("Recieved unknown message type: ", message.messageType);
					break;
			}
		} catch(e) {
			console.log(e);
			console.log("Bad data...");
			ws.close();
		}
	});
	var interval = setInterval(function() {
		for(var i = 0; i < connections.length; i++) {
			var con = connections[i];
			if(con.uuid !== ws.uuid && con.piggen !== null) {
				try {
					ws.send(JSON.stringify({
						messageType: "world_update",
						data: {
							uuid: con.uuid,
							name: con.name.substring(0, 12),
							piggen: con.piggen,
							isDonator: con.isDonator,
							emote: con.nextEmote
						}
					}));
					if(con.nextEmote !== -1) {
						con.nextEmote = -1;
					}
				} catch(e) {
					ws.close();
				}
			}
		}
	}, 10);
	ws.onclose = function connection_closing(e) {
		for(var i = 0; i < connections.length; i++) {
			var con = connections[i];
			if(con.uuid !== ws.uuid) {
				try {
					con.send(JSON.stringify({
						messageType: "dead_unit",
						data: {
							uuid: ws.uuid
						}
					}));
				} catch(e) {
					con.close();
				}
			}
		}
		console.log("Connection closing...");
		connections.splice(connections.indexOf(ws), 1);
		clearInterval(interval);
		delete ws;
	}
});






/*
wss.on('connection', function connection(ws2) {
	let ws = ws2;
	console.log("Incoming connection...");
	connections.push(ws);
	ws.lastHeard = (new Date()).getTime();
	//Odds of collision are: low-ish.
	ws.uuid = (new Date()).getTime() + ":" + Math.round(Math.random() * 99999);
	console.log(ws.uuid);
	ws.send(JSON.stringify({youruuid:ws.uuid}));
	ws.on('message', function message(message) {
		if(message == "pong") {
			ws.lastHeard = (new Date()).getTime();
		} else {
			var a;
			try {
				a = JSON.parse(message);
				ws.piggen = a;
			} catch(e) {
				console.log(e);
				ws.close();
			}
		}
	});
	ws.on('close', function() {
		connections.splice(connections.indexOf(ws), 1);
		console.log("Closing connection...");
		delete ws;
	})
});

setInterval(function() {
	var curTime = (new Date()).getTime();
	for(var i = 0; i < connections.length; i++) {
		var ws = connections[i];
		ws.send("ping");
		if(curTime - ws.lastHeard > 10000) {
			console.log("Lost connnection to socket.");
			ws.close();
			continue;
		}
		for(var j = 0; j < connections.length; j++) {
			if(j === i) {
				continue;
			}
			if(connections[j].piggen) {
				ws.send(JSON.stringify({
					piggen: connections[j].piggen,
					uuid: connections[j].uuid
				}));
			}
		}
	}
}, 1000);
*/