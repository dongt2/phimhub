import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('rophim_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register'

  useEffect(() => {
    if (user) {
      localStorage.setItem('rophim_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('rophim_current_user');
    }
  }, [user]);

  // Login
  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('rophim_users') || '[]');
    const existingUser = users.find(u => u.email === email && u.password === password);
    
    if (existingUser) {
      const loggedUser = {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        avatar: existingUser.avatar,
        joinedDate: existingUser.joinedDate
      };
      setUser(loggedUser);
      setIsAuthModalOpen(false);
      return { success: true };
    }
    
    return { success: false, message: 'Email hoặc mật khẩu không chính xác' };
  };

  // Register
  const register = (name, email, password) => {
    const users = JSON.parse(localStorage.getItem('rophim_users') || '[]');
    if (users.some(u => u.email === email)) {
      return { success: false, message: 'Email này đã được đăng ký tài khoản!' };
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name: name.trim() || 'Thành viên RổPhim',
      email: email.trim(),
      password,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || email)}`,
      joinedDate: new Date().toLocaleDateString('vi-VN')
    };

    users.push(newUser);
    localStorage.setItem('rophim_users', JSON.stringify(users));

    setUser({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      avatar: newUser.avatar,
      joinedDate: newUser.joinedDate
    });
    setIsAuthModalOpen(false);
    return { success: true };
  };

  // Fast Guest Login
  const loginAsGuest = () => {
    const guestUser = {
      id: 'guest_' + Date.now(),
      name: 'Khách VIP',
      email: 'guest@rophim.ws',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=VIPGuest',
      joinedDate: new Date().toLocaleDateString('vi-VN')
    };
    setUser(guestUser);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  // Logout
  const logout = () => {
    setUser(null);
  };

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      loginAsGuest,
      logout,
      isAuthModalOpen,
      authModalTab,
      openAuthModal,
      closeAuthModal,
      setAuthModalTab
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
