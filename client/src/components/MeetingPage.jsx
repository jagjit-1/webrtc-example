import { useState, useEffect } from "react";

import { Video } from "./Video";
import { Typography, Box, Button, Grid } from "@mui/material";
import CallEndIcon from '@mui/icons-material/CallEnd';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import PreMeeting from "./PreMeeting";
import { useRecoilState, useRecoilValue, useResetRecoilState } from "recoil";
import { localVideoState, localVideoStreamState, meetingJoinedState, remoteVideoStreamsState } from "../recoil/Atoms";


const meetingConnections = {}

function MeetingPage() {
    const [localVideoStream, setLocalVideoStream] = useRecoilState(localVideoStreamState);
    const meetingJoined = useRecoilValue(meetingJoinedState);
    const remoteVideoStreams = useRecoilValue(remoteVideoStreamsState);
    const localVideo = useRecoilValue(localVideoState);


    useEffect(() => {
        console.log(localVideo)
        if (localVideo) {
            window.navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
                setLocalVideoStream(stream);
            });
        }
        else {
            if (localVideoStream) {
                localVideoStream.getTracks().forEach((track) => {
                    console.log(track, "unmonted")
                    track.stop();
                });
            }
            setLocalVideoStream(null);
        }
        return () => {
            if (localVideoStream) {
                localVideoStream.getTracks().forEach((track) => {
                    console.log(track, "unmonted")

                    track.stop();

                });
            }
        }
    }, [localVideo])


    if (!meetingJoined) {
        // return <Box sx={{ margin: "40px auto 10px auto", maxWidth: "70%", textAlign: "center" }}>
        //     <Typography variant="h2">Camera Preview</Typography>
        //     <br />
        //     <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-evenly" }}>
        //         <Video videoStyle={{ width: 500, height: "auto" }} stream={userVideoStream ? userVideoStream : null} />
        //         <Button onClick={() => setMeetingJoined(true)} style={{ width: 300, height: 50 }} variant="contained">Join Meeting</Button>
        //     </Box>
        // </Box>
        return <PreMeeting meetingConnections={meetingConnections} />
    }
    const handleEndCall = () => {
        console.log("call end to be handled")
    }
    console.log(remoteVideoStreams, meetingConnections)
    return <Box sx={{ width: "100%", height: "100%" }}>
        <div>Meeting Room Joined!</div>

        <Grid container spacing={6}>
            {Object.keys(remoteVideoStreams).map(user => <Grid key={user} item xs={4} md={3}>
                <Video user={user} videoStyle={{ width: 500, height: "auto" }} stream={remoteVideoStreams[user]} />
            </Grid>)}
        </Grid>
        <Box sx={{ position: "absolute", bottom: 0, right: 20 }}>
            <Video videoStyle={{ height: 200, width: 200 }} stream={localVideoStream} />
        </Box>
        <Box sx={{ position: "absolute", color: "white", width: "40%", bottom: 20, left: 0, right: 0, height: "55px", margin: "auto", borderRadius: "10px", backgroundColor: "#282424", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
            {localVideo ? <VideocamIcon style={{ cursor: "pointer" }} /> : <VideocamOffIcon style={{ cursor: "pointer" }} />}
            <CallEndIcon onClick={handleEndCall} style={{ cursor: "pointer" }} />
        </Box>
    </Box>
}



export default MeetingPage;