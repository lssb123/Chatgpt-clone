import { useTheme } from "@/components/theme-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AuthContext } from "@/App";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeftFromLine,
  Calendar,
  SquarePen,
  MessageSquare,
  MoreHorizontal,
  Share,
  Edit,
  Trash2,
  Power,
  Copy,
  X,
} from "lucide-react";
import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import API from '@/services/API';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
        <p className="mb-4">Are you sure you want to delete this chat?</p>
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto transition-colors duration-200"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

const ShareModal = ({ isOpen, onClose, shareableUrl }) => {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableUrl).then(() => {
      toast({
        title: "Link Copied",
        description: "The shareable link has been copied to your clipboard.",
        duration: 2000,
      });
    }).catch((err) => {
      console.error('Failed to copy: ', err);
      toast({
        title: "Error",
        description: "Failed to copy the link. Please try again.",
        duration: 2000,
      });
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-bold mb-4">Share Chat</h2>
        <p className="mb-4">Use this link to share your chat:</p>
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            value={shareableUrl}
            readOnly
            className="flex-grow p-2 border rounded"
          />
          <Button onClick={copyToClipboard} className="bg-[#2368a0] hover:bg-[#2368a0]">
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>
      </div>
    </div>
  );
};

const Chats = ({ expanded, selectedChat, handleChatClick, chatSessions, updateChatTitle, deleteChat }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareableUrl, setShareableUrl] = useState("");
  const { toast } = useToast();

  if (!expanded) return null;

  const handleDeleteClick = (chatId) => {
    setChatToDelete(chatId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (chatToDelete) {
      deleteChat(chatToDelete);
      setIsDeleteModalOpen(false);
      setChatToDelete(null);
    }
  };

  const handleShare = async (sessionId) => {
    try {
      const response = await API.get.getShrabkeLink(sessionId);
      if (response && response.data && response.data.shareableUrl) {
        setShareableUrl(response.data.shareableUrl);
        setIsShareModalOpen(true);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Failed to share chat:", error);
      toast({
        title: "Error",
        description: "Failed to generate shareable link. Please try again.",
        duration: 2000,
      });
    }
  };

  const renderChatItem = (chat) => {
    const isSelected = selectedChat === chat.sessionId;
    return (
      <div key={chat.sessionId} className="border-b border-gray-200 pb-2 last:border-b-0">
        <div className="hover:bg-gray-100 rounded-lg">
        <div
          className={`flex items-center justify-between rounded-lg transition-colors duration-200 ${
            isSelected ? "" : "hover:bg-gray-100"
          }`}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 p-2 w-full justify-start rounded-none"
                  onClick={() => handleChatClick(chat.sessionId)}
                >
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600 truncate max-w-[160px]">
                    {chat.title}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{chat.title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
             <span className="sr-only ">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => handleShare(chat.sessionId)}>
                <Share className="mr-2 h-4 w-4" />
                <span>Share</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => updateChatTitle(chat.sessionId, "New Title")}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleDeleteClick(chat.sessionId)}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </div>
      </div>
    );
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const todayChats = chatSessions.filter(chat => new Date(chat.createdAt) >= today);
  // console.log(todayChats,"today")
  // console.log(chatSessions,"chatSessions")
  const yesterdayChats = chatSessions.filter(chat => {
    const chatDate = new Date(chat.createdAt);
    return chatDate >= yesterday && chatDate < today;
  });
  const previousChats = chatSessions.filter(chat => {
    const chatDate = new Date(chat.createdAt);
    return chatDate >= thirtyDaysAgo && chatDate < yesterday;
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white p-2 w-full">
        {chatSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-sm">No chat history found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayChats.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h2 className="text-xs font-bold text-gray-500 uppercase">
                    Today
                  </h2>
                  <div className="border-b w-full border-gray-200 my-2"></div>
                </div>
                {todayChats.map(renderChatItem)}
              </div>
            )}
            {yesterdayChats.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h2 className="text-xs font-bold text-gray-500 uppercase">
                    Yesterday
                  </h2>
                  <div className="border-b w-full border-gray-200 my-2"></div>
                </div>
                {yesterdayChats.map(renderChatItem)}
              </div>
            )}
            {previousChats.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h2 className="text-xs font-bold w-fit text-gray-500 uppercase">
                    Previous 30 days
                  </h2>
                  <div className="border-b w-full border-gray-200 my-2"></div>
                </div>
                {previousChats.map(renderChatItem)}
              </div>
            )}
          </div>
        )}
      </div>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareableUrl={shareableUrl}
      />
    </div>
  );
};


