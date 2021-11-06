const jwt = require('jsonwebtoken')
const secret = require('../config/tokenkey')

const socketTokendecode = (token) => {
    //console.log(req.get('authorization'))
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, data) => {
            if(err){
                reject(err);
            }
            resolve(data.sub);
        })
    })
}

module.exports = socketTokendecode;