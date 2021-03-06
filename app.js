const express   = require("express");
const http      = require("http");
const port      = process.env.PORT || 3000;
const socketIO  = require("socket.io");

const {generateMessage} = require("./utils/message");
const validation = require("./utils/validation");
const {Users} = require("./utils/users");

var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var users = new Users();

app.use(express.static(__dirname + "/public"));

io.on("connection", (socket) =>{
    console.log("New User connected");

    socket.on("join",(params, callback) =>{
        if(!validation.isValidString(params.name) || !validation.isValidString(params.room)){
            return callback("Name and Room Name are Required");
        }


        socket.join(params.room);
        users.removeUser(socket.id);
        if(!users.addUser(socket.id, params.name.trim().replace(/ +(?= )/g,''),params.room)){
            return callback("Username not available");
        }

        io.to(params.room).emit("updateUserList", users.getUserList(params.room));
        socket.emit("newMessage", generateMessage("Admin", "Welcome to the chat app"));
        //socket.broadcast.emit("newMessage", generateMessage("Admin", params.name + " has Join"));
        socket.broadcast.to(params.room).emit("newMessage", generateMessage("Admin", params.name + " has Join"));

        callback();
    });


    socket.on("createdMessage", (message, callback)=>{
        var user = users.getUser(socket.id);

        if(user && validation.isValidString(message.text)){
            io.to(user.room).emit("newMessage",generateMessage(user.name , message.text));
        }

        callback("from the server");
        // socket.broadcast.emit("newMessage", {
        //     rom: message.from,
        //     text: message.text,
        //     createdAt: Date.now()
        // });
    });


    socket.on("disconnect", ()=>{
        var user = users.removeUser(socket.id);

        if(user){
            io.to(user.room).emit("updateUserList", users.getUserList(user.room));
            io.to(user.room).emit("newMessage", generateMessage("Admin", user.name + " has left"));
        }
    });

});

server.listen(port, ()=>{
    console.log("Listening on port " + port);
});


function checkValidName(params){
    var nameArray = users.get
    if(users.getUserList(params.room).includes(params.name.trim())){
        return false;
    }
    if(users.getUserList(params.room).includes(params.name.trim().toLowerCase())){
        return false;
    }

    return true;
}

