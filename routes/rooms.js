var express = require('express');
var router = express.Router();

router.post('/', (req, res)=>{
    res.render('index');
})

router.get('/:roomid', (req, res) => {

})

router.get('/:roomid/user', (req, res) => {

})
router.get('/:roomid/member', (req, res) => {

})
router.delete('/:roomid/exit', (req, res) => {

})

router.put('/:roomid/edit', (req, res) => {

})

router.put('/:roomid/inherit', (req, res) => {

})

router.delete('/:roomid', (req, res) => {

})

router.put('/:roomid/rename')

module.exports = router;
