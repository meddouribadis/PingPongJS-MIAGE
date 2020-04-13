
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

//app.use('/js/',express.static(config.root + '/public'));
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

    let step = 1;
    let save = false;
    let msgTemp = "";

    io.emit('system', "Voulez vous sauvegardez vos informations ? ");

    socket.emit('message', 'Vous êtes bien connecté !');
    socket.broadcast.emit('message', 'Un autre client vient de se connecter !');

    socket.on('petit_nouveau', function(pseudo) {
        socket.pseudo = pseudo;
    });

    socket.on('message', function (message) {
        io.emit('cool', message);
        msgTemp = message;

        if(step == 1 && msgTemp == "oui"){
            step += 1;
            msgTemp = "";
            save = true;
            console.log("Var save = " + save);
            setTimeout(function(){io.emit('system', "Quel est votre nom ?");}, 400);
        }

        if(step == 1 && msgTemp == "non"){
            step += 1;
            msgTemp = "";
            save = false;
            console.log("Var save = " + save);
            setTimeout(function(){io.emit('system', "Quel est votre nom ?");}, 400);
        }

        if(step == 2 && msgTemp !== ""){
            socket.pseudo = msgTemp;
            msgTemp = "";
            setTimeout(function(){io.emit('system', "Merci "+ socket.pseudo +" ! Quel est votre SSN ?");}, 400);
            step += 1;
        }

        if(msgTemp !== "" && step == 3){

            console.log("Un message a été reçu, nous allons le traiter :")
            postSSN(message, socket.pseudo, save).then(data => {
                console.log("SSN valide.");
                setTimeout(function(){io.emit('system', "Votre département : " + data.departement);}, 400);

                setTimeout(function(){io.emit('system', "Votre Commune : " + data.commune)}, 500);

                console.log(data);
                console.log(save);
                if(save == false){
                    deleteSSN(data.idPers);
                }
            })
                .catch(err => {
                    console.log("SSN invalide.")
                    console.log(err)
                    setTimeout(function(){io.emit('system', "Merci d'entrer un numéro de SSN valide ! ");}, 700);

                })
        }
    });

});


// ------------------------
// START SERVER
// ------------------------
http.listen(3010,function(){
    console.info('HTTP server started on port 3010');
});