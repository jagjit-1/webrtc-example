import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import socketIO from "socket.io-client";
import { Video } from "./Video";

const peerConnectionConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
}

const connections = {};

function MeetingPage() {
    const { roomId } = useParams();
    const [socket, setSocket] = useState();
    const [videoStream, setVideoStream] = useState({});
    const [userVideoStream, setUserVideoStream] = useState();
    const [meetingJoined, setMeetingJoined] = useState(false);


    useEffect(() => {
        const s = socketIO.connect("http://localhost:3000");
        s.on("connect", () => {
            setSocket(s);
            window.navigator.mediaDevices
                .getUserMedia({
                    video: true,
                })
                .then(async (stream) => {
                    setUserVideoStream(stream);
                    s.on("requestHandshake", async ({ description, sourceUser }) => {
                        const pc = new RTCPeerConnection(peerConnectionConfig);
                        connections[sourceUser] = pc;
                        pc.addTrack(stream.getVideoTracks()[0]);
                        pc.onicecandidate = ({ candidate }) => {
                            socket.emit("iceCandidate", { candidate, targetUser: sourceUser });
                        }
                        pc.setRemoteDescription(description);
                        pc.ontrack = (e) => {
                            setVideoStream((prevVideoStream) => {
                                const newVideoStream = { ...prevVideoStream };
                                newVideoStream[sourceUser] = new MediaStream([e.track]);
                                return newVideoStream;
                            });
                        }
                        s.on("iceCandidate", ({ candidate }) => {
                            pc.addIceCandidate(candidate);
                        });

                        pc.onicecandidate = ({ candidate }) => {
                            s.emit("iceCandidateReply", { candidate, targetUser: sourceUser });
                        };
                        await pc.setLocalDescription(await pc.createAnswer());
                        s.emit("acceptHandshake", { targetUser: sourceUser, description: pc.localDescription });
                    })
                });

            s.on("userDisconnect", ({ sourceUser }) => {
                console.log("disconnect", sourceUser, videoStream[sourceUser])
                if (connections[sourceUser].connectionState !== "closed") connections[sourceUser].close();
                delete connections[sourceUser];
                setVideoStream(prevVideoStream => {
                    delete prevVideoStream[sourceUser];
                    return { ...prevVideoStream };
                })
            })

            s.on("acceptHandshake", async ({ description, sourceUser }) => {
                // other users accept our request when we join
                connections[sourceUser].setRemoteDescription(description);
                connections[sourceUser].ontrack = (e) => {
                    setVideoStream((prevVideoStream) => {
                        const newVideoStream = { ...prevVideoStream };
                        newVideoStream[sourceUser] = new MediaStream([e.track]);
                        return newVideoStream;
                    });
                }
                s.on("iceCandidate", ({ candidate, sourceUser }) => {
                    connections[sourceUser].addIceCandidate(candidate);
                });

                connections[sourceUser].onicecandidate = ({ candidate }) => {
                    s.emit("iceCandidateReply", { candidate, targetUser: sourceUser });
                };
            })
        })
    }, []);

    useEffect(() => {
        const handleJoinMetting = async () => {
            try {
                socket.emit("join", { roomId });

                const res = await fetch("http://localhost:3000/meeting/users/123");
                const result = await res.json();
                console.log("users in room", result)
                result.users.map(async user => {
                    if (user !== socket.id) {
                        const pc = new RTCPeerConnection(peerConnectionConfig);
                        connections[user] = pc;
                        pc.onicecandidate = ({ candidate }) => {
                            socket.emit("iceCandidate", { candidate, targetUser: user });
                        }
                        pc.addTrack(userVideoStream.getVideoTracks()[0]);
                        await pc.setLocalDescription(await pc.createOffer());
                        socket.emit("requestHandshake", { description: pc.localDescription, targetUser: user })
                    }
                })
            } catch (error) {
                console.log(error)
            }
        }
        if (meetingJoined) handleJoinMetting()
    }, [meetingJoined])



    if (!meetingJoined) {
        return <button onClick={() => setMeetingJoined(true)}>join meeting for room id -123</button>
    }
    console.log(videoStream, connections)
    return <div>
        <div>Meeting Room</div>

        <div>
            {Object.keys(videoStream).map(user => <Video key={user} user={user} stream={videoStream[user]} />)}
        </div>
    </div>
}



export default MeetingPage;