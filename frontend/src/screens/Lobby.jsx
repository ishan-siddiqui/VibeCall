import React, { useCallback, useState, useEffect } from "react"
import { useSocket } from "../context/SocketProvider"
import { useNavigate } from "react-router-dom"

function LobbyScreen() {
    const [email,setEmail] = useState('')
    const[room,setRoom] = useState('')

    const socket = useSocket()
    const navigate = useNavigate()

    const handleSubmitForm = useCallback((e) => {
        e.preventDefault()
        // console.log({ email,room })
    },
    [email,room]
    )

    const handleJoinRoom = useCallback(() => {
        socket.emit('room:join',{email, room})
        navigate(`/room/${room}`)
    },[email, room, navigate, socket])

    useEffect(()=>{
        socket.on('room:join', handleJoinRoom )
        return () =>{
            socket.off("room:join", handleJoinRoom)
        }
    },[socket, handleJoinRoom])

    return(
        <div>
            <h1>Lobby</h1>
            <form onSubmit={handleSubmitForm}>
                <label htmlFor="emailId">Email ID</label>
                <input 
                    type="email"
                    id="emailId" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                />
                <br />
                <label htmlFor="roomId">Room ID</label>
                <input 
                    type="text"
                    id="roomId" 
                    value={room} 
                    onChange={(e) => setRoom(e.target.value)}
                />
                <br />
                <button onClick={handleJoinRoom}>Join</button>
            </form>
        </div>
    )
} 

export default LobbyScreen 
