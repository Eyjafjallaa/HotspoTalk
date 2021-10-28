var express = require('express');
const decode = require('../middleware/token');
var router = express.Router();
const insertBodyCheck = require('../check/insertBodyCheck');
var db = require('../model/db');
const oneMeter = require('../config/distantConfig')

router.get('/', decode, async(req, res) => { //들어갈 수 있는 방 들어갔던 방    
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

router.get('/:roomid/user', (req, res) => {

})
router.get('/:roomid/member', (req, res) => {

})
router.delete('/:roomid/exit', (req, res) => {

})

router.put('/:roomid/edit', (req, res) => {

})

router.put('/:roomid/inherit', (req, res) => {

})

router.delete('/:roomid', (req, res) => {

})

router.put('/:roomid/rename', (req, res) => {

})

module.exports = router;
