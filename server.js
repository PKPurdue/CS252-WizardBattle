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
	players[player.socketId] = player;
	playerList.push(player);
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
});