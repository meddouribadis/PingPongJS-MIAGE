
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
        posX : 0,
        posY : 0,
        playerId : socket.id,
    };

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
        }

    };

    if(numberOfPlayer == 2){
        io.emit('cool', "2 joueurs detectés !");
        io.emit('game', "");
    }

    socket.on('disconnect', () => {
        io.emit('cool', "Deconnection");
        numberOfPlayer--;
        delete players[socket.id];
        console.log('Socket disconnected: ');
    });

    socket.on('movements', function (message) {
        console.log(message);
        console.log(socket.id);
        io.emit('cool', message.posY);
        players[socket.id].posY = message.posY;
        io.emit('updateMove', {
            clientId : socket.id,
            player : players[socket.id]
        });
    });




});


// ------------------------
// START SERVER
// ------------------------
http.listen(3010,function(){
    console.info('HTTP server started on port 3010');
});