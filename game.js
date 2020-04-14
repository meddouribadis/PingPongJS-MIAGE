var game = {

    devResX : 1366,
    devResY : 738,
    targeResX : null,
    targetResY : null,
    ratioResX : null,
    ratioResY : null,
    socket : null,

    ball : {
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

    },

    playerOne : {
        sprite : null,
        color : "#FFFFFF",
        goUp : false,
        goDown : false,
        originalPosition : "left",
        score : 0,
        ai : false,
        imagePath : "./img/playerOne.png",
    },

    playerTwo : {
        sprite : null,
        color : "#FFFFFF",
        goUp : false,
        goDown : false,
        originalPosition : "right",
        score: 0,
        ai : true,
        imagePath : "./img/playerTwo.png",
    },

    groundWidth : 700,
    groundHeight : 400,
    groundColor: "#000000",
    netWidth : 6,
    netColor: "#FFFFFF",

    wallSound : null,
    playerSound : null,
    groundLayer : null,
    scoreLayer : null,
    playersBallLayer : null,
    partyStarted : false,
    divGame : null,
    gameOn : false,
    startGameButton : null,

    init : function() {
        this.divGame = document.getElementById("divGame");
        this.startGameButton = document.getElementById("startGame");
        this.initScreenRes();
        this.resizeDisplayData(conf,this.ratioResX,this.ratioResY);

        this.groundLayer= game.display.createLayer("terrain", conf.GROUNDLAYERWIDTH, conf.GROUNDLAYERHEIGHT, this.divGame, 0, "#000000", 0, 0);
        game.display.drawRectangleInLayer(this.groundLayer, conf.NETWIDTH, conf.GROUNDLAYERHEIGHT, this.netColor, conf.GROUNDLAYERWIDTH/2 - conf.NETWIDTH/2, 0);

        this.scoreLayer = game.display.createLayer("score", conf.GROUNDLAYERWIDTH, conf.GROUNDLAYERHEIGHT, this.divGame, 1, undefined, 0, 0);
        game.display.drawTextInLayer(this.scoreLayer , "SCORE", "10px Arial", "#FF0000", 10, 10);

        this.playersBallLayer = game.display.createLayer("joueursetballe", conf.GROUNDLAYERWIDTH, conf.GROUNDLAYERHEIGHT, this.divGame, 2, undefined, 0, 0);
        game.display.drawTextInLayer(this.playersBallLayer, "JOUEURSETBALLE", "10px Arial", "#FF0000", 100, 100);

        this.displayScore(0,0);

        this.ball.sprite = game.display.createSprite(conf.BALLWIDTH,conf.BALLHEIGHT,conf.BALLPOSX,conf.BALLPOSY,"./img/ball.png");
        this.displayBall();

        this.playerOne.sprite = game.display.createSprite(conf.PLAYERONEWIDTH,conf.PLAYERONEHEIGHT,conf.PLAYERONEPOSX,conf.PLAYERONEPOSY,"./img/playerOne.png");
        this.playerTwo.sprite = game.display.createSprite(conf.PLAYERTWOWIDTH,conf.PLAYERTWOHEIGHT,conf.PLAYERTWOPOSX,conf.PLAYERTWOPOSY,"./img/playerTwo.png");
        this.displayPlayers();

        this.initKeyboard(game.control.onKeyDown, game.control.onKeyUp);
        this.initStartGameButton();

        this.wallSound = new Audio("./sound/pingMur.ogg");
        this.playerSound = new Audio("./sound/pingRaquette.ogg");

        game.ai.setPlayerAndBall(this.playerTwo, this.ball);
        game.speedUpBall();
    },

    initKeyboard : function(onKeyDownFunction, onKeyUpFunction) {
        window.onkeydown = onKeyDownFunction;
        window.onkeyup = onKeyUpFunction;
    },

    initStartGameButton : function() {
        this.startGameButton.onclick = game.control.onStartGameClickButton;
    },

    initScreenRes : function() {
        this.targetResX = window.screen.availWidth;
        this.targetResY = window.screen.availHeight;
        this.ratioResX = this.targetResX/this.devResX;
        this.ratioResY = this.targetResY/this.devResY;
    },

    resizeDisplayData : function(object, ratioX, ratioY) {
        var property;
        for ( property in object ) {
            if ( property.match(/^.*X.*$/i) || property.match(/^.*WIDTH.*$/i) ) {
                object[property] = Math.round(object[property] * ratioX);
            } else {
                object[property] = Math.round(object[property] * ratioY);
            }
        }
    },

    displayScore : function(scorePlayer1, scorePlayer2) {
        game.display.drawTextInLayer(this.scoreLayer, scorePlayer1, conf.SCOREFONTSIZE + "pt DS-DIGIB", "#FFFFFF", conf.SCOREPOSXPLAYER1, conf.SCOREPOSYPLAYER1);
        game.display.drawTextInLayer(this.scoreLayer, scorePlayer2, conf.SCOREFONTSIZE + "pt DS-DIGIB", "#FFFFFF", conf.SCOREPOSXPLAYER2, conf.SCOREPOSYPLAYER2);
    },

    displayBall : function() {
        game.display.drawImageInLayer(this.playersBallLayer, this.ball.sprite.img, this.ball.sprite.posX, this.ball.sprite.posY);
    },

    displayPlayers : function() {
        game.display.drawImageInLayer(this.playersBallLayer, this.playerOne.sprite.img, this.playerOne.sprite.posX, this.playerOne.sprite.posY);
        game.display.drawImageInLayer(this.playersBallLayer, this.playerTwo.sprite.img, this.playerTwo.sprite.posX, this.playerTwo.sprite.posY);
    },

    moveBall : function() {
        this.ball.move();
        this.ball.bounce(this.wallSound);
        this.displayBall();
    },

    clearLayer : function(targetLayer) {
        targetLayer.clear();
    },

    movePlayers : function() {
        if ( game.control.controlSystem == "KEYBOARD" ) {
            // keyboard control
            if ( game.playerOne.goUp ) {

                game.playerOne.sprite.posY-=5;

            } else if ( game.playerOne.goDown ) {
                game.playerOne.sprite.posY+=5;
            }
        } else if ( game.control.controlSystem == "MOUSE" ) {
            // mouse control
            if (game.playerOne.goUp && game.playerOne.posY > game.control.mousePointer)
                game.playerOne.sprite.posY-=5;
            else if (game.playerOne.goDown && game.playerOne.posY < game.control.mousePointer)
                game.playerOne.sprite.posY+=5;
        }
    },

    movePlayerTwo : function(){
        if ( game.playerTwo.goUp ) {
            game.playerTwo.sprite.posY-=5;
        } else if ( game.playerTwo.goDown ) {
            game.playerTwo.sprite.posY+=5;
        }
    },

    updatePlayerTwo: function(player) {
        game.playerTwo.goDown = player.goDown;
        game.playerTwo.goUp = player.goUp;
    },

    initMouse : function(onMouseMoveFunction) {
        window.onmousemove = onMouseMoveFunction;
    },

    collideBallWithPlayersAndAction : function() {
        if ( this.ball.collide(game.playerOne) ) {
            console.log("Collide");
            this.changeBallPath(game.playerOne, game.ball);

            let soundPromise = this.playerSound.play();
            if (soundPromise !== undefined) {
                soundPromise.then(_ => {
                }).catch(error => {
                });
            }
        }
        if ( this.ball.collide(game.playerTwo) ) {
            console.log("Collide 2");
            this.changeBallPath(game.playerTwo, game.ball);
            let soundPromise = this.playerSound.play();
            if (soundPromise !== undefined) {
                soundPromise.then(_ => {
                }).catch(error => {
                });
            }
        }
    },

    lostBall : function() {
        if ( this.ball.lost(this.playerOne) ) {
            this.playerTwo.score++;
            if ( this.playerTwo.score > 9 ) {
                this.gameOn = false;
            } else {
                this.ball.inGame = false;

                if ( this.playerOne.ai ) {
                    setTimeout(game.ai.startBall(), 3000);
                }
            }
        } else if ( this.ball.lost(this.playerTwo) ) {
            this.playerOne.score++;
            if ( this.playerOne.score > 9 ) {
                this.gameOn = false;
            } else {
                this.ball.inGame = false;

                if ( this.playerTwo.ai ) {
                    setTimeout(game.ai.startBall(), 3000);
                }
            }
        }

        this.scoreLayer.clear();
        this.displayScore(this.playerOne.score, this.playerTwo.score);
    },

    ballOnPlayer : function(player, ball) {
        var returnValue = "CENTER";
        var playerPositions = player.sprite.height/5;
        if ( ball.sprite.posY > player.sprite.posY && ball.sprite.posY < player.sprite.posY + playerPositions ) {
            returnValue = "TOP";
        } else if ( ball.sprite.posY >= player.sprite.posY + playerPositions && ball.sprite.posY < player.sprite.posY + playerPositions*2 ) {
            returnValue = "MIDDLETOP";
        } else if ( ball.sprite.posY >= player.sprite.posY + playerPositions*2 && ball.sprite.posY < player.sprite.posY +
            player.sprite.height - playerPositions ) {
            returnValue = "MIDDLEBOTTOM";
        } else if ( ball.sprite.posY >= player.sprite.posY + player.sprite.height - playerPositions && ball.sprite.posY < player.sprite.posY +
            player.sprite.height ) {
            returnValue = "BOTTOM";
        }
        return returnValue;
    },

    changeBallPath : function(player, ball) {
        if (player.originalPosition == "left") {
            switch (game.ballOnPlayer(player, ball)) {
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
            switch (game.ballOnPlayer(player, ball)) {
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
    },

    speedUpBall: function() {
        setInterval(function() {
            game.ball.speedUp();
        }, 5000);
    },

    reinitGame : function() {
        this.ball.inGame = false;
        this.ball.speed = 1;
        this.playerOne.score = 0;
        this.playerTwo.score = 0;
        this.scoreLayer.clear();
        this.displayScore(this.playerOne.score, this.playerTwo.score);
    },

    setSocket : function (sock) {
        this.socket = sock;
    },

    setPlayer(player1, player2){
        this.playerOne.sprite.posX = player1.posX;
        this.playerOne.sprite.posY = player1.posY;
        this.playerOne.originalPosition = player1.originalPosition;
        this.playerOne.imagePath = player1.imagePath;

        this.playerTwo.sprite.posX = player2.posX;
        this.playerTwo.sprite.posY = player2.posY;
        this.playerTwo.originalPosition = player2.originalPosition;
        this.playerTwo.imagePath = player2.imagePath;
    },

    resetGame(){
        this.playerOne = {
            sprite : null,
                color : "#FFFFFF",
                goUp : false,
                goDown : false,
                originalPosition : "left",
                score : 0,
                ai : false,
                imagePath : "./img/playerOne.png",
        };

        this.playerTwo = {
                sprite : null,
                color : "#FFFFFF",
                goUp : false,
                goDown : false,
                originalPosition : "right",
                score: 0,
                ai : true,
                imagePath : "./img/playerTwo.png",
        };

        this.playerOne.sprite = game.display.createSprite(conf.PLAYERONEWIDTH,conf.PLAYERONEHEIGHT,conf.PLAYERONEPOSX,conf.PLAYERONEPOSY,"./img/playerOne.png");
        this.playerTwo.sprite = game.display.createSprite(conf.PLAYERTWOWIDTH,conf.PLAYERTWOHEIGHT,conf.PLAYERTWOPOSX,conf.PLAYERTWOPOSY,"./img/playerTwo.png");
    }

};