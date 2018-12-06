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
		window.localStorage.setItem('username', nam);
		$("#chooseNameDiv")[0].style.display = "none";
		$("#serverList")[0].style.display = "block";
	}
}