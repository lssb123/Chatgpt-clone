
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/mainInput";
import {
    Paperclip,
    Send,
    Copy,
    ThumbsUp,
    ThumbsDown,
    RefreshCcw,
    X,
    Eye,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Check,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";
import Logo from "../assets/chankya.png";
import Bot from "../assets/bot.png";
import TypingAnimation from "./TypingAnimation";
import API from "@/services/API";

const useInitialMessage = (location, handleSend) => {
    const [initialMessageHandled, setInitialMessageHandled] = useState(false);

    const checkAndSendInitialMessage = useCallback(() => {
        if (
            !initialMessageHandled &&
            location.state?.initialMessage &&
            location.state?.shouldSendInitialMessage
        ) {
            handleSend(location.state.initialMessage, location.state.uploadedFiles);
            setInitialMessageHandled(true);
        }
    }, [location.state, handleSend, initialMessageHandled]);

    return checkAndSendInitialMessage;
};

const CodeBlock = ({ language, value }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(value)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = value;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy with fallback: ', err);
            }
            document.body.removeChild(textArea);
        }
    };


    return (
        <div className="rounded-lg overflow-hidden py-4">
            <div className="bg-gray-300 px-4 py-1 flex justify-between items-center rounded-t-md">
                <span className="text-sm font-sans text-gray-600">{language}</span>
                <Button
                    disabled
                    size="sm"
                    variant="ghost"
                    className="text-sm font-sans text-gray-600 hover:text-gray-900"
                >
                    {copied ? (
                        <div className="flex items-center gap-1">
                            <Check size={18} />
                            Copied!
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                            <ClipboardList size={16} />
                            Copy
                        </div>
                    )}
                </Button>
            </div>
            <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{
                    margin: 0,
                    borderRadius: "0 0 0.5rem 0.5rem",
                }}
            >
                {value}
            </SyntaxHighlighter>
        </div>
    );
};

