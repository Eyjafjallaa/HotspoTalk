var express = require('express');
var router = express.Router();
var db = require('../model/db');
var jwt = require('jsonwebtoken')

/* GET users listing. */
router.post('/signup', function(req, res, next) {
  
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
