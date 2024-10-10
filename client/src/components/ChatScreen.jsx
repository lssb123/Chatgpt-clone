import React, { useEffect, useRef, useState } from 'react';
import Logo from '../assets/chankya.png';
import Bot from '../assets/bot.png';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/mainInput";
import { Paperclip, Mic, Send, RefreshCcw, X, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Feedback from '@/components/FeedBack';

const ChatScreen = ({ expanded }) => {  
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [copiedStates, setCopiedStates] = useState({});
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const chats = [
    {
      text: 'Hi',
      sender: 'user',
      image: Logo,
    },
    {
      text: 'Hello, how can I help you?',
      sender: 'bot',
      image: Bot,
    },
    {
      text: 'What is a hook in React?',
      sender: 'user',
      image: Logo,
    },
    {
      text: 'A hook in React is a special function that lets you use state and other React features in functional components.',
      sender: 'bot',
      image: Bot,
    },
  ];

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file)
    }));
    setUploadedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileToRemove) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileToRemove.id));
    URL.revokeObjectURL(fileToRemove.preview);
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [index]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [index]: false }));
    }, 2000);
  };

  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [uploadedFiles]);

  return (
    <div className={`flex flex-col h-screen bg-white overflow-hidden transition-all duration-300 ${
      expanded ? 'ml-60' : 'ml-16'
    }`}>
      <div className="flex-1 flex flex-col pt-16 pb-4">
        <div className="flex-1 overflow-auto px-4 py-8 max-w-3xl mx-auto w-full">
          {chats.map((chat, index) => (
            <div key={index} className={`flex flex-col mb-4 ${chat.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-center ${chat.sender === 'bot' ? 'flex-row' : 'flex-row-reverse'}`}>
                <img 
                  src={chat.image} 
                  alt="Profile" 
                  className={`w-8 h-8 rounded-full ${chat.sender === 'bot' ? 'mr-2' : 'ml-2'}`}
                />
                <div className={`p-3 rounded-lg max-w-[80%] ${
                  chat.sender === 'user' ? 'bg-[#2368a0] text-white' : 'bg-[#EBEBEB] text-black'
                }`}>
                  <p className="text-sm">{chat.text}</p>
                </div>
              </div>
              {chat.sender === 'bot' && (
                <div className="flex mt-2 ml-10 space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCopy(chat.text, index)}
                          className="h-6 w-6 p-1"
                        >
                          <Copy className="h-4 w-4 text-gray-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{copiedStates[index] ? 'Copied!' : 'Copy'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowFeedback(true)}
                    className="h-6 w-6 p-1"
                  >
                    <RefreshCcw className="h-4 w-4 text-gray-400" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowFeedback(true)}
                    className="h-6 w-6 p-1"
                  >
                    <ThumbsUp className="h-4 w-4 text-gray-400" />
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
        <div className="px-4 mt-auto mb-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end space-x-2">
              <div className="flex-1 flex flex-col bg-white rounded-3xl border border-[#2368a0] px-4 py-2 focus-within:ring-2 focus-within:ring-[#2368a0]">
                {uploadedFiles.length > 0 && (
                  <div className="w-full mb-2 flex flex-wrap gap-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="relative group">
                        <img 
                          src={file.preview} 
                          alt={file.file.name} 
                          className="w-10 h-10 object-cover rounded cursor-pointer" 
                          onClick={() => setPreviewImage(file.preview)}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file);
                          }}
                          className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex w-full items-center space-x-2">
                  <Button size="icon" variant="ghost">
                    <Mic className="h-6 w-6 stroke-[#2368A0]" />
                  </Button>
                  <Input
                    ref={inputRef}
                    placeholder="Start your Conversation...."
                    className="flex-1 border-none shadow-none focus:outline-none focus:ring-0 focus:border-none"
                  />
                  <Button size="icon" variant="ghost">
                    <Send className="h-6 w-6 stroke-[#2368A0]" />
                  </Button>
                </div>
              </div>
              <div className="flex-shrink-0 self-end mb-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button size="icon" variant="ghost" onClick={() => fileInputRef.current.click()}>
                  <Paperclip className="h-6 w-6 stroke-[#2368A0]" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="sm:max-w-[425px]">
          {previewImage && (
            <img src={previewImage} alt="Preview" className="w-full h-auto" />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="p-0">
          <Feedback />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatScreen;
