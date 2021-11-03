
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
        
            await fcm.send("message",data.content,data.RoomID);
        })

        socket.on('ban',(data)=>{
            
        })

        socket.on('in',async(data)=>{
            try {
                let roomId = data.roomId
                let userId = data.userId
                let nickname= data.nickname
                let password = data.password
                await isBaned.check(roomId, userId);
        
                let sql = "SELECT RoomPW FROM room WHERE RoomID = ?";
                let param = [roomId];
                let existPW = await db.executePreparedStatement(sql, param);
                if(existPW.length == 0) {
                    throw "방아이디와 일치하는 방이 없습니다.";
                }
                if(existPW[0].RoomPW !== '') {
                    let sql =  `SELECT count(*) AS len FROM room WHERE RoomID = ? AND RoomPW = ?`;
                    let param = [roomId, password];
        
                    let result = await db.executePreparedStatement(sql, param);
                    if(result[0].len === 0) {
                        throw "비밀번호가 일치하지 않습니다."
                    }
                }
                
                sql = "INSERT INTO member(isHead, RoomID, AccountID, NickName) VALUES(0, ?, (SELECT AccountID FROM account WHERE id = ?), ?)";
                param = [roomId, userId, nickname];
                await db.executePreparedStatement(sql, param);
                // await fcm.send("HostpoTalk", nickname + "님이 입장하셨습니다.", roomId);
                socket.emit('in',{
                    msg:"ok"
                })
                io.to(roomId).emit('everyin',{
                    msg:nickname+"님이 입장하셨습니다."
                })
            } catch(e) {
                console.log(e);
                socket.emit('errin',{
                    msg:e
                })
            }
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