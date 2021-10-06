const { Socket } = require("socket.io");


module.exports.init=(io)=>{
    console.log('Init socket.io');

    io.on('connection',(socket)=>{
        console.log('connected');
        socket.on('disconnect',()=>{
            console.log('user disconnected');
        })
    })
}