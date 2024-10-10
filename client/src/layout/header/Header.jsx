import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useContext } from "react";
import { AuthContext } from "@/App";

const Header = ({ expanded }) => {
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const { setAuthenticated } = useContext(AuthContext);

  return (
    <header className={`
      fixed top-0 right-0 z-10 
      transition-all duration-300 ease-in-out
      flex items-center justify-end

      ${expanded ? 'left-60' : 'left-16'}
    `}>

    </header>
  );
};

export default Header;