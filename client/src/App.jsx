import { useState, useEffect, createContext } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./layout/Layout";
import Picture2 from "./assets/login.jpeg";
import LoginForm from "./components/LoginForm";
import { Toaster } from "./components/ui/toaster";

export const AuthContext = createContext();
export const chatContext = createContext();

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();
  const [files, setFiles] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isInitialMessage, setIsInitialMessage] = useState(null);
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    setAuthenticated(isLoggedIn);
  }, []);

  const login = () => {
    setAuthenticated(true);
    localStorage.setItem("isLoggedIn", "true");
  };

  const logout = () => {
    setAuthenticated(false);
    localStorage.setItem("isLoggedIn", "false");
    localStorage.setItem("userName", "");
    localStorage.setItem("userId", "");
    localStorage.setItem("token", "");
    navigate("/");
  };

  useEffect(()=>{
    if(window.location.pathname.includes("/share")){
      setAuthenticated(true)
    }
  },[])
  
  return (
    <AuthContext.Provider value={{ authenticated, login, logout }}>
      {authenticated ? (
        <div className="h-full w-full">
          <chatContext.Provider
            value={{
              files,
              setFiles,
              selectedQuestion,
              setSelectedQuestion,
              setIsInitialMessage,
              isInitialMessage,
            }}
          >
            <Layout />
          </chatContext.Provider>
        </div>
      ) : (
        <div className="relative min-h-screen bg-gray-100 flex items-center justify-center font-sans p-4">
          <Toaster />
          <div
            className="absolute inset-0 bg-cover bg-center opacity-70"
            style={{
              backgroundImage: `url(${Picture2}?height=1080&width=1920)`,
            }}
          ></div>
          <div className="absolute inset-0 bg-black opacity-30"></div>
          <LoginForm />
        </div>
      )}
    </AuthContext.Provider>
  );
}
