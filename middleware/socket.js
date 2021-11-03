
const db = require('../model/db');
const isBaned = require('../check/isBaned')
const fcm = require('../middleware/fcm');
const isHead = require('../check/isHead');
const existUser = require('../check/existUser');

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
            
            let sql="INSERT INTO chatting (content, RoomID, MemberID) VALUES(?,?,?)"
            let params=[data.content,data.RoomID,data.MemberID ];
            const field= await(db.executePreparedStatement(sql,params).rows);
            console.log(field);
            io.to(data.RoomID).emit('message',{
                content:data.content,
                RoomID:data.RoomID,
                MemberID:data.MemberID,
                timestamp:data.timestamp,
                messageID:field.insertedID
            })
            //셀렉트로 전체 찾아서 푸쉬
            //이후 푸쉬 및 재확인
            await fcm.send("message",data.content,data.RoomID);
        })

        socket.on('ban',(data)=>{
            
        })

        socket.on('in',async(data)=>{
            
        })
        socket.on('unload',(data)=>{
            socket.leave(data.room);
        })


        socket.on('onload',(data)=>{    
            socket.join(data.room)
        })
        socket.on('onshot',(data)=>{
            console.log(data)
            
            io.to(data.room).emit('testserver',{
                nickname:data.nickname,
                msg:data.msg
            });
            socket.emit('testserver',{
                msg:"wa sans"
            })
        })

    })
}

/*

    1.방들어오기
    2.채팅하기

*/