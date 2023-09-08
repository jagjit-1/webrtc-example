import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import socketIO from "socket.io-client";
import { Video } from "./Video";
import { Typography, Box, Button, Grid } from "@mui/material";

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
        return () => s.close()
    }, []);

    useEffect(() => {
        return () => {
            if (userVideoStream) {
                userVideoStream.getTracks().forEach((track) => {
                    console.log(track, "unmonted")

                    track.stop();

                });
            }
        }
    }, [userVideoStream])

    useEffect(() => {
        const handleJoinMetting = async () => {
            try {
                socket.emit("join", { roomId });

                const res = await fetch("http://localhost:3000/meeting/users/" + roomId);
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
        return <Box sx={{ margin: "40px auto 10px auto", maxWidth: "70%", textAlign: "center" }}>
            <Typography variant="h2">Camera Preview</Typography>
            <br />
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-evenly" }}>
                <Video videoStyle={{ width: 500, height: "auto" }} stream={userVideoStream ? userVideoStream : null} />
                <Button onClick={() => setMeetingJoined(true)} style={{ width: 300, height: 50 }} variant="contained">Join Meeting</Button>
            </Box>

        </Box>
    }
    console.log(videoStream, connections)
    return <Box>
        <div>Meeting Room</div>

        <Grid container spacing={6}>
            {Object.keys(videoStream).map(user => <Grid key={user} item xs={4} md={3}>
                <Video user={user} videoStyle={{ width: 500, height: "auto" }} stream={userVideoStream ? userVideoStream : null} />
            </Grid>)}
        </Grid>
    </Box>
}



export default MeetingPage;