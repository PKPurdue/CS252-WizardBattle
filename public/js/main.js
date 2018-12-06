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

function showServers()
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

