import { useRef, useEffect } from "react";

export const Video = ({ user, stream, videoStyle }) => {
    console.log(user, stream)
    const videoRef = useRef();
    useEffect(() => {
        if (videoRef && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [videoRef, stream])

    return (
        <div>
            {user ? <p>video for {user}</p> : null}
            <div>
                <video style={{ borderRadius: 10, width: 200, height: 200, ...videoStyle }} ref={videoRef} muted width="100%" autoPlay={true} playsInline={true} />
            </div>
        </div>
    )
}