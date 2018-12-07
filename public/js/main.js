var socket = io();
var socket_id;
var uN = "";

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
		uN = nam;
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

function joinServer(gameButton)
{
	var game = gameButton.parentNode;
	socket.emit('joinGame', {serverName: game.children[0].innerHTML});
}

socket.on('joinGameResponse', function(data)
{
	if (data.success == true)
	{
		getPlayerList();
		$("#serverList")[0].style.display = "none";
		$("#serverLobby")[0].style.display = "block";
	}
	else
	{
		alert(data.reason || "Error joining game");
	}
});

function showJoinableGames()
{
	socket.emit('getJoinableGames', {});
}

function getPlayerList()
{
	socket.emit('getPlayerList', {});
}

socket.on('getPlayerListResponse', function(data)
{
	/*var currentServers = $("#playerLabel");
	for (var i = 0; i < currentServers.length; i++) { currentServers[i].remove(); }*/
	
	var games = data.players;
	var playerTags = $(".playerTag");
	$("#serverPlayerCount")[0].innerHTML = games.length + "/10 Players";
	if (games.length == 1) { $("#serverPlayerCount")[0].innerHTML = games.length + "/10 Players"; }
	for (var i = 0; i < games.length; i++)
	{
		playerTags[i].style.display = "block";
		playerTags[i].children[0].innerHTML = games[i].name;
		playerTags[i].children[1].innerHTML = games[i].tag;
		if (games[i].tag != "Host")
		{
			playerTags[i].children[1].style["background-color"] = "#3D8";
		}
		if (games[i].name == uN)
		{
			playerTags[i].style["background-color"] = "#FFA";
		}
		else{ playerTags[i].style["background-color"] = "#FFF"; }
	}
	for (var i = games.length; i < 10 && i < playerTags.length; i++)
	{
		playerTags[i].style.display = "none";
	}
});

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
		if (games[i].playerCount == 1)
		{
			clon.children[0].children[1].innerHTML = games[i].playerCount + "/10 player";
		}
		clon.children[0].children[2].id = games[i].id;
		clon.style.display = "inline-block";
		$("#serverCardHolder")[0].insertBefore(clon, $("#serverExample")[0]);
	}
});

socket.on('startGameResponse', function(data)
{
	if (data.success == true)
	{
		$("#serverList")[0].style.display = "none";
		$("#serverLobby")[0].style.display = "none";
		$("#wizardBattleGame")[0].style.display = "block";
	}
	else
	{
		alert("Only the host can start the game");
	}
});

socket.on('gameStarting', function(data)
{
	$("#serverList")[0].style.display = "none";
	$("#serverLobby")[0].style.display = "none";
	$("#wizardBattleGame")[0].style.display = "block";
});

socket.on('youDied', function(data)
{
	alert("You died!");
});

function startGame()
{
	socket.emit('startGame', {});
}

document.onkeydown = function(event) {
	if (event.keyCode === 68) { 
		//d
		socket.emit('keyPress', {inputId:'right',state:true,socketid: socket_id});
	} else if (event.keyCode === 83) {
		//s
		socket.emit('keyPress', {inputId:'down',state:true,socketid: socket_id});
	} else if (event.keyCode === 65) {
		//a
		socket.emit('keyPress', {inputId:'left',state:true,socketid: socket_id});
	} else if (event.keyCode === 87) {
		//w
		socket.emit('keyPress', {inputId:'up',state:true,socketid: socket_id});
	} else if (event.keyCode === 13) {
		//enter
		socket.emit('keyPress', {inputId:'fire',state:true,socketid: socket_id});
	}
}
//when key is released send signal to server
document.onkeyup = function(event) {
	if (event.keyCode === 68) { 
		//d
		socket.emit('keyPress', {inputId:'right',state:false,socketid: socket_id});
	} else if (event.keyCode === 83) {
		//s
		socket.emit('keyPress', {inputId:'down',state:false,socketid: socket_id});
	} else if (event.keyCode === 65) {
		//a
		socket.emit('keyPress', {inputId:'left',state:false,socketid: socket_id});
	} else if (event.keyCode === 87) {
		//w
		socket.emit('keyPress', {inputId:'up',state:false,socketid: socket_id});
	} else if (event.keyCode === 13) {
		//enter
		socket.emit('keyPress', {inputId:'fire',state:false,socketid: socket_id});
	}
}

socket.on('positionUpdate', function(data)
{
	var positions = data.objectPositions;
	var gamePlayers = $(".gamePlayer");
	var projectiles = $(".projectile");
	var playerCount = 0;
	var projectileCount = 0;
	for (var i = 0; i < positions.length; i++)
	{
		if (positions[i].type == "player")
		{
			var plr = positions[i];
			gamePlayers[playerCount].style.display = "block";
			gamePlayers[playerCount].children[1].innerHTML = plr.name;
			gamePlayers[playerCount].style.left = plr.x + "%";
			gamePlayers[playerCount].style.top = plr.y + "%";
			playerCount++;
		}
		else if (positions[i].type == "projectile")
		{
			var projectile = projectiles[projectileCount];
			projectile.style.display = "block";
			projectile.style.left = positions[i].x + "%";
			projectile.style.top = positions[i].y + "%";
			projectile.style.transform = "rotate(" + Math.floor(positions[i].rotation) + "deg)";
			projectileCount++;
		}
	}
	for (var i = playerCount; i < 10; i++)
	{
		gamePlayers[i].style.display = "none";
	}
	for (var i = projectileCount; i < projectiles.length; i++)
	{
		projectiles[i].style.display = "none";
	}
});

showJoinableGames();
setInterval(function()
{
	showJoinableGames();
	getPlayerList();
}, 5000);
