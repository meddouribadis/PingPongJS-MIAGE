// --- INIT DEPENDENCIES
let express = require("express"),
  app = express(),
  path = require("path");

// --
let axios = require("axios");
let http = require("http").Server(app);
let async = require("async");
let io = require("socket.io")(http);
let cors = require("cors");
let favicon = require('serve-favicon');
require("dotenv").config();
// --

let numberOfPlayer = 0;
let numberOfPlayerReady = 0;
let players = {};
let ball = {};
let playerIndex = [];
let requiredPlayers = 4;

// Fichiers statiques
app.use(express.static(__dirname));
app.use(favicon(path.join(__dirname, 'img', 'favicon.png')))

// Autoriser des requetes de plusieurs domaines
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");

  // authorized headers for preflight requests
  // https://developer.mozilla.org/en-US/docs/Glossary/preflight_request
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();

  app.options("*", (req, res) => {
    // allowed XHR methods
    res.header(
      "Access-Control-Allow-Methods",
      "GET, PATCH, PUT, POST, DELETE, OPTIONS"
    );
    res.send();
  });
});

// ------------------------
// ROUTE
// ------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/fourPlayers", (req, res) => {
  res.sendFile(path.join(__dirname, "fourPlayers.html"));
});
// ------------------------
//
// ------------------------

