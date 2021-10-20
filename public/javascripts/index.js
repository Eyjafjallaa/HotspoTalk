$(()=>{
   var socket = io();
   socket.on('test', function(msg) {
      console.log(msg) 
   });

   socket.on('testserver',(test)=>{
      console.log(test);
   });
   
   $('#join').on('click',()=>{
      var room =$('#roomnum').val();
      socket.emit('onload',{
         room
      })
      console.log('joined');
   })

   $('#submit').on('click', ()=>{
      const room = $('#roomnum').val();
      const nickname = $('#nickname').val();
      const msg = $('#msg').val();
      //console.log(room,nickname,msg)
      socket.emit('onshot',{
         room,nickname,msg
      });

   });
});
