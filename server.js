
// --- INIT DEPENDENCIES
let express = require('express'),
    app = express(),
    path = require('path');

// --
let axios = require('axios');
let http = require('http').Server(app);
let async = require('async');
let io = require('socket.io')(http);
let cors= require('cors');
// --

let numberOfPlayer = 0;
let numberOfPlayerReady = 0;
let players = {};
let ball = {};

// Fichiers statiques
app.use(express.static(__dirname));

// Autoriser des requetes de plusieurs domaines
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');

    // authorized headers for preflight requests
    // https://developer.mozilla.org/en-US/docs/Glossary/preflight_request
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();

    app.options('*', (req, res) => {
        // allowed XHR methods
        res.header('Access-Control-Allow-Methods', 'GET, PATCH, PUT, POST, DELETE, OPTIONS');
        res.send();
    });
});

// ------------------------
// ROUTE
// ------------------------
app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'index.html'))
});

// ------------------------
//
// ------------------------

// Quand un client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {

    console.log("Yes, on a un joueur !");
    io.emit('cool', "Un joueur est apparu !");
    numberOfPlayer++;

    players[socket.id] = {
        sprite : null,
        color : "#FFFFFF",
        posX: 30,
        posY: 200,
        originalPosition : "left",
        score : 0,
        ai : false,
        ready : false,
        imagePath : "./img/playerOne.png",
        playerId: socket.id
    };

    if(numberOfPlayer == 2){
        players[socket.id].posX = 650;
        players[socket.id].posY = 200;
        players[socket.id].originalPosition = "right";
        players[socket.id].imagePath = "./img/playerTwo.png";
    }

    ball = {
        posX : 40,
        posY : 50,
        directionX: 1,
        directionY: 1,
        speed: 0.8,
        inGame : false,

        move : function() {
            if ( this.inGame ) {
                this.posX += this.directionX * this.speed;
                this.posY += this.directionY * this.speed;
            }
        },

        bounce : function() {
            if (this.posX > 700 || this.posX < 0) {
                this.directionX = -this.directionX;
            }
            if (this.posY > 400 || this.posY < 0) {
                this.directionY = -this.directionY;
            }
        },

        collide : function(anotherItem) {
            if ( !( this.sprite.posX >= anotherItem.sprite.posX + anotherItem.sprite.width || this.sprite.posX <= anotherItem.sprite.posX - this.sprite.width
                || this.sprite.posY >= anotherItem.sprite.posY + anotherItem.sprite.height || this.sprite.posY <= anotherItem.sprite.posY - this.sprite.height ) ) {
                // Collision
                return true;
            }
            return false;
        },

        lost : function(player) {
            var returnValue = false;
            if ( player.originalPosition == "left" && this.sprite.posX < player.sprite.posX - this.sprite.width ) {
                returnValue = true;
            } else if ( player.originalPosition == "right" && this.sprite.posX > player.sprite.posX + player.sprite.width ) {
                returnValue = true;
            }
            return returnValue;
        },

        speedUp: function() {
            this.speed = this.speed + .1;
        },

    };

    if(numberOfPlayer == 2){
        io.emit('cool', "2 joueurs detectés !");
        io.emit('game', "");
        io.emit('updatePlayers', Object.values(players));
    }

    socket.on('disconnect', () => {
        numberOfPlayer--;
        numberOfPlayerReady = 0;
        delete players[socket.id];
        io.emit('reset', "reset");
        if(numberOfPlayer > 0){
            var idTemp = Object.keys(players)[0];
            players[idTemp].posX = 30;
            players[idTemp].posY = 200;
            players[idTemp].originalPosition = "right";
            players[idTemp].imagePath = "./img/playerOne.png";
        }
    });

    socket.on('movements', function (message) {
        io.emit('cool', message.posY);
        players[socket.id].posY = message.posY;
        io.emit('updateMove', {
            clientId : socket.id,
            player : players[socket.id]
        });
    });

    socket.on('collideBall', function (newDirections) {
        changeBallPath(newDirections.originalPosition, newDirections.playerID, ball);
        ball.speedUp();
    });

    socket.on('playerReady', function (message) {
        players[socket.id].ready = true;
        console.log("Player " + socket.id + " is ready !");
        numberOfPlayerReady++;
        if(numberOfPlayerReady == 2){
            io.emit("allPlayersReady", "");
        }
    });

    socket.on('lostBall', function (data) {
        console.log("Balle perdue pour le player : " + socket.id);
        resetBallAfterLoose(socket.id);
    });

    function moveBall(){
        if(numberOfPlayer == 2 && numberOfPlayerReady == 2){
            ball.inGame = true;
            ball.bounce();
            ball.move();
            io.emit("updateBall", ball);
        }
    }

    function changeBallPath(position, playerID, ball) {
        if (position == "left") {
            switch (ballOnPlayer(players[playerID], ball)) {
                case "TOP":
                    ball.directionX = 1;
                    ball.directionY = -3;
                    break;
                case "MIDDLETOP":
                    ball.directionX = 1;
                    ball.directionY = -1;
                    break;
                case "CENTER":
                    ball.directionX = 2;
                    ball.directionY = 0;
                    break;
                case "MIDDLEBOTTOM":
                    ball.directionX = 1;
                    ball.directionY = 1;
                    break;
                case "BOTTOM":
                    ball.directionX = 1;
                    ball.directionY = 3;
                    break;
            }
        } else {
            switch (ballOnPlayer(players[playerID], ball)) {
                case "TOP":
                    ball.directionX = -1;
                    ball.directionY = -3;
                    break;
                case "MIDDLETOP":
                    ball.directionX = -1;
                    ball.directionY = -1;
                    break;
                case "CENTER":
                    ball.directionX = -2;
                    ball.directionY = 0;
                    break;
                case "MIDDLEBOTTOM":
                    ball.directionX = -1;
                    ball.directionY = 1;
                    break;
                case "BOTTOM":
                    ball.directionX = -1;
                    ball.directionY = 3;
                    break;
            }
        }
    };

    function ballOnPlayer(player, ball) {

        var returnValue = "CENTER";
        var playerPositions = 70/5;
        if ( ball.posY > player.posY && ball.posY < player.posY + playerPositions ) {
            returnValue = "TOP";
        } else if ( ball.posY >= player.posY + playerPositions && ball.posY < player.posY + playerPositions*2 ) {
            returnValue = "MIDDLETOP";
        } else if ( ball.posY >= player.posY + playerPositions*2 && ball.posY < player.posY + 70 - playerPositions ) {
            returnValue = "MIDDLEBOTTOM";
        } else if ( ball.posY >= player.posY + 70 - playerPositions && ball.posY < player.posY + 70 ) {
            returnValue = "BOTTOM";
        }
        return returnValue;
    };

    function resetBallAfterLoose(idOfLooser){

        ball.speed = 0.8;

        if(players[idOfLooser].originalPosition == "left"){
            ball.posX = 40;
            ball.posY = 200;
            ball.directionY = 1;
            ball.directionX = 1;
        }
        else if(players[idOfLooser].originalPosition == "right"){
            ball.posX = 620;
            ball.posY = 200;
            ball.directionX = -1;
            ball.directionY = 1;
        }

        updateAndSendScore(idOfLooser);
        io.emit("updateBall", ball);
        io.emit("updateScore", Object.values(players));
    };

    function updateAndSendScore(idOfLooser){
        for (var key in players) {
            if (players.hasOwnProperty(key) && key != idOfLooser) {
                players[key].score =+ 1;
            }
        }

    };

    setInterval(() => {
        moveBall();
    }, 40);
});


// ------------------------
// START SERVER
// ------------------------
http.listen(3010,function(){
    console.info('HTTP server started on port 3010');
});