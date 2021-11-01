const db = require('../model/db');

exports.check = async(roomId, userId) => {
    let sql = `SELECT * FROM ban WHERE AccountID = (SELECT AccountID FROM account WHERE id = ?) AND RoomID = ?`;
    let param = [userId, roomId];
    let result = await db.executePreparedStatement(sql, param);
    console.log(result)
    if(result.length == 1) {
        throw "밴당한 유저 입니다.";
    }
}