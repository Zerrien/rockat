var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 3000});

var connections = [];
var sTime = (new Date()).getTime();
wss.on('connection', function connection(ws) {
	console.log("Incoming connection...");
	connections.push(ws);
	ws.uuid = (new Date()).getTime() + "" + Math.round(Math.random() * 999999);
	ws.key = Math.round(Math.random() * 9999999999);
	ws.piggen = null;
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
						ws.piggen = message.data.piggen;
					} else {
						console.log("Key mismatch... Naughty, naughty?");
					}
					break;
				default:
					console.log("Recieved unknown message type: ", message.messageType);
					break;
			}
		} catch(e) {
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
							piggen: con.piggen
						}
					}));
				} catch(e) {
					// Safety!
				}
			}
		}
	}, 10);
	ws.onclose = function connection_closing(e) {
		for(var i = 0; i < connections.length; i++) {
			var con = connections[i];
			if(con.uuid !== ws.uuid) {
				try {
					ws.send(JSON.stringify({
						messageType: "dead_unit",
						data: {
							uuid: ws.uuid
						}
					}));
				} catch(e) {
					// meh
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