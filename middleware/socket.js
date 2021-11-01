
const db = require('../model/db');

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

        

        socket.on('message',async (data)=>{
            
            let sql="INSERT INTO chatting (content, RoomID, MemberID,Timestamp) VALUES(?,?,?,?)"
            let params=[data.content,data.RoomID,data.MemberID ,data.timestamp];
            const field= await(db.executePreparedStatement(sql,params).rows);
            console.log(field);
            io.to(data.RoomID).emit('message',{
                content:data.content,
                RoomID:data.RoomID,
                MemberID:data.MemberID,
                timestamp:data.timestamp,
                messageID:field.insertedID
            })
            //이후 푸쉬 및 재확인
        })

        socket.on('ban',(data)=>{
            
        })

        socket.on('in',(data)=>{
            
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