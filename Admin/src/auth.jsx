import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { adminLogin, adminMe, session } from './api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => session.get()?.admin || null);
  const [checking, setChecking] = useState(() => Boolean(session.get()?.token));

  const logout = useCallback(() => {
    session.clear();
    setAdmin(null);
  }, []);

  // Kapag may naka-save na login, i-verify muna sa server kung valid pa
  useEffect(() => {
    if (!session.get()?.token) return;
    adminMe()
      .catch((e) => { if (e.status === 401) logout(); })
      .finally(() => setChecking(false));
  }, [logout]);

  const login = async (username, password) => {
    const { token, admin: a } = await adminLogin(username, password);
    session.set({ token, admin: a });
    setAdmin(a);
    return a;
  };

  return (
    <AuthContext.Provider value={{ admin, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
