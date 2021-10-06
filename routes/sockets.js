module.exports.init=(io)=>{
    io.on('connection',(socket)=>{
        io.socket.emit('test',{msg:"Hello! World"});
        socket.on('test',(msg)=>{
            io.socket.emit('test',msg);
        })
    })
}