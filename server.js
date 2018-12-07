const express = require('express'); 
const app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8080;

app.use(express.static('public'));

var players = [];
var playerList = [];
var games = [];
var moveVectorList = [];
moveVectorList.up = 0;
moveVectorList.down = 1;
moveVectorList.left = 2;
moveVectorList.right = 3;
var radianToDegree = 180 / 3.141592;


function createPlayer(player)
{
	player.name = "";
	player.id = Math.random();
	player.moveDirections = [0, 0, 0, 0];
	player.moveVector = [0, 0];
	player.gameId = "";
	player.game = undefined;
	player.health = 100;
	player.x = Math.floor(Math.random() * 100);
	player.y = Math.floor(Math.random() * 100);
	player.rotation = 0;
	player.lastFired = 0;
	player.kills = 0;
	players[player.socketId] = player;
	playerList.push(player);
}

function createGame()
{
	var game = [];
	game.players = [];
	game.enemies = [];
	game.projectiles = [];
	game.id = Math.random();
	game.active = false;
	games.push(game);
	return game.id;
}

function createProjectile(player)//, projectile)
{
	var projectilee = {};
	projectilee.ownerId = player.id;
	projectilee.moveVector = [player.moveVector[0] * 2.5, player.moveVector[1] * 2.5];
	projectilee.x = player.x;
	projectilee.y = player.y;
	projectilee.rotation = player.rotation;
	player.game.projectiles.push(projectilee);
	player.lastFired = new Date().getTime();
}

