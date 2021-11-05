const admin = require('firebase-admin')
var db = require('../model/db');


//userId, 방번호
//방번호에 있는 userId로 deviceToken 얻기

exports.send = async(title, message, sender,roomId) => {

    let sql = "SELECT Devtoken FROM member JOIN account ON member.AccountID = account.AccountID WHERE roomID = ?;"
    let param = [roomId];
    let result = await db.executePreparedStatement(sql, param);

    let target_tokens = []
    for(i in result) {
        target_tokens.push(result[i].Devtoken);
    }
    let data = { //넣어야할 내용 : 시간 보낸사람 내용 방번호
        notification: {
            title: title,
            sender : sender,
            message: message,
            roomId : roomId
        },
        data: {
            title : title,
            sender : sender,
            message: message,
            roomId : roomId
        },
        token: target_tokens,
    }

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