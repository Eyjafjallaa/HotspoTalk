var express = require('express');
var router = express.Router();
var db = require('../model/db');
var jwt = require('jsonwebtoken')
const crypto = require('crypto');
const secret = require('../config/tokenkey');

/* GET users listing. */
router.post('/signup', async (req, res, next)=> {
    var c = await db.executePreparedStatement("SELECT * from account",[]);
    console.log(c);
    /*
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
    */
});


router.post('/login', async (req, res, next) => {
  const id = req.body.id;
  const password = req.body.password;
  
  let sql = "SELECT salt FROM account WHERE id = ?";
  const param = [id];
  let result = await db.executePreparedStatement(sql, param);
  let salt = result[0].salt;


  
  const idPasswordSql = async(key) => {
    result = await db.executePreparedStatement("SELECT id, password FROM account WHERE id = ? AND password = ?", [key, id]);
    console.log(result);
  }
  
  
  function hashPassword(salt, password) {
    return new Promise((resolve, reject) => {
      const iterations = 256;
      const keylen = 64;
      const digest = 'sha512';
      
      crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, key) => {
        if (err) {
          reject(err);
        } else {
          resolve(key.toString('base64'));
        }
      })
    });
  }
  hashPassword(salt, password).then(idPasswordSql)
});

router.get('/:id', (req, res, next) => {
  
});

router.delete('/ban', (req, res, next) => {
  
});

module.exports = router;
            