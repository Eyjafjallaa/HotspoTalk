var express = require('express');
var router = express.Router();
var db = require('../model/db');
var jwt = require('jsonwebtoken')
const crypto = require('crypto');
const secret = require('../config/tokenkey')

/* GET users listing. */
router.post('/signup', function(req, res, next) {
  post = req.body;
  const pw = crypto.createHash('sha512').update(post.password).digest('base64');
  db.query(`INSERT INTO account(id, password, Devtoken) values(?, ?, ?);`,
    [post.id, pw, post.Devtoken],
    (err, result) => {
      //console.log(err);
      if(err) { 
        console.log(err);
        res.status(400).json(
          {
            errCode: err.code
          }
        );
        return;
      }
      let user = {
        sub: post.userid,
        name: post.nickname,
        iat: new Date().getTime() / 1000
      };
      let token = jwt.sign(user, secret, {
        expiresIn: "32H"
      })
      res.status(200).json({
        logintoken: token,
      });
    })
});

router.post('/login', (req, res, next) => {
    db.query(`SELECT PW FROM Broker WHERE ID=? AND PW=?`, [req.body.id, req.body.pw], (err, result) => {
        if (result[0] == undefined) {
            res.status(401).json({});
            return;
        }
        if (req.body.pw == result[0].PW) {
            var user = {
                sub: req.body.id,
                iat: new Date().getTime() / 1000
            };
            var token = jwt.sign(user, secret, {
                expiresIn: "32H"
            })
            res.status(200).json({
                logintoken: token,
            });
        }

    })
});

router.get('/:id', (req, res, next) => {

});

router.delete('/ban', (req, res, next) => {
    
});

module.exports = router;
