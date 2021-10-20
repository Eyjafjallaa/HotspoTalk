


module.exports.init=(io)=>{
    console.log('Init socket.io');

    io.on('connection',(socket)=>{
        console.log('connected');
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

        socket.on('onload',(data)=>{
            socket.join(data.room);
        })
        socket.on('unload',(data)=>{
            socket.leave(data.room);
        })

        socket.on('onshot',(data)=>{
            console.log(data)
            io.to(data.room).emit('testserver',{
                nickname:data.nickname,
                msg:data.msg
            });
        })

    })
}

/*

    1.방들어오기
    2.채팅하기

*/