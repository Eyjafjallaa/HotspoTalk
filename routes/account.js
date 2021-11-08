var express = require('express');
var router = express.Router();
var db = require('../model/db');
var jwt = require('jsonwebtoken')
const crypto = require('crypto');
const secret = require('../config/tokenkey');
const encrypts= require('../config/pwKey');
const decode = require('../middleware/token');

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
                    [req.body.id, key.toString('base64'), req.body.devToken, salt]);
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
            sub: req.body.id,
            iat: new Date().getTime() / 1000
        };
            let token = jwt.sign(user, secret, {
            expiresIn: "32H"
        })
        res.status(200).json({token:token});
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
      res.status(201).json({token:token});
    } catch(e) {
      console.log(e);
      res.status(401).json(e);
    }
  }
  
  
  function hashPassword(salt, password) {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, encrypts.iterations, encrypts.keylen,encrypts.digest, (err, key) => {
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

router.get('/:id', async(req, res, next) => {
  const sql= "SELECT * FROM account WHERE id = ?";
  const params = [req.params.id];
  try {
    var c =await db.executePreparedStatement(sql,params)
    if(c.length>0){
      res.status(400).json({msg:'이미 존재하는 아이디입니다.'});
    }
    else{
      res.status(200).json();
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

router.delete('/ban', (req, res, next) => {
  
});


router.put('/device', decode, async(req, res) => {
  let deviceToken = req.body.deviceToken;
  let id = req.token.sub;
  let sql = "UPDATE account SET DevToken = ? WHERE id = ?";
  let param = [deviceToken, id];

  await db.executePreparedStatement(sql, param);

  res.status(201).json({
    msg : "OK"
  })
})

router.post('/autoLogin', decode, async(req, res) => {
  try {
    const userId = req.token.sub;
  
    let sql = `SELECT id FROM account WHERE id = ?`;
    let param = [userId];
  
    let result = await db.executePreparedStatement(sql, param);
    if (userId == result[0].id) {
      res.status(200).json({msg : "OK"});
    } else {
      res.status(403).json({msg : "FAIL"});
    }
  } catch (error) {
    console.log(error);
    res.status(400).json(error);
  }

})

module.exports = router;
            