export default function Aside({ expanded, setExpanded, updateTrigger }) {
  const [currentLink, setCurrentLink] = useState("dashboard");
  const { setTheme, theme } = useTheme();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);
  const { logout } = useContext(AuthContext);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const { setAuthenticated } = useContext(AuthContext);
  const [sessionId, setSessionId] = useState(null);
  const { toast } = useToast();
  const [chatSessions, setChatSessions] = useState([]);

  const fetchChatSessions = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const response = await API.get.updateTitle(userId);
      if(response && response.data.message === "No sessions found for the given userId"){
        setChatSessions([]);
      }
      else if (response && response.data) {
        setChatSessions(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load chat sessions. Please try again.",
        duration: 2000,
      });
    }
  };

  useEffect(() => {
    fetchChatSessions();
  }, [toast, updateTrigger]);

  const handleChatClick = (chatId) => {
    setSelectedChat(chatId);
    navigate(`/${chatId}`);
  };

  const updateChatTitle = async (chatId, newTitle) => {
    try {
      const result = await API.put.updateTitle(chatId);
      if (result.data.message === "Title updated successfully!") {
        setChatSessions(prevSessions =>
          prevSessions.map(session =>
            session.sessionId === chatId ? { ...session, title: result.data.session.title } : session
          )
        );
        toast({
          title: "Success",
          description: "Chat title updated successfully!",
          duration: 2000,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update chat title. Please try again.",
        duration: 2000,
      });
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await API.delete.deleteSession(chatId);
      toast({
        title: "Success",
        description: "Chat session deleted successfully!",
        duration: 2000,
      });
      await fetchChatSessions();
      navigate('/');
    } catch (error) {
      console.error("Failed to delete chat session:", error);
      toast({
        title: "Error",
        description: "Failed to delete chat session. Please try again.",
        duration: 2000,
      });
    }
  };

  const handleNewChat = () => {
    navigate("/");
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-10 flex flex-col border-r bg-background transition-all duration-300 ease-in-out ${
        expanded ? "w-60" : "w-16"
      }`}
    >
      <div className="flex flex-col h-full">
        <nav className="flex-shrink-0 flex flex-col items-center gap-4 p-2">
          <div
            className={`group flex h-9 w-full shrink-0 items-center ${
              expanded ? "justify-center" : "justify-center"
            } gap-2 rounded-full bg-transparent text-lg  font-semibold md:h-8 md:text-base mt-[8px]`}
          >
            <img
              src={expanded ? "./new_logo.png" : "./Mlogo.png"}
              alt="Miracle labs logo"
              className={`transition-all ${
                expanded ? "w-36 aspect-[3/1]" : "h-8 w-8"
              }`}
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={handleNewChat}
                  className={`flex h-9 w-full items-center ${
                    expanded ? "justify-start px-2" : "justify-center"
                  } ${
                    currentLink === "dashboard"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  } rounded-lg cursor-pointer hover:text-foreground md:h-8 gap-2 mt-[10px]`}
                >
                  {expanded ? (
                    <button className="flex items-center justify-center gap-2  bg-[#2368a0] text-white font-semibold px-2 py-2 rounded-md hover:bg-[#2368a0] w-full text-sm">
                      <span>New Chat</span>
                      <SquarePen className="h-5 w-5" />
                    </button>
                  ) : (
                    <>
                      <SquarePen className="h-5 w-5" />
                      <span className="sr-only">New Chat</span>
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">New Chat</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>

        {expanded ? (
          <Chats
            expanded={expanded}
            selectedChat={selectedChat}
            handleChatClick={handleChatClick}
            chatSessions={chatSessions}
            updateChatTitle={updateChatTitle}
            deleteChat={deleteChat}
          />
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center items-center h-8 w-8 ml-4">
                  <Calendar
                    onClick={() => setExpanded(!expanded)}
                    className="h-5 w-5 cursor-pointer"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Previous Chats</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <nav className="flex-shrink-0 mt-auto flex flex-col items-center gap-2 p-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={() => setExpanded(!expanded)}
                  className={`flex h-9 group w-full items-center ${
                    expanded ? "justify-start px-2" : "justify-center"
                  } rounded-lg cursor-pointer text-muted-foreground transition-colors hover:text-foreground md:h-8 gap-2`}
                >
                  <div
                    className={`flex w-full items-center ${
                      expanded ? "justify-start" : "justify-center"
                    } gap-2 leading-none`}
                  >
                    <ArrowLeftFromLine
                      className={`h-5 w-5 transition-all ${
                        expanded
                          ? "rotate-180 group-hover:rotate-0"
                          : "group-hover:rotate-180"
                      }`}
                    />
                    {expanded && <span className="text-sm">Collapse</span>}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {expanded ? "Collapse" : "Expand"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Dialog>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Toggle Dark Mode{" "}
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={(e) => {
                      setTheme(e ? "dark" : "light");
                    }}
                  />
                </DialogTitle>
                <DialogDescription>
                  Tap to switch between light and dark themes for enhanced
                  visibility in low-light environments.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          <div className="w-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  className={`flex h-9 w-full items-center ${
                    expanded ? "justify-start px-2" : "justify-center"
                  } rounded-lg cursor-pointer text-muted-foreground transition-colors hover:text-foreground md:h-8 gap-2`}
                >
                  {expanded ? (
                    <div className="flex w-full items-center justify-start gap-2 leading-none">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-5 h-5 rounded-full hover:bg-gray-300 text-gray-700 shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        onClick={() => setIsLogoutVisible(true)}
                      >
                        <Power className="h-6 w-6" />
                      </Button>
                      <span className="text-sm" onClick={() => setIsLogoutVisible(true)}>Logout</span>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-5 h-5 rounded-full hover:bg-gray-300 text-gray-700 shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsLogoutVisible(true)}
                    >
                      <Power className="h-6 w-6" />
                    </Button>
                  )}
                </div>
              </DropdownMenuTrigger>
            </DropdownMenu>
          </div>
        </nav>
      </div>

      {isLogoutVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Logout</h2>
            <p className="mb-4">Are you sure you want to logout?</p>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsLogoutVisible(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                className="bg-[#2368A0] hover:bg-[#1d5a8c] text-white w-full sm:w-auto transition-colors duration-200"
                onClick={() => {
                  setIsLogoutVisible(false);
                  logout();
                  toast({
                    title: "Logout successful!",
                    description: "You have been successfully logged out.",
                    duration: 2000,
                  });
                  navigate("/");
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}