import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from 'react-player'
import { useSocket } from "../context/SocketProvider"
import peer from "../service/peer"

const RoomPage = () => {

    const socket = useSocket()
    const [RemoteSocketId,setRemoteSocketId] = useState(null)
    const [myStream,setMyStream] = useState()
    const [remoteStream,setRemoteStream] = useState()

    const handleUserJoined = useCallback(({ email, id }) => {
      console.log(`Email ${email} joined room`);
      setRemoteSocketId(id);
    }, []);

    const handleCallUser = useCallback(async (email, id) => {
        //turn on your own video stream when calling someone
        const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true})

        //create offer to join the video stream
        const offer = await peer.getOffer()
        // send the offer to other users
        socket.emit("user:call", {to: RemoteSocketId, offer})
        setMyStream(stream)

        console.log(`Email ${email} joined room`);
        setRemoteSocketId(id);
    }, [RemoteSocketId, socket]);

    const handleIncomingCall = useCallback(
        async ({ from, offer }) => {
          setRemoteSocketId(from);
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
          setMyStream(stream);
          console.log(`Incoming Call`, from, offer);
          const ans = await peer.getAnswer(offer);
          socket.emit("call:accepted", { to: from, ans });
        },
        [socket]
      );
    
    

      const sendStreams = useCallback(() => {
        const tracks = myStream.getTracks();
        tracks.forEach((track) => {
          peer.peer.addTrack(track, myStream);
        });
      }, [myStream, peer]);
      
      

      const handleCallAccepted = useCallback(
        ({ from, ans }) => {
          peer.setLocalDescription(ans);
          console.log("Call Accepted!");
          sendStreams();
        },
        [sendStreams]
      );
    

    const handleNegoNeeded = useCallback(async() => {
        const offer = await peer.getOffer()
        socket.emit('peer:nego:needed',{offer, to: RemoteSocketId})
    },[RemoteSocketId, socket])

    const handleNegoIncoming = useCallback(async ({from,offer})=>{
        const ans = await peer.getAnswer(offer)
        socket.emit('peer:nego:done',{to: from, ans})
    },[socket])

    const handleNegoFinal = useCallback(async ({ans})=>{
        await peer.setLocalDescription(ans)
    },[])

    useEffect(() => {
        peer.peer.addEventListener("peer:nego:needed",handleNegoNeeded)
        return () => {
            peer.peer.removeEventListener("peer:nego:needed",handleNegoNeeded)

        }
    },[handleNegoNeeded])
    
    useEffect(() => {
        peer.peer.addEventListener("track", async (ev) => {
          const remoteStream = ev.streams;
          console.log("GOT TRACKS!!");
          setRemoteStream(remoteStream);
        });
      }, [])
      
    
    useEffect(() => {
        socket.on("user:joined", handleUserJoined)
        // handling incoming call on frontend
        socket.on("incoming:call", handleIncomingCall)
        //handle accepting call on frontend
        socket.on("call:accepted", (data) => handleCallAccepted(data))
        socket.on("peer:nego:needed", handleNegoIncoming)
        socket.on("peer:nego:final", handleNegoFinal)
        return () => {
            socket.off("user:joined", handleUserJoined)
            socket.off("incoming:call", handleIncomingCall)
            socket.off("call:accepted", handleCallAccepted)
            socket.off("peer:nego:needed", handleNegoIncoming)
            socket.off("peer:nego:final", handleNegoFinal)

        }
    },[socket, handleUserJoined, handleIncomingCall, handleCallAccepted, handleNegoIncoming, handleNegoFinal])

    return (
        <div>
      <h1>Room Page</h1>
      <h4>{RemoteSocketId ? "Connected" : "No one in room"}</h4>
      {myStream && <button onClick={sendStreams}>Send Stream</button>}
      {RemoteSocketId && <button onClick={handleCallUser}>CALL</button>}
      {myStream && (
        <>
          <h1>My Stream</h1>
          <ReactPlayer
            playing
            muted
            height="100px"
            width="200px"
            url={myStream}
          />
        </>
      )}
      {remoteStream && (
        <>
          <h1>Remote Stream</h1>
          <ReactPlayer
            playing
            muted
            height="100px"
            width="200px"
            url={remoteStream}
          />
        </>
      )}
    </div>
    )
}

export default RoomPage