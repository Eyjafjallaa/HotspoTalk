const { json } = require("express");
const { Socket } = require("socket.io");


module.exports.init=(io)=>{
    console.log('Init socket.io');

    io.on('connection',(socket)=>{
        console.log('connected');
        io.emit('test', JSON.stringify({msg:'Hello'}))
        io.emit('test', JSON.stringify({msg:'Hello'}))
        io.emit('test', JSON.stringify({msg:'Hello'}))
        socket.on('disconnect',()=>{
            console.log('user disconnected');
        });

        socket.on('test', (msg)=>{
            console.log(msg);
            io.emit('test', msg);
        })
        socket.on('testjoin',(data)=>{
            console.log(data);
        })
    })
}

/*

    1.방들어오기
    2.채팅하기

*/