function getRadius(x1, y1, x2, y2)
{
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function checkForCollisions(game)
{
	var players = game.players;
	var projectiles = game.projectiles;
	for (var i = projectiles.length - 1; i > -1; i--)
	{
		var projectile = projectiles[i];
		for (var a = 0; a < players.length; a++)
		{
			var player = players[a];
			if (getRadius(projectile.x, projectile.y, player.x, player.y) < 2 && player.health > 0 && projectile.ownerId != player.id)
			{
				player.health = player.health - 45;
				//console.log("Projectile hit on " + player.name + ", " + player.health + " health left.");
				if (player.health < 0)
				{
					player.socket.emit('youDied', {});
					for (var o = 0; o < players.length; o++)
					{
						if (projectile.ownerId == players[o].id)
						{
							players[o].kills++;
						}
					}
				}
				projectiles.splice(i, 1);
				break;
			}
		}
	}
}

var userList = [];

app.get('/', function(req, res)
{
	res.sendFile(__dirname + '/public/index.html');
});

server.listen(port, function()
{
    console.log('listening on ' + port);
});

io.on('connection', function(socket)
{
	console.log('a user connected');
	socket.id = Math.random();
	socket.emit('socketId', {socketId: socket.id});
	
	var player = [];
	player.socket = socket;
	player.socketId = socket.id;
	createPlayer(player);

	socket.on('disconnect', function()
	{
		///remove player from player list as well
		console.log(player.name + " disconnected!");
		for (var i = 0; i < games.length; i++)
		{
			var game = games[i];
			var gamePlayers = game.players;
			for (var a = 0; a < game.players.length; a++)
			{
				if (gamePlayers[a].socketId == socket.id)
				{
					if (game.host.id == player.id)
					{
						if (gamePlayers.length == 1)
						{
							games.splice(i, 1);
							break;
						}
						else
						{
							if (gamePlayers[0].id != player.id)
							{
								game.host = gamePlayers[0];
							}
							else { game.host = gamePlayers[1]; }
						}
					}
					gamePlayers.splice(a, 1);
					//send notification to all players that player left game?//
				}
			}
		}
		for (var i = 0; i < playerList.length; i++)
		{
			if (playerList[i].socketId == socket.id)
			{
				playerList.splice(i, 1);
				break;
			}
		}
		delete players[socket.id];
	});

	socket.on('checkUsername', function(data)
	{
		var username = data.username || "";
		var found = false;
		for (var i = 0; i < playerList.length; i++)
		{
			if (playerList[i].name == username)
			{
				found = true;
				break;
			}
		}
		if (found == false)
		{
			players[socket.id].name = username;
			socket.emit('usernameResponse', {success: true});
		}
		else { socket.emit('usernameResponse', {success: false}); }
	});
	
	socket.on('createServer', function(data)
	{
		var serverName = data.serverN || "";
		var gameId = createGame(); //[];
		var game = undefined;
		for (var i = 0; i < games.length; i++)
		{
			if (games[i].id == gameId) { game = games[i]; break; }
		}
		game.name = serverName;
		game.host = player;
		//createGame(game);
		game.players.push(player);
		player.game = game;
		player.gameId = game.id;
		
		socket.emit('createServerResponse', {success: true});
	});
	
	socket.on('joinGame', function(data)
	{
		var serverName = data.serverName;
		console.log("Player: " + player.name + " is trying to join server: " + serverName);
		var game = undefined;
		for (var i = 0; i < games.length; i++)
		{
			if (games[i].name == serverName)
			{
				game = games[i];
				break;
			}
		}
		if (game == undefined)
		{
			socket.emit('joinGameResponse', {success: false, reason: "Game DNE"});
			return;
		}
		game.players.push(player);
		player.game = game;
		player.gameId = game.id;
		
		socket.emit('joinGameResponse', {success: true});
	});
	
	socket.on('startGame', function(data)
	{
		if (player.game != undefined && player.game.host.id == player.id)
		{
			console.log("Starting game: " + player.game.name);
			var game = player.game;
			game.active = true;
			for (var i = 0; i < game.players.length; i++)
			{
				game.players[i].kills = 0;
				game.players[i].health = 100;
				console.log("Starting game " + game.name + " for player " + game.players[i].name);
				game.players[i].socket.emit('gameStarting', {});
			}
		}
		else
		{
			socket.emit('startGameResponse', {success: false, reason: "You are not the host of the game."});
		}
	});
	
	socket.on('getJoinableGames', function(data)
	{
		var gamesList = [];
		for (var i = 0; i < games.length; i++)
		{
			if (games[i].active == false && games[i].players.length < 10) 
			{
				gamesList.push({name: games[i].name, playerCount: games[i].players.length, id: games[i].id}); 
			}
		}
		//console.log(JSON.stringify(gamesList));
		socket.emit('getJoinableGamesResponse', {success: true, games: gamesList});
	});
	
	socket.on('getPlayerList', function(data)
	{
		var playersInGame = [];
		if (player.game != undefined)
		{
			var game = player.game;
			var gamePlayers = player.game.players;
			for (var i = 0; i < gamePlayers.length; i++)
			{
				var tagName = "Player";
				if (game.host.id == gamePlayers[i].id) { tagName = "Host"; }
				playersInGame.push({name: gamePlayers[i].name, tag: tagName});
			}
		}
		//console.log(JSON.stringify(playersInGame));
		socket.emit('getPlayerListResponse', {success: true, players: playersInGame});
	});
	
	socket.on('keyPress', function(data)
	{
		if (data.inputId != "fire")
		{
			player.moveDirections[moveVectorList[data.inputId]] = (data.state == true && 1) || 0;
			//console.log(data.inputId + " : " + JSON.stringify(player.moveDirections));
			var hMove = player.moveDirections[3] - player.moveDirections[2];
			var vMove = player.moveDirections[1] - player.moveDirections[0];
			var denom = Math.sqrt(Math.pow(hMove, 2) + Math.pow(vMove, 2));
			if (denom == 0) { denom = 1; }
			player.moveVector = [hMove / denom, vMove / denom];
			
			if (player.moveVector[1] > 0.1)
			{
				if (player.moveVector[0] > 0.1) { player.rotation = -45; }
				else if (player.moveVector[0] < -0.1) { player.rotation = 45; }
				else { player.rotation = 0; }
			}
			else if (player.moveVector[1] < -.1)
			{
				if (player.moveVector[0] > 0.1) { player.rotation = 225; }
				else if (player.moveVector[0] < -0.1) { player.rotation = 135; }
				else { player.rotation = 180; }
			}
			else if (player.moveVector[0] > .1)
			{
				player.rotation = 270;
			}
			else if (player.moveVector[0] < -.1)
			{
				player.rotation = 90;
			}
			//console.log(player.name + "'s moveVector is " + JSON.stringify(player.moveVector));
		}
		else
		{
			if (player.game != undefined && player.game.active == true)
			{
				if (new Date().getTime() - player.lastFired > 1500 && (Math.abs(player.moveVector[0]) > 0 || Math.abs(player.moveVector[1]) > 0))
				{
					console.log("Firing");
					//var projectile = [];
					createProjectile(player);//, projectile);
				}
			}
		}
	});
});

setInterval(function()
{
	for (var i = 0; i < games.length; i++)
	{
		var game = games[i];
		if (game.active == true)
		{
			var gamePlayers = game.players;
			var projectiles = game.projectiles;
			var positions = [];
			for (var a = 0; a < gamePlayers.length; a++)
			{
				var player = gamePlayers[a];
				if (player.health < 100 && player.health > 0) { player.health = player.health + .05; }
				player.x = player.x + player.moveVector[0];
				player.y = player.y + player.moveVector[1];
				if (player.x < 0) { player.x = 0; }
				if (player.x > 96) { player.x = 96; }
				if (player.y < 0) { player.y = 0; }
				if (player.y > 90) { player.y = 90; }
				positions.push({type: "player", name: player.name, x: player.x, y: player.y, rotation: player.rotation});
			}
			for (var a = projectiles.length - 1; a > -1; a--)
			{
				var projectile = projectiles[a];
				projectile.x = projectile.x + projectile.moveVector[0];
				projectile.y = projectile.y + projectile.moveVector[1];
				var rem = false;
				if (projectile.x < 0 || projectile.x > 97 || projectile.y < 0 || projectile.y > 94)
				{
					rem = true;
				}
				if (rem == true)
				{
					projectiles.splice(a, 1);
				}
				else
				{
					positions.push({type: "projectile", x: projectile.x, y: projectile.y, rotation: projectile.rotation});
				}
			}
			checkForCollisions(game);
			//console.log(JSON.stringify(positions));
			for (var a = 0; a < gamePlayers.length; a++)
			{
				gamePlayers[a].socket.emit('positionUpdate', {objectPositions: positions});
			}
		}
	}
}, 500);