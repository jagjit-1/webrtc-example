import { useEffect } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { localVideoState, localVideoStreamState, meetingJoinedState, meetingLoadingState, remoteVideoStreamsState } from "../recoil/Atoms";
import { Box, Typography, Button } from "@mui/material";
import { useParams } from "react-router-dom";
import socketIO from "socket.io-client";
import { Video } from "./Video";

const peerConnectionConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
}

function PreMeeting({ meetingConnections }) {
    const localVideoStream = useRecoilValue(localVideoStreamState);
    const setMeetingJoined = useSetRecoilState(meetingJoinedState);
    const setVideoState = useSetRecoilState(localVideoState);
    const setLoadingMeeting = useSetRecoilState(meetingLoadingState);
    const [remoteVideoStreams, setRemoteVideoStreams] = useRecoilState(remoteVideoStreamsState);
    const { roomId } = useParams();

    const setUpConnections = async () => {
        const s = await socketIO.connect("http://localhost:3000");
        s.on("connect", () => {
            s.on("requestHandshake", async ({ description, sourceUser }) => {
                const pc = new RTCPeerConnection(peerConnectionConfig);
                if (localVideoStream) pc.addTrack(localVideoStream.getVideoTracks()[0]);
                pc.onicecandidate = ({ candidate }) => {
                    s.emit("iceCandidate", { candidate, targetUser: sourceUser });
                }
                pc.setRemoteDescription(description);
                pc.ontrack = (e) => {
                    setRemoteVideoStreams((prevVideoStream) => {
                        return { ...prevVideoStream, [sourceUser]: new MediaStream([e.track]) };
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
                meetingConnections[sourceUser] = pc;
            })
            s.on("userDisconnect", ({ sourceUser }) => {
                console.log("disconnect", sourceUser, remoteVideoStreams[sourceUser])
                if (meetingConnections[sourceUser].connectionState !== "closed") meetingConnections[sourceUser].close();
                delete meetingConnections[sourceUser];
                setRemoteVideoStreams(prevVideoStream => {
                    return { ...prevVideoStream, [sourceUser]: null };
                })
            })

            s.on("acceptHandshake", async ({ description, sourceUser }) => {
                // other users accept our request when we join
                console.log(meetingConnections, sourceUser)
                const pc = meetingConnections[sourceUser];
                pc.setRemoteDescription(description);
                pc.ontrack = (e) => {
                    setRemoteVideoStreams((prevVideoStream) => {
                        return { ...prevVideoStream, [sourceUser]: new MediaStream([e.track]) };
                    });
                }
                s.on("iceCandidate", ({ candidate, sourceUser }) => {
                    pc.addIceCandidate(candidate);
                });

                pc.onicecandidate = ({ candidate }) => {
                    s.emit("iceCandidateReply", { candidate, targetUser: sourceUser });
                };
                meetingConnections[sourceUser] = pc;
            })
        })
        return s;
    }

    const handleJoinMetting = async () => {
        try {
            setLoadingMeeting(true);
            const socket = await setUpConnections();
            socket.emit("join", { roomId });

            const res = await fetch("http://localhost:3000/meeting/users/" + roomId);
            const result = await res.json();
            console.log("users in room", result)
            await Promise.all(result.users.map(async user => {
                if (user !== socket.id) {
                    const pc = new RTCPeerConnection(peerConnectionConfig);
                    pc.onicecandidate = ({ candidate }) => {
                        socket.emit("iceCandidate", { candidate, targetUser: user });
                    }
                    if (localVideoStream) pc.addTrack(localVideoStream.getVideoTracks()[0]);
                    await pc.setLocalDescription(await pc.createOffer());
                    meetingConnections[user] = pc;
                    socket.emit("requestHandshake", { description: pc.localDescription, targetUser: user })
                }
            }));
            setMeetingJoined(true);
        } catch (error) {
            console.log(error)
        } finally {
            setLoadingMeeting(false);
            return;
        }
    }
    console.log(meetingConnections)
    return <Box sx={{ margin: "40px auto 10px auto", maxWidth: "70%", textAlign: "center" }}>
        <Typography variant="h2">Camera Preview</Typography>
        <br />
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-evenly" }}>
            <Video videoStyle={{ width: 500, height: "auto" }} stream={localVideoStream} />
            <Button onClick={handleJoinMetting} style={{ width: 300, height: 50 }} variant="contained">Join Meeting</Button>
            <Button onClick={() => setVideoState(prev => !prev)}>Toggle Video</Button>
        </Box>
    </Box>
}

export default PreMeeting;