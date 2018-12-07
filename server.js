const express = require('express'); 
const app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8080;

app.use(express.static('public'));

var players = [];
var playerList = [];
var games = [];

function createPlayer(player)
{
	player.name = "";
	player.id = Math.random();
	player.moveVector = [0, 0, 0, 0];
	player.gameId = "";
	player.game = undefined;
	players[player.socketId] = player;
	playerList.push(player);
}

function createGame(game)
{
	game.players = [];
	game.enemies = [];
	game.projectiles = [];
	game.id = Math.random();
	game.active = false;
	games.push(game);
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
		for (var i = 0; i < games.length; i++)
		{
			var game = games[i];
			var gamePlayers = game.players;
			for (var a = 0; a < game.players.length; a++)
			{
				if (gamePlayers[a].socketId == socket.id)
				{
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
		var game = [];
		game.name = serverName;
		game.host = player;
		createGame(game);
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
	
	socket.on('getJoinableGames', function(data)
	{
		var gamesList = [];
		for (var i = 0; i < games.length; i++)
		{
			if (games[i].active == false && games.players.length < 10) 
			{
				gamesList.push({name: games[i].name, playerCount: games[i].players.length, id: games[i].id}); 
			}
		}
		//console.log(JSON.stringify(gamesList));
		socket.emit('getJoinableGamesResponse', {success: true, games: gamesList});
	});
});