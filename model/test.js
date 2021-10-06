const mysql = require('mysql2/promise')
const config = require('./db')

let pool = mysql.createPool(config)

module.exports.getConnection = ()=>{
    return pool;
}

module.exports.executePreparedStatement = async (sql, params)=>{
    try{
        const [rows, fields] = await pool.execute(
                sql, 
                params
            );
        return rows;
    } catch(err){
        console.log(err);
        return null;
    }
}