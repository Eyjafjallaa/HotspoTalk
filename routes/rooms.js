var express = require('express');
const decode = require('../middleware/token');
var router = express.Router();
const insertBodyCheck = require('../check/insertBodyCheck');
var db = require('../model/db');
const oneMeter = require('../config/distantConfig');
const fcm = require('../middleware/fcm');
const isHead = require('../check/isHead');
const existUser = require('../check/existUser');

router.get('/', decode, async(req, res) => { //들어갈 수 있는 방 들어갔던 방
    if(Object.keys(req.query).length === 0 && req.query.constructor === Object) { //파라미터가 없을 경우 -> 들어갔던 방
        try {
            let userId = req.token.sub;
            let sql = `SELECT room.RoomID, room.RoomName, room.RoomPW, room.AreaDetail, room.MemberLimit, member.IsHead 
                        FROM account 
                        join member join room 
                        ON account.AccountID = member.AccountID 
                        AND room.RoomID = member.roomID 
                        WHERE account.id = ?;`
            let param = [userId];
        
            let result = await db.executePreparedStatement(sql, param);
            if(result.length == 0) {
                res.status(200).json({
                    msg : "없음"
                })
            } else {
                let arr = [];
                for(i in result) {
                    arr.push({
                        roomId : result[i].RoomId,
                        roomName : result[i].RoomName,
                        roomPW : result[i].RoomPW,
                        roomRange : result[i].AreaDetail,
                        isHead : result[i].IsHead
                    });
                }
                res.status(200).json(arr)
            }
    
        } catch(e) {
            console.log(e);
            res.status(400).json({
                msg : e
            })
        }
    } else {
        try {
            let sql = "SELECT distinct AreaDetail FROM hotsix.room;";
            let area = await db.executePreparedStatement(sql);
        
            let result = [];
            let latitude =  parseFloat(req.query.latitude);
            let longitude = parseFloat(req.query.longitude);
            for(i in area) {
                let param =[
                    latitude, oneMeter*area[i].AreaDetail, 
                    latitude, oneMeter*area[i].AreaDetail, 
                    longitude, oneMeter*area[i].AreaDetail, 
                    longitude, oneMeter*area[i].AreaDetail
                ];
                sql = `SELECT * FROM hotsix.room WHERE 
                Latitude < (? + ?) AND Latitude > (? - ?) AND
                Longitude < (? + ?) AND Longitude > (? - ?);`;
                
                let rs = await db.executePreparedStatement(sql, param);
                for(a in rs) {
                    result.push({
                        roomID : rs[a].RoomID,
                        roomName : rs[a].RoomName,
                        memberLimit : rs[a].MemberLimit,
                        roomRange : rs[a].AreaDetail
                    })
                }
            }
            if(result.length == 0) {
                throw "검색된 방이 없습니다.";
            }
            let nonDuplicatedResult = [...new Set(result.map(JSON.stringify))].map(JSON.parse);
            res.status(200).json(nonDuplicatedResult);
        } catch (e) {
            console.log(e);
            res.status(400).json({
                msg : e
            })
        }

    }
    
})


//longitude 경도 latitude 위도   areaType : 0 반경 1 주소 areaDetail : type이 0일때는 m / 1일 떄는 0이면 동 1이면 상위
//35.664753, 128.422895
router.post('/', decode, async(req, res) => {
    try{
        const userId = req.token.sub;
        const body = req.body;
        insertBodyCheck.check(body);

        let sql = "INSERT INTO room(RoomName, RoomPW, Latitude, Longitude, MemberLimit, AreaType, AreaDetail) values(?,?,?,?,?,?,?)"
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
    }catch(e) {
        res.status(401).json({
            msg : e
        })
    }
})

router.post('/:roomid', decode, async(req, res) => { //방 입장
    try {
        let roomId = req.params.roomid;
        let userId = req.token.sub;
        let { nickname, password } = req.body;

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
        res.status(200).json({
            msg : "OK"
        })
        
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
router.delete('/:roomid/exit', decode,(req, res) => { //퇴장
    try {
        const userId = req.token.sub;
        const roomId = req.params.roomid;

        let sql = `DELETE FROM member `
    } catch(e) {
        res.status(401).json({
            msg : e
        })
    }
})

router.put('/:roomid/edit', decode, async(req, res) => {
    try {
        const roomId = req.params.roomid;
        const userId = req.token.sub;
        const body = req.body;
        await isHead.cheack(roomId, userId);
        
        let sql = "UPDATE room SET RoomName = ?, RoomPW = ?, MemberLimit = ?, AreaDetail = ? WHERE RoomID = ?";
        let param = [body.name, body.password, body.memberLimit, body.roomRange, roomId];

        await db.executePreparedStatement(sql, param);

        res.status(201).json({
            msg : "OK"
        })
       } catch(e) {
        res.status(401).json({
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

router.delete('/:roomid', (req, res) => {

})

router.put('/:roomid/rename', (req, res) => {

})

module.exports = router;
