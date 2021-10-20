var express = require('express');
var router = express.Router();
var db = require('../model/db');
var jwt = require('jsonwebtoken')
const crypto = require('crypto');
const secret = require('../config/tokenkey');
const encrypts= require('../config/pwKey');
const decode = require('../middleware/token');

router.get('/',(req,res)=>{
    res.render('index');
})

module.exports = router;