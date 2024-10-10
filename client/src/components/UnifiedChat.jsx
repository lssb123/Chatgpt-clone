import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/mainInput";
import {
  Send,
  RefreshCcw,
  Copy,
  Paperclip,
  Mic,
  X,
  Eye,
  ThumbsDown,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import Logo from "../assets/chankya.png";
import Bot from "../assets/bot.png";
import Feedback from "@/components/FeedBack";

export default function UnifiedChat({ expanded = false }) {
  const [messages, setMessages] = useState([
    {
      id: 0,
      text: "Hi",
      sender: "user",
      image: Logo,
    },
    {
      id: 1,
      text: "Hello! How can I assist you today? Feel free to ask questions, request code examples, or upload images for analysis.",
      sender: "bot",
      image: Bot,
      responses: [
        "Hello! How can I assist you today? Feel free to ask questions, request code examples, or upload images for analysis.",
      ],
      currentResponseIndex: 0,
      liked: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isImageMode, setIsImageMode] = useState(false);
  const [copiedStates, setCopiedStates] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastImageMessageId, setLastImageMessageId] = useState(null);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const handleSend = () => {
    if (input.trim() || uploadedFiles.length > 0) {
      const newUserMessage = {
        id: Date.now(),
        text: input,
        sender: "user",
        image: Logo,
        uploadedFiles: uploadedFiles,
        isImageMode: isImageMode,
      };
      setMessages((prev) => [...prev, newUserMessage]);
      setInput("");
      if (uploadedFiles.length > 0) {
        setLastImageMessageId(newUserMessage.id);
      }
      setUploadedFiles([]);

      // Simulate bot response
      setTimeout(() => {
        let botResponse;
        if (uploadedFiles.length > 0) {
          botResponse = {
            id: Date.now() + 1,
            text: `I've analyzed the image${
              input.trim() ? " and considered your question" : ""
            }. What would you like to know about it?`,
            sender: "bot",
            image: Bot,
            responses: [
              `I've analyzed the image${
                input.trim() ? " and considered your question" : ""
              }. What would you like to know about it?`,
            ],
            currentResponseIndex: 0,
            liked: false,
          };
        } else if (
          input.toLowerCase().includes("code") ||
          input.toLowerCase().includes("java")
        ) {
          botResponse = {
            id: Date.now() + 1,
            text: "Here's a simple Java code to check if a word is a palindrome:",
            sender: "bot",
            image: Bot,
            code: `public class PalindromeChecker {
                      public static boolean isPalindrome(String str) {
                        String clean = str.replaceAll("\\s+", "").toLowerCase();
                        int length = clean.length();
                        int forward = 0;
                        int backward = length - 1;
                        while (backward > forward) {
                          char forwardChar = clean.charAt(forward++);
                          char backwardChar = clean.charAt(backward--);
                          if (forwardChar != backwardChar)
                            return false;
                        }
                        return true;
                      }

                  public static void main(String[] args) {
                    String test = "A man a plan a canal Panama";
                    System.out.println(isPalindrome(test));
                  }
                }`,
            language: "java",
            responses: [
              "Here's a simple Java code to check if a word is a palindrome:",
            ],
            currentResponseIndex: 0,
            liked: false,
          };
        } else {
          botResponse = {
            id: Date.now() + 1,
            text: `Here's a response to your question. How else can I assist you?`,
            sender: "bot",
            image: Bot,
            responses: [
              `Here's a response to your question. How else can I assist you?`,
            ],
            currentResponseIndex: 0,
            liked: false,
          };
        }
        setMessages((prev) => [...prev, botResponse]);
      }, 1000);
    }
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
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const handleRegenerate = (messageId) => {
    setMessages((prevMessages) => {
      return prevMessages.map((message) => {
        if (message.id === messageId && message.sender === "bot") {
          const newResponse = `Here's a regenerated response for your question. Is there anything else I can help you with?`;
          return {
            ...message,
            text: newResponse,
            responses: [...message.responses, newResponse],
            currentResponseIndex: message.responses.length,
          };
        }
        return message;
      });
    });
  };

  const handleNavigateResponses = (messageId, direction) => {
    setMessages((prevMessages) => {
      return prevMessages.map((message) => {
        if (message.id === messageId && message.sender === "bot") {
          let newIndex = message.currentResponseIndex + direction;
          if (newIndex < 0) newIndex = 0;
          if (newIndex >= message.responses.length)
            newIndex = message.responses.length - 1;
          return {
            ...message,
            text: message.responses[newIndex],
            currentResponseIndex: newIndex,
          };
        }
        return message;
      });
    });
  };

  const handleLike = (messageId) => {
    setMessages((prevMessages) => {
      return prevMessages.map((message) => {
        if (message.id === messageId && message.sender === "bot") {
          return { ...message, liked: !message.liked };
        }
        return message;
      });
    });
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      uploadedFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [uploadedFiles]);

  return (
    <div
      className={`flex flex-col h-screen bg-white overflow-hidden transition-all duration-300 ${
        expanded ? "lg:ml-60" : "lg:ml-16"
      }`}
    >
      <div className="flex-1 flex flex-col h-full">
        <div className="sticky top-0 z-10 px-4 py-2">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between"></div>
          </div>
        </div>
        {/* Scrollable Chat Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 sm:py-8"
        >
          <div className="max-w-4xl mx-auto w-full">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col mb-4 ${
                  message.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`flex items-start ${
                    message.sender === "bot" ? "flex-row" : "flex-row-reverse"
                  } max-w-full sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%]`}
                >
                  <img
                    src={message.image}
                    alt="Profile"
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${
                      message.sender === "bot" ? "mr-2" : "ml-2"
                    }`}
                  />
                  <div
                    className={`p-2 sm:p-3 rounded-lg ${
                      message.sender === "user"
                        ? "bg-[#2368a0] text-white"
                        : "bg-gray-100 text-black"
                    } w-full`}
                  >
                    <p className="text-xs sm:text-sm">{message.text}</p>
                    {message.uploadedFiles &&
                      message.uploadedFiles.map((file) => (
                        <img
                          key={file.id}
                          src={file.preview}
                          alt="Uploaded"
                          className="mt-2 max-w-full h-auto rounded"
                        />
                      ))}
                    {message.code && (
                      <div className="relative mt-2 rounded-md overflow-hidden">
                        <SyntaxHighlighter
                          language={message.language || "javascript"}
                          style={vscDarkPlus}
                          customStyle={{
                            margin: 0,
                            padding: "1rem",
                            fontSize: "0.875rem",
                            lineHeight: "1.25rem",
                          }}
                        >
                          {message.code}
                        </SyntaxHighlighter>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            handleCopy(message.code, `code-${message.id}`)
                          }
                          className="absolute top-2 right-2 h-6 w-6 p-1 bg-gray-800 hover:bg-gray-700 rounded-md"
                        >
                          <Copy
                            className={`h-4 w-4 ${
                              copiedStates[`code-${message.id}`]
                                ? "text-green-500"
                                : "text-gray-400"
                            }`}
                          />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {message.sender === "user" &&
                  message.id === lastImageMessageId && (
                    <div className="flex mt-2 mr-8 sm:mr-10 space-x-2">
                      <Label
                        htmlFor={`image-mode-${message.id}`}
                        className="text-xs sm:text-sm"
                      >
                        Image Mode
                      </Label>
                      <Switch
                        id={`image-mode-${message.id}`}
                        checked={isImageMode}
                        onCheckedChange={setIsImageMode}
                      />
                    </div>
                  )}
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
                      </Tooltip>
                    </TooltipProvider>
                    {message.responses.length > 1 && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            handleNavigateResponses(message.id, -1)
                          }
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
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRegenerate(message.id)}
                      className="h-6 w-6 p-1"
                    >
                      <RefreshCcw className="h-4 w-4 text-gray-400" />
                    </Button>
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
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setShowFeedback(true)}
                      className="h-6 w-6 p-1"
                    >
                      <ThumbsDown className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
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
                <div className="flex w-full items-center space-x-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <Paperclip className="h-4 w-4 sm:h-6 sm:w-6 stroke-[#2368A0]" />
                  </Button>
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      isImageMode
                        ? "Ask about the image..."
                        : "Ask a question or request code..."
                    }
                    className="flex-1 border-none shadow-none focus:outline-none focus:ring-0 focus:border-none text-xs sm:text-sm"
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  />
                  <Button size="icon" variant="ghost" onClick={handleSend}>
                    {input.trim() ? (
                      <Send className="h-4 w-4 sm:h-6 sm:w-6 stroke-[#2368A0]" />
                    ) : (
                      <Mic className="h-4 w-4 sm:h-6 sm:w-6 stroke-[#2368A0]" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex-shrink-0 self-end mb-1 sm:mb-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="p-0">
          <Feedback />
        </DialogContent>
      </Dialog>
    </div>
  );
}
