import  { createContext, useContext, useEffect, useState } from 'react';
import { SocketContext } from './SocketContext';

// Create a context for user data
export const UserDataContext = createContext();

const UserContext = ({ children }) => {

  const { socket } = useContext(SocketContext);

  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!user?._id || !socket) return;

    const emitJoin = () => {
      socket.emit("join", { userId: user._id, userType: "user" });
    };

    if (socket.connected) emitJoin();
    socket.on("connect", emitJoin);

    return () => socket.off("connect", emitJoin);
  }, [user?._id, socket]);

  return (
    // Provide user data and update function to the entire app (use obj)
    <UserDataContext.Provider value={{ user, setUser }}> 
      {children}
    </UserDataContext.Provider>
  );
};

export default UserContext;
