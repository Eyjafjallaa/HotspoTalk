var express = require('express');
var router = express.Router();
var db = require('../model/db');
var jwt = require('jsonwebtoken')
const crypto = require('crypto');
const secret = require('../config/tokenkey')
const bkdf2Password = require('pbkdf2-password');
const hasher = bkdf2Password();

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
            name: req.body.nickname,
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
  const sql = "SELECT PW FROM Broker WHERE ID=? AND PW=?";
  const param = [req.body.id, req.password];
  let result = await db.executePreparedStatement(sql, param);
  console.log(result);

    // db.query(`SELECT PW FROM Broker WHERE ID=? AND PW=?`, [req.body.id, req.body.pw], (err, result) => {
    //     if (result[0] == undefined) {
    //         res.status(401).json({});
    //         return;
    //     }
    //     if (req.body.pw == result[0].PW) {
    //         var user = {
    //             sub: req.body.id,
    //             iat: new Date().getTime() / 1000
    //         };
    //         var token = jwt.sign(user, secret, {
    //             expiresIn: "32H"
    //         })
    //         res.status(200).json({
    //             logintoken: token,
    //         });
    //     }
    // })
});

router.get('/:id', (req, res, next) => {

});

router.delete('/ban', (req, res, next) => {
    
});

module.exports = router;
