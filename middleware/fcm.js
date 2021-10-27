const admin = require('firebase-admin')
var db = require('../model/db');


//userId, 방번호
//방번호에 있는 userId로 deviceToken 얻기

exports.send = async(title, message, roomId) => {

    let sql = "SELECT Devtoken FROM member JOIN account ON member.AccountID = account.AccountID WHERE roomID = ?;"
    let param = [roomId];
    let result = await db.executePreparedStatement(sql, param);

    let target_tokens = []
    for(i in result) {
        target_tokens[i] = result[i].Devtoken;
    }

    //방번호 디바이스 토큰 메시지
    // let target_tokens =`c1WsZgRXSOWvpJ6QH6uC4f:APA91bGz_Llh3omNiwycIgTFa_stjS5jOkVM-blGRg1x1OS2waxlcOVpmsO21DoNXUDGrg7QAJE1F46n24rqocGjwmImM_UJOoRxITKEhuuOnbH9jKilO6C-egvPFsackVlkP9Q_e85O`
    //target_token은 푸시 메시지를 받을 디바이스의 토큰값입니다

    let message = { //넣어야할 내용 : 시간 보낸사람 내용 방번호
    notification: {
        title: title,
        message: message,
        roomId : roomId
    },
    data: {
        title : title,
        message: message,
        roomId : roomId
    },
    token: target_tokens,
    }

    admin
    .messaging()
    .sendMulticast(message)
    .then(function (response) {
        console.log('Successfully sent message: : ', response)
    })
    .catch(function (err) {
        console.log('Error Sending message!!! : ', err)
    });

}