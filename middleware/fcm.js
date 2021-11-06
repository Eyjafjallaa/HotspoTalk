const admin = require('firebase-admin')
var db = require('../model/db');


//userId, 방번호
//방번호에 있는 userId로 deviceToken 얻기


exports.send = async(title, message, roomId, timestamp, messageID, userId) => {

    let sql = "SELECT Devtoken FROM member JOIN account ON member.AccountID = account.AccountID WHERE RoomID = ? AND account.id <> ?;";
    let param = [roomId, userId];
    console.log(param)
    let dev = await db.executePreparedStatement(sql, param);
    if(dev.length == 0) {
        return;
    }
    sql = `SELECT NickName FROM member WHERE AccountID = (SELECT AccountID FROM account WHERE id = ?) AND RoomID = ?`;
    param = [userId, roomId];
    let nickname = await db.executePreparedStatement(sql, param);

    let target_tokens = []
    for(i in dev) {
        target_tokens.push(dev[i].Devtoken);
    }
    messageData = JSON.stringify({
        title : title,
        sender : nickname[0].NickName, 
        timestamp : timestamp,
        message: message,
        roomId : roomId
    })
    let data = { //넣어야할 내용 : 시간 보낸사람 내용 방번호
        name : messageID.toString,
        notification: {
            title: title,
            body: message,
        },
        data : {messageData},
        token: target_tokens,
    }
    console.log(data);
    admin
    .messaging()
    .sendMulticast(data)
    .then(function (response) {
        console.log('Successfully sent message: : ', response)
    })
    .catch(function (err) {
        console.log('Error Sending message!!! : ', err)
    });
}