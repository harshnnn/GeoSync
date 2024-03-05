import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"


export default function Home() {
    return (
        <div>
            <Button>Click me</Button>
        </div>
    )
}

import { Room } from "./Room";

export const Landing = () => {
    const [name, setName] = useState("");
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setlocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [joined, setJoined] = useState(false);

    const getCam = async () => {
        const stream = await window.navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
        // MediaStream
        const audioTrack = stream.getAudioTracks()[0]
        const videoTrack = stream.getVideoTracks()[0]
        setLocalAudioTrack(audioTrack);
        setlocalVideoTrack(videoTrack);
        if (!videoRef.current) {
            return;
        }
        videoRef.current.srcObject = new MediaStream([videoTrack])
        videoRef.current.play();
        // MediaStream
    }

    useEffect(() => {
        if (videoRef && videoRef.current) {
            getCam()
        }
    }, [videoRef]);

    if (!joined) {

        return <>
            <div className="flex">
                <div className="video-container flex flex-row mb-10 p-10">
                    <video autoPlay ref={videoRef}></video>
                </div>

                <div className="flex w-1/4 pl-10 my-auto">
                    <Input
                        type="text"
                        placeholder="name"
                        onChange={(e) => {
                            setName(e.target.value);
                        }}
                        onKeyDown={(e) =>{
                            
                            if(e.key === "Enter"){
                                setName(e.target.value);
                                setJoined(true);
                            }
                        }}
                        className="mx-10">
                    </Input>

                    <Button onClick={() => {
                        setJoined(true);
                    }}>Join</Button>
                </div>

            </div>
        </>
    }

    return <Room name={name} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} />
}