var express = require('express');
const decode = require('../middleware/token');
var router = express.Router();
// const insertBodyCheck = require('../check/insertBodyCheck');
var db = require('../model/db');
const oneMeter = require('../config/distantConfig');
const isHead = require('../check/isHead');
const existUser = require('../check/existUser');
const isBaned = require('../check/isBaned')
const naver = require('../middleware/apiRequest');


router.get("/", decode, async (req, res) => {
  //들어갈 수 있는 방 들어갔던 방
  let userId = req.token.sub;
  if (Object.keys(req.query).length === 0 && req.query.constructor === Object) {
    //파라미터가 없을 경우 -> 들어갔던 방
    try {
        let sql = `SELECT distinct room.RoomID, room.RoomName, room.RoomPW, room.AreaDetail, room.MemberLimit, room.Address, room.AreaType, 
        member.IsHead,Count(member.MemberID) as memberCount,
        if(room.RoomPW<>'','T','F') AS existPW, 
        chatting.content as lastChatting
        FROM account
        left join member on account.AccountID = member.AccountID 
        left join room on member.RoomID = room.RoomID
        left join chatting on room.RoomID = chatting.RoomID
        WHERE account.Id = ?
        AND (ChattingID)IN (SELECT max(ChattingID) from chatting group by RoomID)
        group by RoomID
        ORDER BY chatting.ChattingID desc;
      `;
      let param = [userId];
      let result = await db.executePreparedStatement(sql, param);

      if (result.length == 0) {
        res.status(200).json([]);
      } else {
        let arr = [];
        for (i in result) {
            let existPW = false;
          if (result[i].AreaType == 1) {
            if(result[i].existPW == 'T') {
                existPW = true;
            }
            arr.push({
              roomID: result[i].RoomID,
              roomName: result[i].RoomName,
              roomPW: result[i].RoomPW,
              areaType: result[i].AreaType,
              address: result[i].Address,
              isHead: result[i].IsHead,
              lastChatting: result[i].lastChatting,
              existPW: existPW,
              memberLimit:result[i].MemberLimit,
              memberCount:result[i].memberCount
            });
          } else {
            if(result[i].existPW == 'T') {
                existPW = true;
            }
            arr.push({
              roomID: result[i].RoomID,
              roomName: result[i].RoomName,
              roomPW: result[i].RoomPW,
              areaType: result[i].AreaType,
              roomRange: result[i].AreaDetail,
              isHead: result[i].IsHead,
              lastChatting: result[i].lastChatting,
              existPW: existPW,
              memberLimit:result[i].MemberLimit,
              memberCount:result[i].memberCount
            });
          }
        }
        res.status(200).json(arr);
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({
        msg: e,
      });
    }
  } 
  else {//들어가지 않은 방
    try {
      let sql = "SELECT distinct AreaDetail FROM hotsix.room;";
      let area = await db.executePreparedStatement(sql);
      let result = [];
      let latitude = parseFloat(req.query.latitude);
      let longitude = parseFloat(req.query.longitude);
      for (i in area) {
        let param = [
          latitude,
          oneMeter * area[i].AreaDetail,
          latitude,
          oneMeter * area[i].AreaDetail,
          longitude,
          oneMeter * area[i].AreaDetail,
          longitude,
          oneMeter * area[i].AreaDetail,
          req.token.sub
        ];
        sql = `SELECT distinct room.RoomID, room.RoomName, room.MemberLimit, room.AreaDetail, room.AreaType,
            if(room.RoomPW<>'','T','F') AS existPW, room.MemberLimit, COUNT(member.MemberID) As memberCount
            FROM hotsix.room 
            LEFT JOIN hotsix.member ON room.RoomID = member.RoomID
            WHERE 
            Latitude < (? + ?) AND Latitude > (? - ?) AND
            Longitude < (? + ?) AND Longitude > (? - ?) AND
            member.RoomID <> 
            ALL(select RoomID from hotsix.member WHERE AccountID = ?)
            group by room.RoomID`;

        let rs = await db.executePreparedStatement(sql, param);
        for (a in rs) {
            let existPW = false;
            if(rs[a].existPW == 'T') {
                existPW = true;
            }
          result.push({
            roomID: rs[a].RoomID,
            roomName: rs[a].RoomName,
            memberLimit: rs[a].MemberLimit,
            memberCount:rs[a].memberCount,
            roomRange: rs[a].AreaDetail,
            areaType: rs[a].AreaType,
            existPW: existPW,
          });
        }
    }
    if (result.length != 0) {
        result = [...new Set(result.map(JSON.stringify))].map(JSON.parse);
    }
    let apiResult = await naver.get(latitude, longitude);
    if(!apiResult) {
        if(result.length == 0) {
            res.status(200).json([]);
            return;
        }
    } else {
        sql = "";
        result.data = result;
        result.msg = "OK";
        for (i in apiResult) {
            sql += `SELECT room.RoomID, room.RoomName, room.MemberLimit, room.Address ,room.AreaType,
            if(room.RoomPW<>'','T','F') AS existPW, room.MemberLimit, 
            COUNT(member.MemberID) As memberCount
            FROM room LEFT JOIN hotsix.member ON room.RoomID = member.RoomID
            left join account on account.AccountID=member.AccountID
            WHERE address like ?
            and member.RoomID <> ALL(select RoomID from hotsix.member WHERE account.id = ?)
            union `;
        }
        //[
            //api result 1, token.sub, api result 2, token.sub ... ...
            //]
            sql = sql.substring(0, sql.length - 6);
            sql += "group by room.RoomID"
            let param = [];
            for(i of apiResult) {
                param.push(i);
                param.push(userId);
            }
            //   console.log(param)
            let result2 = await db.executePreparedStatement(sql, param);
            // console.log(result2);
            for (a of result2) {
            let existPW = false;
            if(a.existPW == "T") {
                existPW = true;
            }
            if(a.RoomID == null) {
                continue;
            }
            result.push({
              roomID: a.RoomID,
              roomName: a.RoomName,
              memberLimit: a.MemberLimit,
              memberCount:a.memberCount,
              address: a.Address,
              areaType: a.AreaType,
              existPW: existPW,
            });
          }
        //   console.log(result);   
          if (result.length == 0) {
              resData = [];
          }
          else {
            resData = result;
          }
        }
        res.status(200).json(resData);

    } catch (e) {
        console.log(e);
      res.status(400).json({
        msg: e,
      });
    }
  }
});


//longitude 경도 latitude 위도   areaType : 0 반경 1 주소 areaDetail : type이 0일때는 m / 1일 떄는 0이면 동 1이면 상위
//35.664753, 128.422895
router.post('/', decode, async(req, res) => {
    // console.log(req.body);
    if(req.body.password==undefined){
        req.body.password="";
    }
    try{
        const userId = req.token.sub;
        const body = req.body;
        if(body.areaType == 1) {
            let sql = "INSERT INTO room(RoomName, RoomPW, MemberLimit, AreaType, Address) values(?,?,?,?,?)";
            let param = [body.name, body.password, body.memberLimit, body.areaType, body.address];
            for(var x in param){
                if(param[x]==undefined)
                    param[x] = ""; 
            }
            let roomId = await db.executePreparedStatement(sql, param);
            roomId=roomId.insertId
            sql = "SELECT AccountID FROM account WHERE id = ?;"
            let accountId = await db.executePreparedStatement(sql, [userId]);
            accountId = accountId[0].AccountID
            
            sql = "INSERT INTO member(IsHead, RoomID, AccountID, NickName) values(?,?,?,?);";
            param = [1,roomId, accountId, body.nickName];
            var c=await db.executePreparedStatement(sql, param);
            console.log(roomId);
            //
            await db.executePreparedStatement("INSERT INTO chatting(content, RoomID, MemberID,Type,NickName) VALUES(?,?,?,?,?)",
            [body.nickName + "님이 들어오셨습니다.",roomId,c.insertId,'in',body.nickName]);
            
            res.status(201).json({
                msg : "OK"
            });
        }else {
            let sql = "INSERT INTO room(RoomName, RoomPW, Latitude, Longitude, MemberLimit, AreaType, AreaDetail) values(?,?,?,?,?,?,?)";
            let param = [body.name, body.password, body.latitude, body.longitude, body.memberLimit, body.areaType, body.areaDetail];
            const roomId = await db.executePreparedStatement(sql, param);
            
            sql = "SELECT AccountID FROM account WHERE id = ?;"
            // console.log(userId);
            let accountId = await db.executePreparedStatement(sql, [userId]);
            accountId = accountId[0].AccountID
            
            sql = "INSERT INTO member(IsHead, RoomID, AccountID, NickName) values(?,?,?,?);";
            param = [1,roomId.insertId, accountId, body.nickName];
            let c =await db.executePreparedStatement(sql, param);

            //
            await db.executePreparedStatement("INSERT INTO chatting(content, RoomID, MemberID,Type,NickName) VALUES(?,?,?,?,?)",
            [body.nickName + "님이 들어오셨습니다.",roomId.insertId,c.insertId,'in',body.nickName]);
            res.status(201).json({
                msg : "OK"
            });
        }
    }catch(e) {
        console.log(e);
        res.status(400).json({
            msg : e
        })
    }
})

router.post('/in/:roomid', decode, async(req, res) => { //방 입장
    try {
        let roomId = req.params.roomid;
        let userId = req.token.sub;
        let { nickname, password } = req.body;
        // console.log(req.body);
        await isBaned.check(roomId, userId);

        let sql = `SELECT count(*) as able FROM room WHERE RoomID = ? AND MemberLimit > (SELECT count(*) FROM member WHERE RoomID = ?);`;
        let param = [roomId, roomId];
        let limit = await db.executePreparedStatement(sql, param);
        if(limit[0].able == 0) {
            throw "방이 가득찼습니다.";
        }

        sql = "SELECT RoomPW FROM room WHERE RoomID = ?";

        // let sql2 = "SELE"
        param = [roomId];
        let existPW = await db.executePreparedStatement(sql, param);
        if(existPW.length == 0 || existPW.RoomPW == '') {
            throw "방아이디와 일치하는 방이 없습니다.";
        }
        if(existPW[0].RoomPW !== '') { //비번이 존재하는지 확인
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
        res.status(200).json({
            msg : "OK"
        })
        sql = `INSERT INTO chatting(content, RoomID, MemberID, Type, NickName) VALUES('`+ nickname +` 님이 들어오셨습니다.',?,(SELECT member.MemberID FROM member join account ON account.AccountID = member.AccountID WHERE account.id = ? AND member.RoomID = ?),'in',?)`;
        let feild = await db.executePreparedStatement(sql, [roomId, userId, roomId,nickname]);
        sql = `SELECT * FROM chatting WHERE ChattingID = ?`;
        let result = await db.executePreparedStatement(sql, [feild.insertId]);
        
        // insert 해서 chatting에 메세지 남기고 그다음 밑에 io에 보내기
        console.log(typeof(roomId),roomId);
        req.app.get('io').to(parseInt(roomId)).emit('message',{
            type:"in",
            content:result[0].content,
            roomID:parseInt(roomId),
            nickname:nickname,
            timestamp:result[0].Timestamp,
            messageID:feild.insertId,
            isMe:false
        });
    } catch(e) {
        console.log(e);
        res.status(400).json({
            msg : e
        })
    }
})

router.get('/:roomid/member', decode, async(req, res) => { //멤버 목록
    try {
        const roomId = req.params.roomid;
        const userID = req.token.sub;
    
        let sql = `SELECT account.id, member.nickName, member.IsHead,
        if(account.id = ?,'T','F') AS isMe
        FROM member JOIN account ON account.AccountID = member.AccountID WHERE member.RoomID = ?;`;
        let param = [userID,roomId];
    
        let result = await db.executePreparedStatement(sql, param);
        arr = [];
        for(i in result) {
            let isMe = false;
            if(result[i].isMe == "T") {
                isMe = true;
            }
            arr.push({
                userID : result[i].id,
                nickName : result[i].nickName,
                isHead : result[i].IsHead,
                isMe : isMe
            })
        }
        res.status(200).json(arr);
    } catch(e) {
        res.status(400).json({
            msg : e
        })
    }
})
router.delete('/:roomid/exit', decode, async(req, res) => { //퇴장
    try {
        const userId = req.token.sub;
        const roomId = req.params.roomid;
        let nicknameAndIsHead = await db.executePreparedStatement(`SELECT NickName,isHead FROM member WHERE AccountID = (SELECT AccountID FROM account WHERE id = ?) AND RoomID = ?`,[userId, roomId])
        if(nicknameAndIsHead.length == 0) {
            throw "해당 유저는 방에 없습니다."
        }
        if(nicknameAndIsHead[0].isHead == 1) {
            let sql = `DELETE FROM room WHERE RoomID = ?`;
            let param = [roomId];
            // console.log(param);
            await db.executePreparedStatement(sql, param);
            sql = `SELECT (NOW()) AS timestamp`;
            let timestamp = await db.executePreparedStatement(sql, [])
            req.app.get('io').to(parseInt(roomId)).emit('message', {
                type: 'break',
                content: "방장이 방을 삭제하였습니다.",
                roomID: parseInt(roomId),
                nickname: "",
                timestamp: timestamp[0].timestamp,
                messageID: 0,
                isMe: false
            })
            res.status(200).json({
                msg : "OK"
            })
        } else {
            let content = nicknameAndIsHead[0].NickName + " 님이 나가셨습니다."
            let sql = `INSERT INTO chatting(content, RoomID, MemberID, Type, NickName) VALUES(?,?,(SELECT member.MemberID FROM member join account ON account.AccountID = member.AccountID WHERE account.id = ? AND member.RoomID = ?),'leave',(SELECT member.NickName FROM member join account ON account.AccountID = member.AccountID WHERE account.id = ? AND member.RoomID = ?))`;
            let param = [content,roomId, userId, roomId, userId, roomId];
            let feild = await db.executePreparedStatement(sql, param);
            sql = `SELECT chatting.content, chatting.RoomID, chatting.Timestamp, member.nickname FROM chatting join member on member.MemberID = chatting.MemberID WHERE ChattingID = ?`;
            let result = await db.executePreparedStatement(sql, [feild.insertId]);
            
            sql = `DELETE FROM member WHERE AccountID = (SELECT AccountID FROM account WHERE id = ?) AND RoomID = ?`;
            param = [userId, roomId];
            await db.executePreparedStatement(sql, param);
            req.app.get('io').to(parseInt(roomId)).emit('message',{
                type:"out",
                content:result[0].content,
                roomID:parseInt(roomId),
                nickname:result[0].nickname,
                timestamp:result[0].Timestamp,
                messageID:feild.insertId,
                isMe:false
            });
            res.status(200).json({
                msg : "OK"
            })
        }
    } catch(e) {
        console.log(e);
        res.status(400).json({
            msg : e
        })
    }
})

router.put('/:roomid/edit', decode, async(req, res) => {
    try {
        const roomId = req.params.roomid;
        const userId = req.token.sub;
        const body = req.body;
        await isHead.check(roomId, userId);
        
        let sql = "UPDATE room SET RoomName = ?, RoomPW = ?, MemberLimit = ?, AreaDetail = ? WHERE RoomID = ?";
        let param = [body.name, body.password, body.memberLimit, body.roomRange, roomId];

        await db.executePreparedStatement(sql, param);

        res.status(201).json({
            msg : "OK"
        })
       } catch(e) {
        res.status(400).json({
            msg : e
        })
    }
})

router.put('/:roomid/inherit', decode, async(req, res) => {
    try {
        const roomId = req.params.roomid;
        const userId = req.token.sub;
        const target = req.body.accountId;

        await isHead.cheack(roomId, userId);
        await existUser.check(target);

        let sql = `UPDATE member SET IsHead = 1 WHERE RoomID = ? AND AccountID = (SELECT AccountID FROM account WHERE id = ?)`; //일반 -> 방장
        let param = [roomId, target];

        await db.executePreparedStatement(sql, param);
        sql = `UPDATE member SET IsHEad = 0 WHERE RoomID = ? AND AccountID = (SELECT AccountID FROM account WHERE id = ?)`; //일반 -> 방장
        param = [roomId, userId];

        await db.executePreparedStatement(sql, param);

        res.status(200).json({
            msg : "OK"
        })
       //상속 나중에 소켓
        // req.app.get('io').to(parseInt(roomId)).emit('message',{
        //     type:"leave",
        //     content:result[0].content,
        //     roomId:parseInt(roomId),
        //     nickname:nickname,
        //     timestamp:result[0].Timestamp,
        //     messageID:field.insertId
        // });
    } catch(e) {
        res.status(400).json({
            msg : e
        })
    }
})

router.delete('/:roomid', decode, async(req, res) => {
    try {
        const roomId = req.params.roomid;
        const userId = req.token.sub;
        await isHead.check(roomId,userId);

        let sql = `DELETE FROM room WHERE RoomID = ?`;
        let param = [roomId];
        await db.executePreparedStatement(sql, param);
        res.status(201).json({
            msg : "OK"
        })
    } catch(e) {
        console.log(e);
        res.status(400).json({
            msg : e
        })
    }
})

router.put('/:roomid/rename', decode, async(req, res) => {
    try{
        const roomId = req.params.roomid;
        const userId = req.token.sub;
        const nickName = req.body.nickName;
        let sql = `UPDATE member SET NickName = ? WHERE RoomID = ? AND AccountID = (SELECT AccountID FROM account WHERE id = ?)`;
        let param = [nickName, roomId, userId];

        await db.executePreparedStatement(sql, param);

        res.status(201).json({
            msg : "OK"
        })
    } catch(e) {
        res.status(400).json({
            msg : e
        })
    }
})

router.put('/ban', decode, async(req, res) => {
    try {
        const master = req.token.sub;
        const { accountId, roomId } = req.body;
        await isHead.check(roomId, master);

        let sql = `INSERT INTO ban(AccountId, RoomID) VALUES((SELECT AccountID FROM account WHERE id = ?), ?)`;
        let param = [accountId, roomId];
        await db.executePreparedStatement(sql, param);

        sql = `DELETE FROM member WHERE AccountID = (SELECT AccountId FROM account WHERE id = ?) AND RoomID = ?`;
        param = [accountId, roomId];
        await db.executePreparedStatement(sql, param);

        res.status(201).json({
            msg : "OK"
        })
    } catch(e) {
        res.status(400).json({
            msg : e
        })
    }
})

router.get('/:roomId', decode,async(req, res) => {
    try {
        const userID = req.token.sub;
        const roomId = req.params.roomId;
        const {start, count} = req.query;
        
        let sql = `SELECT chatting.NickName, chatting.content, chatting.Timestamp, chatting.Type, chatting.ChattingID,
        if(account.id = ? ,'T','F') AS isMe
        FROM chatting 
        left JOIN member ON chatting.MemberID = member.MemberID 
        left JOIN account ON account.AccountID = member.AccountID
        WHERE chatting.RoomID = ?
        ORDER BY Timestamp 
        LIMIT ?, ?;`
        
        let param = [userID,parseInt(roomId), parseInt(start), parseInt(count)];
        // console.log(param)

        let result = await db.executePreparedStatement(sql, param);
        // console.log(result);
        let arr = [];
        for(i of result) {
            let isMe = false;
            if(i.isMe == 'T') {
                isMe = true;
            }
            arr.push({
                nickname : i.NickName,
                content : i.content,
                timestamp : i.Timestamp,
                type : i.Type,
                messageID:i.ChattingID,
                isMe : isMe
            })
        }

        res.status(200).json(arr);
    } catch (e) {
        res.status(400).json({
            msg : e
        })
    }
})



module.exports = router;
