const mysql = require('mysql');

var pool = mysql.createConnection({
    connectTimeout:10,
    host:'10.80.161.222',
    port:'3306',
    user:'hotspotalk',
    password:'1234',
    database : 'hotsix'
});

module.exports=pool;