// Quand un client se connecte, on le note dans la console
io.sockets.on("connection", function (socket) {
  console.log("Yes, on a un joueur !");
  io.emit("cool", "Un joueur est apparu !");
  numberOfPlayer++;
  playerIndex[numberOfPlayer] = socket.id;

  console.log("Index " + playerIndex);

  players[socket.id] = {
    sprite: null,
    color: "#FFFFFF",
    posX: 30,
    posY: 200,
    originalPosition: "left",
    score: 0,
    ai: false,
    ready: false,
    imagePath: "./img/playerOne.png",
    playerId: socket.id,
    index: 1,
    team: 1,
  };

  if (numberOfPlayer == 2 && requiredPlayers == 2) {
    players[socket.id].posX = 650;
    players[socket.id].posY = 200;
    players[socket.id].originalPosition = "right";
    players[socket.id].imagePath = "./img/playerTwo.png";
  }

  if (numberOfPlayer == 2 && requiredPlayers == 4) {
    players[socket.id].posX = 30 + 150;
    players[socket.id].posY = 200;
    players[socket.id].originalPosition = "left";
    players[socket.id].imagePath = "./img/playerOne.png";
    players[socket.id].index = 2;
  } else if (numberOfPlayer == 3 && requiredPlayers == 4) {
    players[socket.id].posX = 650 - 150;
    players[socket.id].posY = 200;
    players[socket.id].originalPosition = "right";
    players[socket.id].imagePath = "./img/playerTwo.png";
    players[socket.id].index = 3;
    players[socket.id].team = 2;
  } else if (numberOfPlayer == 4 && requiredPlayers == 4) {
    players[socket.id].posX = 650;
    players[socket.id].posY = 200;
    players[socket.id].originalPosition = "right";
    players[socket.id].imagePath = "./img/playerTwo.png";
    players[socket.id].index = 4;
    players[socket.id].team = 2;
  }

  ball = {
    posX: 40,
    posY: 50,
    directionX: 1,
    directionY: 1,
    speed: 0.8,
    inGame: false,
    ballOnPurpose: 1,

    move: function () {
      if (this.inGame && this.ballOnPurpose == 0) {
        this.posX += this.directionX * this.speed;
        this.posY += this.directionY * this.speed;
      } else if (this.ballOnPurpose == 1) {
        this.posX = players[playerIndex[1]].posX + 15;
        this.posY = players[playerIndex[1]].posY + 20;
      } else if (this.ballOnPurpose == 2) {
        this.posX = players[playerIndex[2]].posX - 15;
        this.posY = players[playerIndex[2]].posY + 20;
      }
    },

    bounce: function () {
      if (this.posX > 700 || this.posX < 0) {
        this.directionX = -this.directionX;
      }
      if (this.posY > 400 || this.posY < 0) {
        this.directionY = -this.directionY;
      }
    },

    collide: function (anotherItem) {
      if (
        !(
          this.sprite.posX >=
            anotherItem.sprite.posX + anotherItem.sprite.width ||
          this.sprite.posX <= anotherItem.sprite.posX - this.sprite.width ||
          this.sprite.posY >=
            anotherItem.sprite.posY + anotherItem.sprite.height ||
          this.sprite.posY <= anotherItem.sprite.posY - this.sprite.height
        )
      ) {
        // Collision
        return true;
      }
      return false;
    },

    lost: function (player) {
      var returnValue = false;
      if (
        player.originalPosition == "left" &&
        this.sprite.posX < player.sprite.posX - this.sprite.width
      ) {
        returnValue = true;
      } else if (
        player.originalPosition == "right" &&
        this.sprite.posX > player.sprite.posX + player.sprite.width
      ) {
        returnValue = true;
      }
      return returnValue;
    },

    speedUp: function () {
      this.speed = this.speed + 0.1;
    },
  };

  if (numberOfPlayer == requiredPlayers) {
    console.log("Mode " + requiredPlayers + " Joueurs");
    console.log(players);
    io.emit("cool", "2 joueurs detectés !");
    io.emit("game", "");
    io.emit("updatePlayers", Object.values(players));
  }

  socket.on("disconnect", () => {
    ball.speed = 0.8;
    numberOfPlayer--;
    numberOfPlayerReady = 0;
    delete players[socket.id];
    io.emit("reset", "reset");
    if (numberOfPlayer > 0) {
      var idTemp = Object.keys(players)[0];
      players[idTemp].posX = 30;
      players[idTemp].posY = 200;
      players[idTemp].originalPosition = "right";
      players[idTemp].imagePath = "./img/playerOne.png";
    }
    if (numberOfPlayer < requiredPlayers && numberOfPlayer > 0) {
      playerIndex = [];
      io.emit("refresh", "refresh");
    }
  });

  socket.on("movements", function (message) {
    io.emit("cool", message.posY);
    players[socket.id].posY = message.posY;

    if (requiredPlayers == 2) {
      io.emit("updateMove", {
        clientId: socket.id,
        player: players[socket.id],
      });
    } else if (requiredPlayers == 4) {
      console.log(players);
      io.emit("updateMove", Object.values(players));
    }
  });

  socket.on("collideBall", function (newDirections) {
    changeBallPath(
      newDirections.originalPosition,
      newDirections.playerID,
      ball
    );
    ball.speedUp();
  });

  socket.on("playerReady", function (message) {
    players[socket.id].ready = true;
    console.log("Player " + socket.id + " is ready !");
    numberOfPlayerReady++;
    if (numberOfPlayerReady == requiredPlayers) {
      ball.speed = 0.8;
      io.emit("allPlayersReady", "");
    }
  });

  socket.on("lostBall", function (data) {
    console.log("Balle perdue pour le player : " + socket.id);
    resetBallAfterLoose(socket.id);
  });

  socket.on("ballOnPurpose", function (data) {
    if (socket.id == playerIndex[ball.ballOnPurpose]) {
      ball.ballOnPurpose = 0;
    }
  });

  socket.on("twoPlayers", function (data) {
    console.log("Switching to default 2 players mode");
    requiredPlayers = 2;
  });

  socket.on("fourPlayers", function (data) {
    console.log("Switching to 4 players mode");
    requiredPlayers = 4;
  });

  function moveBall() {
    if (
      numberOfPlayer == requiredPlayers &&
      numberOfPlayerReady == requiredPlayers
    ) {
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
  }

  function ballOnPlayer(player, ball) {
    var returnValue = "CENTER";
    var playerPositions = 70 / 5;
    if (ball.posY > player.posY && ball.posY < player.posY + playerPositions) {
      returnValue = "TOP";
    } else if (
      ball.posY >= player.posY + playerPositions &&
      ball.posY < player.posY + playerPositions * 2
    ) {
      returnValue = "MIDDLETOP";
    } else if (
      ball.posY >= player.posY + playerPositions * 2 &&
      ball.posY < player.posY + 70 - playerPositions
    ) {
      returnValue = "MIDDLEBOTTOM";
    } else if (
      ball.posY >= player.posY + 70 - playerPositions &&
      ball.posY < player.posY + 70
    ) {
      returnValue = "BOTTOM";
    }
    return returnValue;
  }

  function resetBallAfterLoose(idOfLooser) {
    ball.speed = 0.8;

    if (players[idOfLooser].originalPosition == "left") {
      ball.posX = 40;
      ball.posY = 200;
      ball.directionY = 1;
      ball.directionX = 1;
      ball.ballOnPurpose = 1;
    } else if (players[idOfLooser].originalPosition == "right") {
      ball.posX = 620;
      ball.posY = 200;
      ball.directionX = -1;
      ball.directionY = 1;
      ball.ballOnPurpose = 2;
    }

    updateAndSendScore(idOfLooser);
    io.emit("updateBall", ball);
    io.emit("updateScore", Object.values(players));
  }

  function updateAndSendScore(idOfLooser) {
    for (var key in players) {
      if (players.hasOwnProperty(key) && key != idOfLooser) {
        players[key].score += 1;
        console.log("Player Score : " + players[key].score);
      }
    }
  }

  function checkSockets() {
    let compteur = 0;
    for (var key in players) {
      if (players.hasOwnProperty(key)) {
        compteur++;
      }
    }

    if (compteur !== numberOfPlayer) {
      numberOfPlayer = compteur;
    }
  }

  setInterval(() => {
    moveBall();
  }, 40);

  setInterval(() => {
    checkSockets();
  }, 500);
});

// ------------------------
// START SERVER
// ------------------------
http.listen(process.env.PORT, function () {
  console.info("HTTP server started on port " + process.env.PORT);
});
