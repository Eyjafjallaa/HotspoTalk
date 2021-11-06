
const db = require('../model/db');
const isBaned = require('../check/isBaned')
const fcm = require('../middleware/fcm');
const isHead = require('../check/isHead');
const existUser = require('../check/existUser');
const socketTokendecode = require('../middleware/socketToken');


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
            data = JSON.parse(data);
            // console.log(data)
            try {
                //MEMBERID 토큰으로 바꿔서
                const userId = await socketTokendecode(data.token);
                // console.log(userId,data)
                const row = await db.executePreparedStatement("SELECT member.NickName, member.MemberID from member left join account on account.AccountID = member.AccountID where RoomID =? and account.id=?",[data.roomId,userId]);
                // console.log(row);
                let sql="INSERT INTO chatting (content, RoomID, MemberID,Type) VALUES(?,?,?,?)"
                let params=[data.content,data.roomId,row[0].MemberID,"msg"];
                // console.log(params)
                const field= await db.executePreparedStatement(sql,params);
                // console.log(field);
                const timestamp = await db.executePreparedStatement("select Timestamp FROM chatting WHERE ChattingID = ?",[field.insertId])
                socket.broadcast.to(data.RoomID).emit('message',{
                    type:"msg",
                    content:data.content,
                    roomID:data.roomId,
                    nickname:row[0],
                    timestamp:timestamp[0].timestamp,
                    messageID:field.insertId
                })
                
                // await fcm.send("HotspoTalk 메시지",data.content,data.roomId,data.timestamp , field.insertId, userId);
            } catch (error) {
                console.log('socket')
                console.log(error)
                socket.emit('err', {
                    msg : error
                })
            }
        })

        socket.on('ban',(data)=>{
            
        })

        socket.on('in',async(data)=>{
            socket.join(data.roomID)
            /*
            roomID=>
            userlist, message
            */
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