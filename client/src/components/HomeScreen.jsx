import React, { useState, useRef, useCallback, useEffect, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Logo from "../assets/chankya.png";
import MyComponent from "./MyComponent";
import API from "@/services/API";
import { chatContext } from "@/App";

export default function HomeScreen() {
  const [input, setInput] = useState("");
  const [showInitialContent, setShowInitialContent] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isFirstQuestion, setIsFirstQuestion] = useState(true);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();
  const chatStore = useContext(chatContext);

  const suggestedQuestions = [
    "Explain react query along with an example?",
    "How do I effectively collaborate with a team?",
    "How can I find local guides that are worth booking?",
  ];

  const createNewSession = useCallback(async () => {
    if (isCreatingSession) return null;
    setIsCreatingSession(true);
    try {
      const response = await API.post.createSession();
      return response.data.sessionId;
    } catch (error) {
      console.error("Error creating new session:", error);
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  }, [isCreatingSession]);

  const handleSend = async (text = input) => {
    if (text.trim() || uploadedFiles.length > 0) {
      setShowInitialContent(false);
      const newMessage = { text, sender: 'user', uploadedFiles: uploadedFiles, image: Logo };
      setMessages(prevMessages => [...prevMessages, newMessage]);

      try {
        const sessionId = await createNewSession();
        if (sessionId) {
          chatStore.setSelectedQuestion(text);
          chatStore.setIsInitialMessage(true);
          chatStore.setFiles(uploadedFiles);
          navigate(`/${sessionId}`, { 
            state: { 
              initialMessage: text,
              sessionId: sessionId,
              shouldSendInitialMessage: true,
              uploadedFiles: uploadedFiles,
              fromAsideBar: true
            } 
          });
        }
      } catch (error) {
        console.error("Error handling send:", error);
      }

      if (isFirstQuestion) {
        setInput("");
        setUploadedFiles([]);
        setIsFirstQuestion(false);
      }
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

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = '28px';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-2 sm:px-4 py-8">
        {showInitialContent ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-full max-w-3xl mx-auto text-center p-6">
              <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6">
                <MyComponent />
              </h1>
              <p className="text-gray-600 mb-6 sm:mb-8">
                Ask me anything, I'm here to assist you
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
                {suggestedQuestions.map((text, i) => (
                  <Card
                    key={i}
                    className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSend(text)}
                  >
                    <p className="text-xs sm:text-sm">{text}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl mx-auto">
            {messages.map((message, index) => (
              <div key={index} className={`flex mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`flex items-start ${
                    message.sender === "user" ? "flex-row-reverse" : "flex-row"
                  } ${
                    message.sender === "user" ? "max-w-full sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%]" : "max-w-full sm:max-w-[100%] md:max-w-[100%] lg:max-w-[100%]"
                  }`}
                >
                  <img
                    src={message.image}
                    alt="Profile"
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${
                      message.sender === "user" ? "ml-2" : "mr-2"
                    }`}
                  />
                  <div
                    className={`p-2 sm:p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-[#2368a0] text-white'
                        : 'bg-transparent text-black'
                    } break-words `}
                    style={{
                      maxWidth: message.sender === "user" ? "80%" : "100%",
                      width: "fit-content"
                    }}
                  >
                    {message.sender === 'user' && message.uploadedFiles &&
                      message.uploadedFiles.map((file) => (
                        <img
                          key={file.id}
                          src={file.preview || `data:${file.type};base64,${file.base64}`}
                          alt="Uploaded"
                          className="mt-2 mb-2 max-w-full h-auto rounded"
                        />
                      ))}
                    <p className="text-xs sm:text-sm whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                  placeholder="Start your conversation..."
                  className="flex-1 border-none shadow-none focus:outline-none focus:ring-0 focus:border-none text-xs sm:text-sm resize-none overflow-y-auto placeholder-center"
                  style={{
                    minHeight: '28px',
                    maxHeight: '150px',
                    lineHeight: '15px',
                    paddingTop: '5px',
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleSend()}
                  className={`transition-colors duration-200 ${
                    input.trim()
                      ? 'bg-[#2368A0] hover:bg-[#1d5a8c]' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  disabled={(!input.trim()) || isCreatingSession}
                >
                  <Send className={`h-4 w-4 sm:h-6 sm:w-6 ${
                    input.trim() || uploadedFiles.length > 0 ? 'stroke-white' : 'stroke-gray-400'
                  }`} />
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
    </div>
  );
}