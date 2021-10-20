var express = require('express');
const decode = require('../middleware/token');
var router = express.Router();

router.get('/', (req, res) => {
    let title = req.query.title;
    let body = req.query.body;

    
})

module.exports = router;