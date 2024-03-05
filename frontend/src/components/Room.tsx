import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Socket, io } from "socket.io-client";
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "./ui/input";
import { Location } from "./assets/location";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import "./ui/spinner.css";
import Chat from "./Chat";
import ScrollToBottom from "react-scroll-to-bottom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

import { Gender } from "./assets/gender";

// import {
//     ResizableHandle,
//     ResizablePanel,
//     ResizablePanelGroup,
// } from "@/components/ui/resizable"

import {
    Cloud,
    CreditCard,
    Github,
    Keyboard,
    LifeBuoy,
    LogOut,
    Mail,
    MessageSquare,
    Plus,
    PlusCircle,
    Settings,
    User,
    UserPlus,
    Users,
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { log } from "console";


const URL = "http://localhost:3000";


export const Room = ({
    name,
    localAudioTrack,
    localVideoTrack
}: {
    name: string,
    localAudioTrack: MediaStreamTrack | null,
    localVideoTrack: MediaStreamTrack | null,
}) => {
    const [lobby, setLobby] = useState(true);
    const [socket, setSocket] = useState<null | Socket>(null);
    const [sendingPc, setSendingPc] = useState<null | RTCPeerConnection>(null);
    const [receivingPc, setReceivingPc] = useState<null | RTCPeerConnection>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>();
    const localVideoRef = useRef<HTMLVideoElement>();

    // // Message list state
    const [messageList, setMessageList] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const socket = io(URL);
        socket.on('send-offer', async ({ roomId }) => {
            console.log("sending offer");
            setLobby(false);
            const pc = new RTCPeerConnection();

            setSendingPc(pc);
            if (localVideoTrack) {
                console.error("added tack");
                console.log(localVideoTrack)
                pc.addTrack(localVideoTrack)
            }
            if (localAudioTrack) {
                console.error("added tack");
                console.log(localAudioTrack)
                pc.addTrack(localAudioTrack)
            }

            pc.onicecandidate = async (e) => {
                console.log("receiving ice candidate locally");
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "sender",
                        roomId
                    })
                }
            }

            pc.onnegotiationneeded = async () => {
                console.log("on negotiation neeeded, sending offer");
                const sdp = await pc.createOffer();
                //@ts-ignore
                pc.setLocalDescription(sdp)
                socket.emit("offer", {
                    sdp,
                    roomId
                })
            }
        });


        socket.on('message', (message) => {
            setMessageList(prevMessages => [...prevMessages, message]);
        });

        socket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
            console.log("received offer");
            setLobby(false);
            const pc = new RTCPeerConnection();
            pc.setRemoteDescription(remoteSdp)
            const sdp = await pc.createAnswer();
            //@ts-ignore
            pc.setLocalDescription(sdp)
            const stream = new MediaStream();
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }

            setRemoteMediaStream(stream);
            // trickle ice 
            setReceivingPc(pc);
            window.pcr = pc;
            pc.ontrack = (e) => {
                alert("ontrack");
                // console.error("inside ontrack");
                // const {track, type} = e;
                // if (type == 'audio') {
                //     // setRemoteAudioTrack(track);
                //     // @ts-ignore
                //     remoteVideoRef.current.srcObject.addTrack(track)
                // } else {
                //     // setRemoteVideoTrack(track);
                //     // @ts-ignore
                //     remoteVideoRef.current.srcObject.addTrack(track)
                // }
                // //@ts-ignore
                // remoteVideoRef.current.play();
            }

            pc.onicecandidate = async (e) => {
                if (!e.candidate) {
                    return;
                }
                console.log("omn ice candidate on receiving seide");
                if (e.candidate) {
                    socket.emit("add-ice-candidate", {
                        candidate: e.candidate,
                        type: "receiver",
                        roomId
                    })
                }
            }

            socket.emit("answer", {
                roomId,
                sdp: sdp
            });
            setTimeout(() => {
                const track1 = pc.getTransceivers()[0].receiver.track
                const track2 = pc.getTransceivers()[1].receiver.track
                console.log(track1);
                if (track1.kind === "video") {
                    setRemoteAudioTrack(track2)
                    setRemoteVideoTrack(track1)
                } else {
                    setRemoteAudioTrack(track1)
                    setRemoteVideoTrack(track2)
                }
                //@ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track1)
                //@ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track2)
                //@ts-ignore
                remoteVideoRef.current.play();
                // if (type == 'audio') {
                //     // setRemoteAudioTrack(track);
                //     // @ts-ignore
                //     remoteVideoRef.current.srcObject.addTrack(track)
                // } else {
                //     // setRemoteVideoTrack(track);
                //     // @ts-ignore
                //     remoteVideoRef.current.srcObject.addTrack(track)
                // }
                // //@ts-ignore
            }, 5000)
        });

        socket.on("answer", ({ roomId, sdp: remoteSdp }) => {
            setLobby(false);
            setSendingPc(pc => {
                pc?.setRemoteDescription(remoteSdp)
                return pc;
            });
            console.log("loop closed");
        })

        socket.on("lobby", () => {
            setLobby(true);
        })

        socket.on("add-ice-candidate", ({ candidate, type }) => {
            console.log("add ice candidate from remote");
            console.log({ candidate, type })
            if (type == "sender") {
                setReceivingPc(pc => {
                    if (!pc) {
                        console.error("receicng pc nout found")
                    } else {
                        console.error(pc.ontrack)
                    }
                    pc?.addIceCandidate(candidate)
                    return pc;
                });
            } else {
                setSendingPc(pc => {
                    if (!pc) {
                        console.error("sending pc nout found")
                    } else {
                        // console.error(pc.ontrack)
                    }
                    pc?.addIceCandidate(candidate)
                    return pc;
                });
            }
        })


        setSocket(socket)
    }, [name])

    useEffect(() => {
        if (localVideoRef.current) {
            if (localVideoTrack) {
                localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
                localVideoRef.current.play();
            }
        }
    }, [localVideoRef])


    const { toast } = useToast()

    const handlelLocationSelect = (selectedLocation: string) => {
        toast({
            title: "Location Changed Successfully!",
            description: `switched to ${selectedLocation}`,
        });
    }

    const handleGenderSelect = (selectedGender: any) => {
        toast({
            title: "Gender Changed Successfully!",
            description: `switched to ${selectedGender}`, // Use selectedGender as description
        });
    };

    const [customizePanel, setCustomizePanel] = useState(false);

    useEffect(() => {
        const checked = (customizePanel: boolean) => {
            const parentElement = document.getElementById('customise');
            if (customizePanel === true && parentElement) {

                // Iterate through child elements and log their HTML content
                Array.from(parentElement.children).forEach(child => {
                    if (customizePanel === true) {
                        child.setAttribute('data-state', "checked");
                        alert('checked')
                    } else {
                        child.setAttribute('data-state', "unchecked");
                    }

                });
            }
        }
        checked(customizePanel);
    }, [customizePanel]);

    //Chat



    const sendMessage = () => {
        if (message.trim() !== '' && socket) {
            const currentTime = new Date().toLocaleTimeString();
            const newMessage = {
                user: name,
                content: message,
                time: currentTime
            };
            socket.emit('message', newMessage);
            setMessage('');
            // Add the new message to the messageList to display it for the current user
            setMessageList([...messageList, newMessage]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };


    return <>
        <div className="flex flex-col w-full h-full p-1">
            {/* Hi {name} */}
            <Toaster />

            <div className="flex flex-row w-full gap-3 items-center">


                {/* video div resizable 1 */}
                <ResizablePanelGroup direction="horizontal" className="max-h-[30%] rounded-lg border">
                    <ResizablePanel defaultSize={50}>
                        <div className="flex h-full w-full items-center justify-center" >
                            <video autoPlay className="w-full h-full" ref={localVideoRef} />
                        </div>
                    </ResizablePanel>
                    {customizePanel && <ResizableHandle withHandle />}
                    <ResizablePanel defaultSize={50}>

                        {/* Profile */}
                        <div className="absolute right-0 p-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Avatar onClick={() => alert("works")}>
                                        <AvatarImage src="https://github.com/shadcn.png" />
                                        <AvatarFallback>CN</AvatarFallback>
                                    </Avatar>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem>
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setCustomizePanel(!customizePanel)} >
                                            <CreditCard className="mr-2 h-4 w-4" />

                                            <>
                                                <span htmlFor="customise" data-state={customizePanel ? "checked" : "unchecked"}>Customise</span>
                                                <Switch id="customise" className="ml-2" aria-checked={customizePanel ? "true" : "false"} data-state={customizePanel ? "checked" : "unchecked"} />
                                            </>
                                            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>

                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Settings</span>
                                            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Keyboard className="mr-2 h-4 w-4" />
                                            <span>Keyboard shortcuts</span>
                                            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem>
                                            <Users className="mr-2 h-4 w-4" />
                                            <span>Team</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                <span>Invite users</span>
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuSubContent>
                                                    <DropdownMenuItem>
                                                        <Mail className="mr-2 h-4 w-4" />
                                                        <span>Email</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <MessageSquare className="mr-2 h-4 w-4" />
                                                        <span>Message</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem>
                                                        <PlusCircle className="mr-2 h-4 w-4" />
                                                        <span>More...</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuSubContent>
                                            </DropdownMenuPortal>
                                        </DropdownMenuSub>
                                        <DropdownMenuItem>
                                            <Plus className="mr-2 h-4 w-4" />
                                            <span>New Team</span>
                                            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                        <Github className="mr-2 h-4 w-4" />
                                        <span>GitHub</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <LifeBuoy className="mr-2 h-4 w-4" />
                                        <span>Support</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled>
                                        <Cloud className="mr-2 h-4 w-4" />
                                        <span>API</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                        <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Secondary Video */}
                        <div className="flex h-full w-full items-center justify-center flex-col">
                            <div className="h-full my-auto flex items-center justify-center ">
                                {lobby ? <div className="spinner-container"><div className="spinner"></div> </div> : <video autoPlay className="w-full" ref={remoteVideoRef} />}
                            </div>
                            
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>



            </div>
            <div className="flex py-5 h-full w-full">
                <div className="flex w-1/2 gap-x-5">
                    <Button className="p-10">Next</Button>
                    <Button className="p-10">Stop</Button>
                    <><Location onLocationSelect={handlelLocationSelect} /></>
                    <><Gender onGenderSelect={handleGenderSelect} /></>
                </div>
                
                <div className="w-1/2">

                                <div className="grid w-full gap-1.5">

                                    <h1>messages</h1>

                                    <div className="flex flex-col w-full h-full p-1">
                                        <ScrollToBottom className="max-h-20 overflow-y-auto">
                                            <div style={{ boxShadow: "rgba(17, 17, 26, 0.1) 0px 1px 0px, rgba(17, 17, 26, 0.1) 0px 8px 24px, rgba(17, 17, 26, 0.1) 0px 16px 48px" }}>
                                                {messageList.map((msg, index) => (
                                                    // <div key={index}>{msg} sent by {name}</div>
                                                    <div key={index} className="flex ">
                                                        {msg.user === name ?
                                                            <div className="ml-auto">
                                                                <strong>You:</strong> {msg.content} ({msg.time})
                                                            </div>
                                                            :
                                                            <div>
                                                                <strong>{msg.user}:</strong> {msg.content} ({msg.time})
                                                            </div>
                                                        }
                                                    </div>
                                                ))}


                                            </div>
                                        </ScrollToBottom>
                                        <Textarea
                                            placeholder="Enter text and hit Enter"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                        />
                                    </div>

                                    <p className="text-sm text-muted-foreground">
                                        Your message will be copied to the support team.
                                    </p>
                                </div>

                            </div>
            </div>
        </div>
    </>
}

