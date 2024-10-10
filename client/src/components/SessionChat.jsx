
import React, { useState, useRef, useCallback, useEffect, useContext } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
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
import { Textarea } from "./ui/textarea";
import { chatContext } from "@/App";

const useInitialMessage = (location, handleSend) => {
  const chatStore = useContext(chatContext)
  console.log(chatStore)
  const [initialMessageHandled, setInitialMessageHandled] = useState(false);
  const checkAndSendInitialMessage = useCallback(() => {
    if (
      !initialMessageHandled &&
      chatStore.selectedQuestion&&
      chatStore.isInitialMessage
    ) {
      handleSend(chatStore.selectedQuestion,chatStore.files);
      chatStore.setSelectedQuestion(null)
      chatStore.setIsInitialMessage(false)
      chatStore.setFiles(null)
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
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="text-sm font-sans text-gray-600 hover:text-gray-900"
        >
          {copied ? (
            <div className="flex items-center gap-1">
              <Check size={18}/>
              Copied!
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <ClipboardList size={16}/>
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
  const [scrollTriggered, setScrollTriggered] = useState(false);
  const userName = localStorage.getItem("userName")
  let selectedQuestion = 1;
  const [isRegenerated, setIsRegenerated] = useState(false)

 
  const handleSend =async (text = input, files = uploadedFiles)=>{
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
        // console.log(files)
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
          // console.log(messages)
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
  }


  const fetchAllMessages = useCallback(async () => {
    try {
      const response = await API.get.getSessionHistory(sessionId);
      // console.log(response.data)
      if (response.data && response.data.messages) {
        const fetchedMessages = response.data.messages.flatMap((msg) => {
          const userMessage = {
            id: `${msg.data[0].messageId}-user`,
            text: msg.data[0].text,
            sender: "user",
            image: Logo,
            uploadedFiles: msg.data[0].uploadedFiles,
          };
          selectedQuestion =msg.selectedQuestion-1
          const selectedAnswer =msg.data[msg.selectedQuestion-1].answer[msg.data[msg.selectedQuestion-1].selectedAnswer-1]

          // console.log(selectedQuestion,selectedAnswer, "kjfkjds")
          // let responseIndex = msg.data[msg.selectedQuestion-1].selectedAnswer;
          // console.log(responseIndex, msg.data[msg.selectedQuestion-1].answer.length, "kfjkfjsdbfksdb")
          // if(msg.data[msg.selectedQuestion-1].answer.length === localStorage.getItem("regenerateResponseLength")){
          //   responseIndex = responseIndex+1;
          // }
          const botResponse = {
            id: `${msg.data[0].messageId}`,
            text: selectedAnswer.text,
            sender: "bot",
            image: Bot,
            responses: msg.data[0].answer.map(a => a.text),
            currentResponseIndex: msg.data[msg.selectedQuestion-1].selectedAnswer-1,
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

  useEffect(() => {
    if (scrollTriggered) {
      window.scrollTo({
        top: document.getElementById('mainDiv').scrollTop = document.getElementById('mainDiv').scrollHeight,
        behavior: 'smooth', // Smooth scroll effect
      });
        setScrollTriggered(false); // Reset the trigger
    }
  }, [scrollTriggered]);

  const handleScrollDown = () => {
    setScrollTriggered(true);
};

  const checkAndSendInitialMessage = useInitialMessage(location, handleSend);

  useEffect(() => {
    checkAndSendInitialMessage();
  }, [checkAndSendInitialMessage]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const handleRegenerate = async (messageId) => {
    setRegeneratingMessageId(messageId);
    const messageToRegenerate = messages.find((msg) => msg.id === messageId);
    // const index = messages.findIndex((msg) => msg.id === messageId);
    // const getFiles = messages[index-1];
    // console.log(getFiles.uploadedFiles, "skjfndskjndskj")
    if (messageToRegenerate) {
      try {
        const response = await API.post.regenerateMessages(
          messageToRegenerate.text,
          messageId,
          sessionId,
        );
        // console.log(response,"sksdbkjsdbfsdkj")
        if (
          response.data.messages &&
          response.data.messages[0].data[0].answer.length > 0
        ) {
          const newAnswer =
            response.data.messages[0].data[0].answer[
              response.data.messages[0].data[0].answer.length - 1
            ].text;
            // setSelectedAnswerNumber(response.data.messages[0].data[0].answer.length);
            localStorage.setItem("regenerateResponseLength", response.data.messages[0].data[0].answer.length)
          setMessages((prevMessages) => {
            return prevMessages.map((message) => {
              if (message.id === messageId && message.sender === "bot") {
                return {
                  ...message,
                  text: newAnswer,
                  responses: [...message.responses, newAnswer],
                  currentResponseIndex: message.responses.length,
                };
              }
              return message;
            });
          });
        }
      } catch (error) {
        console.error("Error regenerating response:", error);
      } finally {
        setRegeneratingMessageId(null);
      }
    }
  };

  const handleLike = (messageId) => {
    setMessages((prevMessages) => {
      return prevMessages.map((message) => {
        if (message.id === messageId && message.sender === "bot") {
          return { ...message, liked: true, disliked: false };
        }
        return message;
      });
    });
  };

  const handleDislike = (messageId) => {
    setMessages((prevMessages) => {
      return prevMessages.map((message) => {
        if (message.id === messageId && message.sender === "bot") {
          return { ...message, liked: false, disliked: true };
        }
        return message;
      });
    });
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setUploadedFiles((prevFiles) => [...prevFiles, ...newFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileToRemove) => {
    setUploadedFiles((prevFiles) =>
      prevFiles.filter((file) => file.id !== fileToRemove.id)
    );
    URL.revokeObjectURL(fileToRemove.preview);

    if (previewImage === fileToRemove.preview) {
      setPreviewImage(null);
    }
  };

  const handleNavigateResponses = async (messageId, direction) => {
    const response = await API.put.storeSelectedAnswer(sessionId, messageId, direction);
    console.log(response);
    if(response.data.message === "updated") {
    setMessages((prevMessages) => {
      return prevMessages.map((message) => {
        if (message.id === messageId && message.sender === "bot") {
          let newIndex = message.currentResponseIndex + direction;
          if (newIndex < 0) newIndex = 0;
          if (newIndex >= message.responses.length)
            newIndex = message.responses.length - 1;
          // console.log(newIndex,"newIndex", direction)
          return {
            ...message,
            text: message.responses[newIndex],
            currentResponseIndex: newIndex,
          };
        }
        return message;
      });
    });
  }else {
    console.error("Not updated successfully")
  }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = '24px';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-8"
        id="mainDiv"
      >
        <div className="w-full max-w-3xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col mb-4 ${
                message.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`flex items-start ${
                  message.sender === "bot" ? "flex-row justify-center" : "flex-row-reverse"
                } ${
                  message.sender === "bot" ? "max-w-full sm:max-w-[100%] md:max-w-[100%] lg:max-w-[100%]" : "max-w-full sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%]"
                }`}
              >
                <img
                  src={`${message.sender==="user"? `https://avatar.iran.liara.run/username?username=${userName}&background=00aae7&color=FFFFFF` : message.image}`}
                  alt="Profile"
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${
                    message.sender === "bot" ? "mr-2" : "ml-2"
                  }`}
                />
                <div
                  className={`rounded-lg ${
                    message.sender === "user"
                      ? "bg-[#2368a0] text-white p-3 sm:p-3"
                      : "bg-transparent text-black p-1"
                  } break-words `}
                  style={{
                    maxWidth: message.sender === "bot" ? "100%" : "80%",
                    width: "fit content"
                  }}
                >
                  {message.sender=== "user" && message.uploadedFiles &&
                    message.uploadedFiles.map((file) => (
                      <img
                        src={file.preview || `data:${file.type};base64,${file.base64}`}
                        alt="Uploaded"
                        className="mt-2 mb-2 max-w-full h-auto rounded"
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
                    <p className="text-xs sm:text-sm whitespace-pre-wrap">{message.text}</p>
                  )}
                  
                </div>
              </div>
              {message.sender === "bot" && (
                <div className="flex mt-2 ml-10 space-x-2 items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCopy(message.text, message.id)}
                          className="h-6 w-6 p-1"
                        >
                          <Copy
                            className={`h-4 w-4 ${
                              copiedStates[message.id]
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
                        size="icon"
                        variant="ghost"
                        onClick={() => handleNavigateResponses(message.id, -1)}
                        disabled={message.currentResponseIndex === 0}
                        className="h-6 w-6 p-1"
                      >
                        <ChevronLeft className="h-4 w-4 text-gray-400" />
                      </Button>
                      <span className="text-xs text-gray-400">
                        {message.currentResponseIndex + 1}/
                        {message.responses.length}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleNavigateResponses(message.id, 1)}
                        disabled={
                          message.currentResponseIndex ===
                          message.responses.length - 1
                        }
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
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRegenerate(message.id)}
                          className="h-6 w-6 p-1"
                          disabled={regeneratingMessageId === message.id}
                        >
                          <RefreshCcw
                            className={`h-4 w-4 ${
                              regeneratingMessageId === message.id
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
                          size="icon"
                          variant="ghost"
                          onClick={() => handleLike(message.id)}
                          className="h-6 w-6 p-1"
                        >
                          <ThumbsUp
                            className={`h-4 w-4 ${
                              message.liked
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
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDislike(message.id)}
                          className="h-6 w-6 p-1"
                        >
                          <ThumbsDown
                            className={`h-4 w-4 ${
                              message.disliked
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
          {isTyping && (
            <div className="flex items-start max-w-full sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%]">
              <img
                src={Bot}
                alt="Bot"
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2"
              />
              <TypingAnimation />
            </div>
          )}
        </div>
      </div>
      <div className="sticky bottom-0 px-2 sm:px-4 py-2 mb-4 sm:mb-8">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-end space-x-2">
            <div className="flex-1 flex flex-col bg-white rounded-3xl border border-[#2368a0] px-2 sm:px-4 py-1 sm:py-2 focus-within:ring-2 focus-within:ring-blue-300">
              {uploadedFiles.length > 0 && (
                <div className="w-full mb-2 flex flex-wrap gap-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="relative group">
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded cursor-pointer"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFile(file)}
                        className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-2 w-2 sm:h-3 sm:w-3" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute bottom-0 right-0 h-4 w-4 sm:h-6 sm:w-6 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="h-2 w-2 sm:h-4 sm:w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <img
                            src={file.preview}
                            alt={file.file.name}
                            className="w-full h-auto"
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex w-full items-center">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => fileInputRef.current.click()}
                >
                  <Paperclip className="h-4 w-4 sm:h-6 sm:w-6 stroke-[#2368A0]" />
                </Button>
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Start your conversation...."
                  className=" border-none flex items-center focus:outline-none focus:ring-0 focus:border-none text-xs sm:text-sm resize-none overflow-y-auto"
                  style={{
                    minHeight: '28px',
                    maxHeight: '150px',
                    lineHeight: '15px',
                    padding: '5px',
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleScrollDown();
                      handleSend();

                    }
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleSend()}
                  className={`transition-colors duration-200 ${
                    input.trim() && input !== lastSentMessage
                      ? "bg-[#2368A0] hover:bg-[#1d5a8c]"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  disabled={!input.trim()}
                >
                  <Send
                    className={`h-4 w-4 sm:h-6 sm:w-6 ${
                      input.trim() && input !== lastSentMessage
                        ? "stroke-white"
                        : "stroke-gray-400"
                    }`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
        multiple
      />
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="sm:max-w-[425px]">
          {previewImage && (
            <img src={previewImage} alt="Preview" className="w-full h-auto" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
