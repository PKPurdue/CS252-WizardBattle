const express = require('express'); 
const app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static('public'));

var allClients = [];

io.on('connection', (socket) => {
  console.log('a user connected');
  allClients.push(socket);

  socket.on('disconnect', function(){
	var i = allClients.indexOf(socket);
    allClients.splice(i, 1);
    console.log('user disconnected');
  });

  socket.on('msg', function(data){
  	//send message to all sockets
  	io.sockets.emit('newmsg', data);
  });
});

var userList = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.post('/followUser', (req, res) => {
	/*console.log(req);
	var myUID = req.body.uid;
	var emailToFollow = req.body.otherEmail;
	db.ref('users/profile/' + myUID + '/friends').once('value').then((snapshot) => {
		var numFollowing = snapshot.val().friendcount;
		var j = {friendcount: numFollowing + 1};
		j[numFollowing] = emailToFollow;
		db.ref('users/profile/' + myUID + '/friends').update(j);
	});*/
});

app.get('/getgarageposts', (req, res) => {
	/*var postData = {"allPosts": false}
	postData.messages = [];
	if (Math.floor(Math.random() * 5) == 1) { postData.allPosts = true; }
	var possiblePosters = ["thanos", "iron man", "captain america", "thor"];
	for (var i = 0; i < 5; i++)
	{
		var userPost = {};
		userPost.userId = 1;
		userPost.username = possiblePosters[Math.floor(Math.random() * possiblePosters.length)];
		userPost.userPicture = "N/A";
		userPost.postPicture = "N/A";
		userPost.message = "This is a post: " + Math.floor(Math.random() * 100);
		userPost.timePosted = new Date().getTime() - Math.floor(Math.random() * 1000);
		postData.messages.push(userPost);
	}
	res.status(200).send(JSON.stringify(postData));*/
});

server.listen(8080, () => {
    console.log('listening on 8080');
});