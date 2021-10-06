var express = require('express');
var router = express.Router();
var db = require('../model/db');
var jwt = require('jsonwebtoken')
const crypto = require('crypto');
const secret = require('../config/tokenkey');

/* GET users listing. */
router.post('/signup', async (req, res, next)=> {
    const saltcreate = () => {
        const promise = new Promise((resolve, reject) => {
            crypto.randomBytes(64, (err, buf) => {
                if (err) reject(err)
                else {
                    resolve(buf.toString("base64"));
                }
            })
        })
        return promise;
    }
    
    const encrypt = (salt)=>{
        const promise = new Promise ((resolve,reject)=>{
            console.log(salt);
            crypto.pbkdf2(req.body.password,salt,256,64,"sha512",async (err,key)=>{
                if(err) reject(err);
                try {
                    await db.executePreparedStatement("INSERT INTO account(id, password, Devtoken,salt) values(?, ?, ?, ?)",
                    [req.body.id, req.body.password, req.body.Devtoken, salt]);
                } catch (error) {
                    reject(error);   
                }
                resolve();
            })
        })
        return promise;
    }

    const respond = ()=>{
        let user = {
            sub: req.body.userid,
            iat: new Date().getTime() / 1000
        };
        let token = jwt.sign(user, secret, {
            expiresIn: "32H"
        })
        res.status(200).json({logintoken:token});
    }

    const error = (err)=>{
        res.status(400).json(err);
    }
    saltcreate()
    .then(encrypt)
    .then(respond)
    .catch(error);
});


router.post('/login', async (req, res, next) => {
  const id = req.body.id;
  const password = req.body.password;
  
  let sql = "SELECT salt FROM account WHERE id = ?";
  const param = [id];
  let result = await db.executePreparedStatement(sql, param);
  if(result.length == 0) {
    res.status(401).json({
      msg : "일치하는 아이디가 없습니다."
    })
    return;
  }
  
  let salt = result[0].salt;


  
  const idPasswordSql = async(key) => {
    try{
      result = await db.executePreparedStatement("SELECT id FROM account WHERE id = ? AND password = ?", [id, key]);
      if(result.length == 0) {
        throw({msg : "아이디와 비밀번호가 일치하지 않습니다."})
      }
      let user = {
        sub: result[0].id,
        iat: new Date().getTime() / 1000
      };
      let token = jwt.sign(user, secret, {
        expiresIn: "32H"
      })
      res.status(201).json({logintoken:token});
    } catch(e) {
      console.log(e);
      res.status(401).json(e);
    }
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
  hashPassword(salt, password)
  .then(idPasswordSql)
  .catch((err) => {
    res.status(401).json({err});
  })
});

router.get('/:id', (req, res, next) => {
  
});

router.delete('/ban', (req, res, next) => {
  
});

module.exports = router;
            