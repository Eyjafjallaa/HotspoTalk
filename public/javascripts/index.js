$(()=>{
   var socket = io();
   socket.on('test', function(msg) {
      console.log(msg) 
   });

   $('#submit').on('click', ()=>{
      const room = $('#roomnum').val();
      const nickname = $('#nickname').val();
      const msg = $('#msg').val();
      //console.log(room,nickname,msg)
      socket.emit('testsend',{
         room,nickname,msg
      });
      socket.on('testserver',(test)=>{
         console.log(test);
      })
   });
});
