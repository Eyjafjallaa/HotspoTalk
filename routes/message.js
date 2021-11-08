var express = require('express');
const decode = require('../middleware/token');
var router = express.Router();
const admin = require('firebase-admin')

let serAccount = require('../config/hotspotalk-firebase-adminsdk-2ejcn-483aca231a.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serAccount),
// })

router.get('/', (req, res) => {
    console.log("sadfa");
    let title = req.query.title;
    let body = req.query.body;
    // let roomId = req.query.roomId;
    //방번호 디바이스 토큰 메시지
    let target_token =`cN7rPB-zSgCNjYlXQ_HFf5:APA91bFR97URTagPBwLTrdM8w9PhOSOLE2W9OFJPQPcDnj8u6fBHh4yUyLZc56AowF8j28NgcymIwN15k6siLG_fAjpb1RVuJUlbjm_3yfkZ6ataVgjQKEmmwDCOO3x5t5WwRtddPUXW`;
  	//target_token은 푸시 메시지를 받을 디바이스의 토큰값입니다

    let messageData = JSON.stringify({
      title : title,
      body: body,
      userId: "testuser",
      roomId : 46
    })
    let message = { //넣어야할 내용 : 시간 보낸사람 내용 방번호
      // name : '1',
      data: {messageData},
      notification: {
        title: title,
        body: body,
      },
      token: target_token,
  }
  admin
    .messaging()
    .send(message)
    .then(function (response) {
      console.log('Successfully sent message: : ', response)
      return res.status(200).json({success : true})
    })
    .catch(function (err) {
      console.log('Error Sending message!!! : ', err)
      return res.status(400).json({success : false})
    });
})

module.exports = router;