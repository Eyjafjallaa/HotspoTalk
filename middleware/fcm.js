const admin = require('firebase-admin')
var db = require('../model/db');


//userId, 방번호
//방번호에 있는 userId로 deviceToken 얻기

exports.send = async(title, message, sender, roomId, timestamp, messageID, userId) => {

    let sql = "SELECT Devtoken FROM member JOIN account ON member.AccountID = account.AccountID WHERE roomID = ? AND account.id <> ?;"
    let param = [roomId, userId];
    console.log(param)
    let result = await db.executePreparedStatement(sql, param);

    let target_tokens = []
    for(i in result) {
        target_tokens.push(result[i].Devtoken);
    }
    messageData = JSON.stringify({
        title : title,
        sender : sender,
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