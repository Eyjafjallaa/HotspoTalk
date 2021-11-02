$(()=>{
   var socket = io();
   socket.on('test', function(msg) {
      console.log(msg) 
   });

   socket.on('testserver',(data)=>{
      console.log(data);
   });

   $('#join').on('click',()=>{
      var room =$('#roomnum').val();
      socket.emit('onload',{
         room
      })
      console.log('joined');
   })

   $('#leave').on('click',()=>{
      var room = $('#roomnum').val();
      socket.emit('unload',{
         room
      });
      console.log('leaved');
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
