game.control = {

    controlSystem : null,
    mousePointer : null,

    onKeyDown : function(event) {

        game.control.controlSystem = "KEYBOARD";

        if ( event.keyCode == game.keycode.KEYDOWN ) {
            game.playerOne.goDown = true;
            if(!game.playerTwo.ai){
                game.socket.emit('movements', {
                    posY : game.playerOne.sprite.posY,
                });
            }
        } else if ( event.keyCode == game.keycode.KEYUP ) {
            game.playerOne.goUp = true;
            if(!game.playerTwo.ai){
                game.socket.emit('movements', {
                    posY : game.playerOne.sprite.posY,
                });
            }
        }

        if ( event.keyCode == game.keycode.SPACEBAR ) {

            if(!game.partyStarted && game.gameOn && game.multiplayer == false){
                var sound = new Audio("./music/pkmnbattle.mp3");
                var soundPromise = sound.play();
                if (soundPromise !== undefined) {
                    soundPromise.then(_ => {
                    }).catch(error => {
                    });
                }
                game.partyStarted = true;
            }
            if ( event.keyCode == game.keycode.SPACEBAR && !game.ball.inGame && game.gameOn ) {
                if(!game.multiplayer){
                    game.ball.inGame = true;
                    game.ball.sprite.posX = game.playerOne.sprite.posX + game.playerOne.sprite.width;
                    game.ball.sprite.posY = game.playerOne.sprite.posY;
                    game.ball.directionX = 1;
                    game.ball.directionY = 1;
                }
                else {
                    console.log("Multi let's go !")
                    game.gameReady = true;
                    game.multiplayerInitalised = false;
                    game.socket.emit('playerReady', "I'm ready !");
                }
            }
        }
    },

    onKeyUp : function(event) {
        if ( event.keyCode == game.keycode.KEYDOWN ) {
            game.playerOne.goDown = false;
            if(!game.playerTwo.ai){
                game.socket.emit('movements', {
                    posY : game.playerOne.sprite.posY,
                });
            }
            console.log(game.socket.id);
        } else if ( event.keyCode == game.keycode.KEYUP ) {
            game.playerOne.goUp = false;
            if(!game.playerTwo.ai){
                game.socket.emit('movements', {
                    posY : game.playerOne.sprite.posY,
                });
            }
        }
    },

    onMouseMove : function(event) {

        game.control.controlSystem = "MOUSE";

        if ( event ) {
            game.control.mousePointer = event.clientY;
        }

        if ( game.control.mousePointer > game.playerOne.posY ) {
            game.playerOne.goDown = true;
            game.playerOne.goUp = false;
        } else if ( game.control.mousePointer < game.playerOne.posY ) {
            game.playerOne.goDown = false;
            game.playerOne.goUp = true;
        } else {
            game.playerOne.goDown = false;
            game.playerOne.goUp = false;
        }
    },

    onStartGameClickButton : function() {
        console.log("Clicked")
        if ( !game.gameOn ) {
            game.reinitGame();
            game.gameOn = true;
        }
    }


};