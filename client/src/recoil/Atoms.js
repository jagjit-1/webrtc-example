import { atom } from "recoil";

const localVideoStreamState = atom({
    key: "localVideoStream",
    default: null
});

const localVideoState = atom({
    key: "localVideo",
    default: true
})

const localAudioState = atom({
    key: "localAudio",
    default: true
})

const meetingJoinedState = atom({
    key: "meetingJoined",
    default: false
});


const meetingLoadingState = atom({
    key: "meetingLoadingState",
    default: false
})

const remoteVideoStreamsState = atom({
    key: "remoteVideoStreams",
    default: {}
})

export {
    localVideoStreamState,
    meetingJoinedState,
    meetingLoadingState,
    remoteVideoStreamsState,
    localVideoState,
    localAudioState
};


