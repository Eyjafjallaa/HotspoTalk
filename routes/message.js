var express = require('express');
const decode = require('../middleware/token');
var router = express.Router();
const admin = require('firebase-admin')

let serAccount = require('../config/hotspotalk-firebase-adminsdk-2ejcn-483aca231a.json');

admin.initializeApp({
  credential: admin.credential.cert(serAccount),
})

router.get('/', (req, res) => {
    let title = req.query.title;
    let body = req.query.body;
    let roomId = req.query.roomId;
    //방번호 디바이스 토큰 메시지
    let target_token =`c1WsZgRXSOWvpJ6QH6uC4f:APA91bGz_Llh3omNiwycIgTFa_stjS5jOkVM-blGRg1x1OS2waxlcOVpmsO21DoNXUDGrg7QAJE1F46n24rqocGjwmImM_UJOoRxITKEhuuOnbH9jKilO6C-egvPFsackVlkP9Q_e85O`
  	//target_token은 푸시 메시지를 받을 디바이스의 토큰값입니다

  let message = { //넣어야할 내용 : 시간 보낸사람 내용 방번호
    notification: {
      title: title,
      message: body,
      roomId : roomId
    },
    data: {
      title : title,
      message: body,
      roomId : roomId
    },
    token: target_token,
  }
  console.log(message);
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