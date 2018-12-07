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

function createPlayer(player)
{
	player.name = "";
	player.id = Math.random();
	player.moveDirections = [0, 0, 0, 0];
	player.moveVector = [0, 0];
	player.gameId = "";
	player.game = undefined;
	player.x = Math.floor(Math.random() * 100);
	player.y = Math.floor(Math.random() * 100);
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
			if (hMove == 0 && vMove == 0) { vMove = -1; }
			var denom = Math.sqrt(Math.pow(hMove, 2) + Math.pow(vMove, 2));
			player.moveVector = [hMove / denom, vMove / denom];
			//console.log(player.name + "'s moveVector is " + JSON.stringify(player.moveVector));
		}
		else
		{
			if (player.game != undefined && player.game.active == true)
			{
				
			}
		}
	});
});