
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
        originalPosition : "right",
        score : 0,
        ai : false,
        imagePath : "./img/playerOne.png",
        playerId: socket.id
    };

    if(numberOfPlayer == 2){
        players[socket.id].posX = 650;
        players[socket.id].posY = 200;
        players[socket.id].originalPosition = "left";
        players[socket.id].imagePath = "./img/playerTwo.png";
    }

    ball = {
        sprite : null,
        color : "#FFFFFF",
        directionX: 1,
        directionY: 1,
        speed: 1,
        inGame : false,
        imagePath : "./img/ball.png",

        move : function() {
            if ( this.inGame ) {
                this.sprite.posX += this.directionX * this.speed;
                this.sprite.posY += this.directionY * this.speed;
            }
        },

        bounce : function(soundToPlay) {
            if ( this.sprite.posX > conf.GROUNDLAYERWIDTH || this.sprite.posX < 0 ) {
                this.directionX = -this.directionX;
                soundToPlay.play();
            }
            if ( this.sprite.posY > conf.GROUNDLAYERHEIGHT || this.sprite.posY < 0  ) {
                this.directionY = -this.directionY;
                var soundPromise = soundToPlay.play();
                if (soundPromise !== undefined) {
                    soundPromise.then(_ => {
                        // Autoplay started!
                    }).catch(error => {
                        // Autoplay was prevented.
                        // Show a "Play" button so that user can start playback.
                    });
                }
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
        delete players[socket.id];
    });

    socket.on('movements', function (message) {
        //console.log(message);
        //console.log(socket.id);
        io.emit('cool', message.posY);
        players[socket.id].posY = message.posY;
        io.emit('updateMove', {
            clientId : socket.id,
            player : players[socket.id]
        });
    });

    function update() {
        io.volatile.emit('players list', Object.values(players));
    }

    setInterval(update, 1000/60);
});


// ------------------------
// START SERVER
// ------------------------
http.listen(3010,function(){
    console.info('HTTP server started on port 3010');
});