export default function SessionChat({ setUpdateTrigger }) {
    const { sessionId } = useParams();
    const location = useLocation();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [copiedStates, setCopiedStates] = useState({});
    const [isTyping, setIsTyping] = useState(false);
    const [regeneratingMessageId, setRegeneratingMessageId] = useState(null);
    const [lastSentMessage, setLastSentMessage] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);
    const [initialResponseReceived, setInitialResponseReceived] = useState(false);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const chatContainerRef = useRef(null);
    const [deleteDuplicateCalled, setDeleteDuplicateCalled] = useState(false);
    const [count, setCount] = useState(0)
    // const [shouldFetchMessages, setShouldFetchMessages] = useState(false)

    const handleSend = useCallback(
        async (text = input, files = uploadedFiles) => {
            if (text.trim() && text !== lastSentMessage) {
                setLastSentMessage(text);
                const newUserMessage = {
                    id: Date.now(),
                    text: text,
                    sender: "user",
                    image: Logo,
                    uploadedFiles: files,
                };
                console.log(newUserMessage)
                setMessages((prev) => [...prev, newUserMessage]);
                setInput("");
                setUploadedFiles([]);
                setIsTyping(true);

                try {
                    const response = await API.post.chatMessages(text, sessionId, files);
                    if (response.data.messages && response.data.messages.length > 0) {
                        const lastMessage =
                            response.data.messages[response.data.messages.length - 1];
                        const answer = lastMessage.data[0].answer[0].text;

                        setIsTyping(false);

                        const newBotMessage = {
                            id: `${response.data.messageId}`,
                            text: answer,
                            sender: "bot",
                            image: Bot,
                            responses: [answer],
                            currentResponseIndex: 0,
                        };
                        // console.log(messages.length)
                        setMessages((prev) => [...prev, newBotMessage]);
                        console.log(messages)
                        if (!initialResponseReceived) {
                            setInitialResponseReceived(true);
                            try {
                                await API.put.updateTitle(sessionId);
                                setUpdateTrigger((prev) => prev + 1);
                            } catch (error) {
                                console.error("Error updating session title:", error);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error fetching bot response:", error);
                    setIsTyping(false);
                }
            }
        },
        [
            input,
            lastSentMessage,
            sessionId,
            uploadedFiles,
            initialResponseReceived,
            setUpdateTrigger,
        ]
    );


    const fetchAllMessages = useCallback(async () => {
        try {
            const response = await API.get.getShareSessionHistory(sessionId);
            console.log(response.data)
            if (response.data && response.data.messages) {
                const fetchedMessages = response.data.messages.flatMap((msg) => {
                    const userMessage = {
                        id: `${msg.data[0].messageId}-user`,
                        text: msg.data[0].text,
                        sender: "user",
                        image: Logo,
                        uploadedFiles: msg.data[0].uploadedFiles,
                    };
                    console.log(msg.data[0])
                    const botResponse = {
                        id: `${msg.data[0].messageId}`,
                        text: msg.data[0].answer[0].text,
                        sender: "bot",
                        image: Bot,
                        responses: msg.data[0].answer.map(a => a.text),
                        currentResponseIndex: 0,
                    };
                    console.log(botResponse)
                    return [userMessage, botResponse];
                });
                console.log(fetchedMessages)
                setMessages(fetchedMessages);
            }
        } catch (error) {
            console.error("Error fetching chat messages:", error);
        }
    }, [sessionId]);

    useEffect(() => {
        console.log(sessionId)
        fetchAllMessages();
    }, [fetchAllMessages]);

    const checkAndSendInitialMessage = useInitialMessage(location, handleSend);

    useEffect(() => {
        checkAndSendInitialMessage();
    }, [checkAndSendInitialMessage]);

   

    return (
        <div className="flex relative flex-col h-screen bg-background overflow-hidden">
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto px-2 sm:px-4 py-8"
            >
                <div className="w-full max-w-3xl mx-auto">
                    {console.log("Messages----------------", messages)}
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex flex-col mb-4 ${message.sender === "user" ? "items-end" : "items-start"
                                }`}
                        >
                            <div
                                className={`flex items-start ${message.sender === "bot" ? "flex-row justify-center" : "flex-row-reverse"
                                    } ${
                                        message.sender === "bot" ? "max-w-full sm:max-w-[100%] md:max-w-[100%] lg:max-w-[100%]" : "max-w-full sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%]"
                                      }`}
                            >
                                <img
                                    src={message.image}
                                    alt="Profile"
                                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${message.sender === "bot" ? "mr-2" : "ml-2"
                                        }`}
                                />
                                <div
                                    className={`p-2 sm:p-3 rounded-lg ${message.sender === "user"
                                            ? "bg-[#2368a0] text-white"
                                            : "bg-transparent text-black"
                                        } break-words`}
                                        style={{
                                            maxWidth: message.sender === "bot" ? "100%" : "80%",
                                            width: "fit content"
                                          }}
                                >
                                    {message.sender === "user" && message.uploadedFiles &&
                                        message.uploadedFiles.map((file) => (
                                            <img
                                                src={file.preview || `data:${file.type};base64,${file.base64}`}
                                                alt="Uploaded"
                                                className="mt-2 max-w-full h-auto rounded "
                                            />
                                        ))}
                                    {message.sender === "bot" &&
                                        regeneratingMessageId === message.id ? (
                                        <TypingAnimation />
                                    ) : message.sender === "bot" ? (
                                        <ReactMarkdown
                                            className="text-xs sm:text-sm markdown-content"
                                            components={{
                                                code({ node, inline, className, children, ...props }) {
                                                    const match = /language-(\w+)/.exec(className || "");
                                                    return !inline && match ? (
                                                        <CodeBlock
                                                            language={match[1]}
                                                            value={String(children).replace(/\n$/, "")}
                                                        />
                                                    ) : (
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    );
                                                },
                                            }}
                                        >
                                            {message.text}
                                        </ReactMarkdown>
                                    ) : (
                                        <p className="text-xs sm:text-sm mt-2">{message.text}</p>
                                    )}
                                    
                                        
                                </div>
                            </div>
                            {message.sender === "bot" && (
                                <div className="flex mt-2 ml-10 space-x-2 items-center">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    disabled
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 p-1"
                                                >
                                                    <Copy
                                                        className={`h-4 w-4 ${copiedStates[message.id]
                                                                ? "text-green-500"
                                                                : "text-gray-400"
                                                            }`}
                                                    />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Copy</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    {message.responses && message.responses.length > 1 && (
                                        <>
                                            <Button
                                                disabled
                                                size="icon"
                                                variant="ghost"

                                                className="h-6 w-6 p-1"
                                            >
                                                <ChevronLeft className="h-4 w-4 text-gray-400" />
                                            </Button>
                                            <span className="text-xs text-gray-400">
                                                {message.currentResponseIndex + 1}/
                                                {message.responses.length}
                                            </span>
                                            <Button
                                                disabled
                                                size="icon"
                                                variant="ghost"

                                                className="h-6 w-6 p-1"
                                            >
                                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                            </Button>
                                        </>
                                    )}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    disabled
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 p-1"

                                                >
                                                    <RefreshCcw
                                                        className={`h-4 w-4 ${regeneratingMessageId === message.id
                                                                ? "animate-spin"
                                                                : ""
                                                            } text-gray-400`}
                                                    />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Regenerate</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    disabled
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 p-1"
                                                >
                                                    <ThumbsUp
                                                        className={`h-4 w-4 ${message.liked
                                                                ? "text-black fill-black"
                                                                : "text-gray-400"
                                                            }`}
                                                    />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Like</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    disabled
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 p-1"
                                                >
                                                    <ThumbsDown
                                                        className={`h-4 w-4 ${message.disliked
                                                                ? "text-black fill-black"
                                                                : "text-gray-400"
                                                            }`}
                                                    />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Dislike</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <Button className="absolute bg-miracle-mediumBlue hover:bg-miracle-mediumBlue/95 bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">Continue</Button>

        </div>
    );
}
