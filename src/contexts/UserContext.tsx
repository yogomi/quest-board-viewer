import React, { createContext, useState, useEffect, useContext } from 'react';

type User = {
  id: string;
  loginId: string;
  name: string;
  email?: string;
  image?: string;
  guildStaff?: boolean;
  systemAdministrator?: boolean;
  enabled?: boolean;
} | null;

const UserContext = createContext<{
  user: User;
  setUser: (user: User) => void;
}>({
  user: null,
  setUser: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);

  // ロード時に /auth/session を叩いてセッション確認
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/quest-board/api/v1/user/login-session-info', {
          credentials: 'include',
        });
        if (!res.ok) return;
        const json = await res.json();

        // Handle both old and new response formats
        if (json.success !== undefined) {
          // New unified format
          if (json.success && json.data && json.data.user) {
            setUser(json.data.user);
          }
        } else if (json.data.user) {
          // Old format (backwards compatibility)
          setUser(json.data.user);
        }
      } catch (err) {
        console.error('セッション取得失敗:', err);
      }
    };
    fetchSession();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
