const { Server } = require("socket.io")

const io = new Server(8000,{
    cors: true
})

const emailToSocketIdMap =  new Map();
const SocketIdToemailMap =  new Map();


io.on("connection", (socket) => {
    console.log(`connect ${socket.id}`);
    socket.on('room:join', data => {
        const {email, room} = data
        emailToSocketIdMap.set(email, socket.id)
        SocketIdToemailMap.set(socket.id, email)
        io.to(room).emit("user:joined", {email,id: socket.id})
        socket.join(room)
        io.to(socket.id).emit("room:join", data)
    })
    // socket.on("disconnect", (reason) => {
    //   console.log(`disconnect ${socket.id} due to ${reason}`);
    // });

    socket.on("user:call", ({to, offer})=>{
        io.to(to).emit("incoming:call",{from: socket.id, offer})
    })
    
    socket.on("to: from, ans", ({to, ans})=>{
        io.to(to).emit("call:accepted",{from: socket.id, ans})
    })

    socket.on("peer:nego:needed", ({to, offer})=>{
        io.to(to).emit("peer:nego:needed",{from: socket.id, offer})
    })

    socket.on("peer:nego:done", ({to, ans})=>{
        io.to(to).emit("peer:nego:final",{from: socket.id, ans})
    })

  });


  
