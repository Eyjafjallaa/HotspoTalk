var express = require('express');
const decode = require('../middleware/token');
var router = express.Router();
const insertBodyCheck = require('../check/insertBodyCheck');
var db = require('../model/db');
const oneMeter = require('../config/distantConfig');
const fcm = require('../middleware/fcm');
const isHead = require('../check/isHead');
const existUser = require('../check/existUser');
const isBaned = require('../check/isBaned')
const naver = require('../middleware/apiRequest');


router.get("/", decode, async (req, res) => {
  //들어갈 수 있는 방 들어갔던 방
  if (Object.keys(req.query).length === 0 && req.query.constructor === Object) {
    //파라미터가 없을 경우 -> 들어갔던 방
    try {
      let userId = req.token.sub;
      let sql = `SELECT room.RoomID, room.RoomName, room.RoomPW, room.AreaDetail, room.MemberLimit, room.Address, room.AreaType, member.IsHead
                        FROM account 
                        join member join room 
                        ON account.AccountID = member.AccountID 
                        AND room.RoomID = member.roomID 
                        WHERE account.id = ?;`;
      let param = [userId];

      let result = await db.executePreparedStatement(sql, param);
      if (result.length == 0) {
        res.status(200).json([]);
      } else {
        let arr = [];
        for (i in result) {
          if (result[i].AreaType == 1) {
            arr.push({
              roomId: result[i].RoomId,
              roomName: result[i].RoomName,
              roomPW: result[i].RoomPW,
              areaType: result[i].AreaType,
              address: result[i].Address,
              isHead: result[i].IsHead,
            });
          } else {
            arr.push({
              roomId: result[i].RoomId,
              roomName: result[i].RoomName,
              roomPW: result[i].RoomPW,
              areaType: result[i].AreaType,
              roomRange: result[i].AreaDetail,
              isHead: result[i].IsHead,
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
  } else {
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
        ];
        sql = `SELECT * FROM hotsix.room WHERE 
            Latitude < (? + ?) AND Latitude > (? - ?) AND
            Longitude < (? + ?) AND Longitude > (? - ?);`;

        let rs = await db.executePreparedStatement(sql, param);
        for (a in rs) {
          result.push({
            roomID: rs[a].RoomID,
            roomName: rs[a].RoomName,
            memberLimit: rs[a].MemberLimit,
            roomRange: rs[a].AreaDetail,
            areaType: rs[a].AreaType,
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
            sql += `SELECT RoomID, RoomName, MemberLimit, Address ,AreaType FROM room WHERE address like ? UNION `;
          }
          sql = sql.substring(0, sql.length - 6);
          let result2 = await db.executePreparedStatement(sql, apiResult);
    
          for (a of result2) {
            result.push({
              roomID: a.RoomID,
              roomName: a.RoomName,
              memberLimit: a.MemberLimit,
              address: a.Address,
              areaType: a.AreaType,
            });
          }
          if (result.length == 0) {
              resData = [];
          }
          else {
            resData = result;
          }
        }
        res.status(200).json(resData);

    } catch (e) {
      res.status(400).json({
        msg: e,
      });
    }
  }
});


//longitude 경도 latitude 위도   areaType : 0 반경 1 주소 areaDetail : type이 0일때는 m / 1일 떄는 0이면 동 1이면 상위
//35.664753, 128.422895
router.post('/', decode, async(req, res) => {
    console.log(req.body);
    try{
        const userId = req.token.sub;
        const body = req.body;
        if(body.areaType == 1) {
            let sql = "INSERT INTO room(RoomName, RoomPW, MemberLimit, AreaType, Address) values(?,?,?,?,?)";
            let param = [body.name, body.password, body.memberLimit, body.areaType, body.address];
            const roomId = await db.executePreparedStatement(sql, param);
            
            sql = "SELECT AccountID FROM account WHERE id = ?;"
            let accountId = await db.executePreparedStatement(sql, [userId]);
            accountId = accountId[0].AccountID
            
            sql = "INSERT INTO member(IsHead, RoomID, AccountID, NickName) values(?,?,?,?);";
            param = [1,roomId.insertId, accountId, body.nickName];
            await db.executePreparedStatement(sql, param);
            
            res.status(201).json({
                msg : "OK"
            });
        }else {
            let sql = "INSERT INTO room(RoomName, RoomPW, Latitude, Longitude, MemberLimit, AreaType, AreaDetail) values(?,?,?,?,?,?,?)";
            let param = [body.name, body.password, body.latitude, body.longitude, body.memberLimit, body.areaType, body.areaDetail];
            const roomId = await db.executePreparedStatement(sql, param);
            
            sql = "SELECT AccountID FROM account WHERE id = ?;"
            console.log(userId);
            let accountId = await db.executePreparedStatement(sql, [userId]);
            accountId = accountId[0].AccountID
            
            sql = "INSERT INTO member(IsHead, RoomID, AccountID, NickName) values(?,?,?,?);";
            param = [1,roomId.insertId, accountId, body.nickName];
            await db.executePreparedStatement(sql, param);
            
            res.status(201).json({
                msg : "OK"
            });
        }
    }catch(e) {
        res.status(400).json({
            msg : e
        })
    }
})

router.post('/:roomid', decode, async(req, res) => { //방 입장
    try {
        let roomId = req.params.roomid;
        let userId = req.token.sub;
        let { nickname, password } = req.body;

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
        res.app.get('io').to(roomId).emit('message',{
            type:"in",
        });
    } catch(e) {
        console.log(e);
        res.status(400).json({
            msg : e
        })
    }
})

router.get('/:roomid/member', async(req, res) => { //멤버 목록
    try {
        const roomId = req.params.roomid;
    
        let sql = `SELECT account.id, member.nickName, member.IsHead FROM member JOIN account ON account.AccountID = member.AccountID WHERE member.RoomID = ?;`;
        let param = [roomId];
    
        let result = await db.executePreparedStatement(sql, param);
        arr = [];
        for(i in result) {
            arr.push({
                id : result[i].id,
                nickName : result[i].nickName,
                isHead : result[i].IsHead
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
        let sql = `DELETE FROM member WHERE AccountID = (SELECT AccountID FROM account WHERE id = ?) AND RoomID = ?`;
        let param = [userId, roomId];

        await db.executePreparedStatement(sql, param);
        res.status(200).json({
            msg : "OK"
        })
    } catch(e) {
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

router.get('/:roomId', async(req, res) => {
    try {
        const roomId = req.params.roomId;
        const {start, count} = req.query;
    
        let sql = `SELECT member.NickName, chatting.content, chatting.Timestamp
        FROM chatting 
        left JOIN member ON chatting.MemberID = member.MemberID 
        WHERE chatting.RoomID = ?
        ORDER BY Timestamp 
        LIMIT ?, ?;`
    
        let param = [roomId, start, count];

        let result = await db.executePreparedStatement(sql, param);
        let arr = [];
        for(i of result) {
            arr.push({
                nickName : i.NickName,
                content : i.content,
                timeStamp : i.TimeStamp
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
