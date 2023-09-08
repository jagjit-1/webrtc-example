import { useRef, useEffect } from "react";

export const Video = ({ user, stream }) => {
    console.log(user, stream)
    const videoRef = useRef();
    useEffect(() => {
        if (videoRef && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [videoRef, stream])

    return (
        <div>
            <p>video for {user}</p>
            <div>
                <video style={{ borderRadius: 10, width: 200, height: 200, border: "1px solid black" }} ref={videoRef} muted width="100%" autoPlay={true} playsInline={true} />
            </div>
        </div>
    )
}