import { useRef, useEffect } from "react";

export const Video = ({ user, stream, videoStyle }) => {
    const videoRef = useRef();
    useEffect(() => {
        if (videoRef && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [videoRef, stream])

    return (
        <div>
            {user ? <p>video for {user}</p> : null}
            {stream ?
                <div>
                    <video style={{ borderRadius: 10, width: 200, height: 200, ...videoStyle }} ref={videoRef} muted autoPlay={true} playsInline={true} />
                </div> : <div>No Video Available</div>}
        </div>
    )
}