var socket = io();
var socket_id;

socket.on('socketId', function(data)
{
	socket_id = data.socketId;
});

socket.on('usernameResponse', function(data)
{
	if (data.success == true)
	{
		window.localStorage.setItem('username', data.nam);
		$("#chooseNameDiv")[0].style.display = "none";
		$("#serverList")[0].style.display = "block";
	}
	else
	{
		$("#nameError")[0].innerHTML = "That name is currently in use.";
		$("#nameError")[0].style.display = "block";
	}
});

function verifyName()
{
	var nam = $(".nameBox")[0].value;
	if (nam == undefined || nam.length < 4 || nam.length > 20)
	{
		$("#nameError")[0].innerHTML = "Your name must be between 4 and 20 characters long.";
		$("#nameError")[0].style.display = "block";
	}
	else
	{
		socket.emit('checkUsername', {username: nam});
	}
}

socket.on('createServerResponse', function(data)
{
	$("#serverList")[0].style.display = "none";
	$("#serverLobby")[0].style.display = "block";
});

function createGame()
{
	var serverName = $("#createServerName")[0].value;
	if (serverName == undefined || serverName.length < 1 || serverName.length > 20)
	{
		alert("The server name must be between 1 and 20 characters");
		return;
	}
	socket.emit('createServer', {serverN: serverName});
}

socket.on('startGameResponse', function(data)
{
	if (data.success == true)
	{
		alert("Game is starting");
	}
	else
	{
		alert("Only the host can start the game");
	}
});

function joinServer(gameButton)
{
	console.log(gameButton);
	var game = gameButton.parentNode;
	socket.emit('joinGame', {serverName: game.children[0].innerHTML});
}

function showJoinableGames()
{
	socket.emit('getJoinableGames', {});
}

socket.on('getJoinableGamesResponse', function(data)
{
	var currentServers = $("#gameServer");
	for (var i = 0; i < currentServers.length; i++) { currentServers[i].remove(); }
	
	var games = data.games;
	//console.log(JSON.stringify(games));
	for (var i = 0; i < games.length; i++)
	{
		var clon = $("#serverExample")[0].cloneNode(true);
		clon.id = "gameServer";
		clon.children[0].children[0].innerHTML = games[i].name;
		clon.children[0].children[1].innerHTML = games[i].playerCount + "/10 players";
		clon.children[0].children[2].id = games[i].id;
		clon.style.display = "inline-block";
		$("#serverCardHolder")[0].insertBefore(clon, $("#serverExample")[0]);
	}
});

function startGame()
{
	socket.emit('startGame', {});
}

showJoinableGames();
setInterval(function()
{
	showJoinableGames();
}, 5000);
