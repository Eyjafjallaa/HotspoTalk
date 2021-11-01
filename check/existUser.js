const db = require('../model/db');

exports.check = async(userId) => {
    let sql = `SELECT count(*) as len FROM account WHERE id = ?`;
    let param = [userId];

    let result = await db.executePreparedStatement(sql, param);
    if(result[0].len == 0) {
        throw "존재하지 않는 유저 id입니다."
    }
}

