import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Aside from "./aside/Aside";
import HomeScreen from "@/components/HomeScreen";
import ChatScreen from "@/components/ChatScreen";
import CodeScreen from "@/components/CodeScreen";
import Header from "./header/Header";
import ImageChat from "@/components/ImageChat";
import UnifiedChat from "@/components/UnifiedChat";
import SessionChat from "@/components/SessionChat";
import { Toaster } from "@/components/ui/toaster";
import ShareableSessionChat from "@/components/ShareableSessionChat ";

function Layout() {
  const [expanded, setExpanded] = useState(true);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [isShareScreen,setIsShareScreen] = useState(false)
  useEffect(()=>{
    console.log(window.location.pathname);
    
    if(window.location.pathname.includes("/share")){
      setIsShareScreen(true)
    }
  },[])
  return (
    <div className="h-screen w-full flex overflow-hidden">
     {!isShareScreen&& <Toaster />}
     {!isShareScreen&& <Aside 
        expanded={expanded} 
        setExpanded={setExpanded} 
        updateTrigger={updateTrigger}
      />}
      <div className={`flex-1 flex flex-col ${!isShareScreen?expanded ? 'ml-60' : 'ml-16':''}`}>
        <Header expanded={expanded} />
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route
              path="/"
              element={
                <HomeScreen expanded={expanded} />
              }
            />
            <Route path="/new_chat21" element={<CodeScreen />} />
            <Route path="/new_chat1" element={<ChatScreen />} />
            <Route path="/new_chat3" element={<ImageChat />}/>
            <Route path="/new_chat4" element={<UnifiedChat />}/>
            <Route 
              path="/session/share/:sessionId" 
              element={<ShareableSessionChat setUpdateTrigger={setUpdateTrigger} />} 
            />
            <Route 
              path="/:sessionId" 
              element={<SessionChat setUpdateTrigger={setUpdateTrigger} />} 
            />
            <Route path="/other" element={<div>other</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Layout;