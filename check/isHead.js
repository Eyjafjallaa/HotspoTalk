const db = require('../model/db');

exports.check = async(roomId, userId) => {
    let sql = `SELECT member.IsHead FROM member JOIN account ON member.AccountID = account.AccountID WHERE account.id = ? AND member.RoomID = ?;`
    let param = [userId, roomId];

    let result = await db.executePreparedStatement(sql, param);
    if(result.length == 0) {
        throw "해당 유저id는 방에 속해 있지 않습니다.";
    }

    if(result[0].IsHead != 1) {
        throw "방장이 아닙니다.";
    }

}