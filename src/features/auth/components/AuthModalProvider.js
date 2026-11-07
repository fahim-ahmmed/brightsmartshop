'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import RegisterModal from './RegisterModal';

const AuthModalContext = createContext({ openRegister: () => {} });
export const useAuthModal = () => useContext(AuthModalContext);

export default function AuthModalProvider({ children }) {
  const [registerOpen, setRegisterOpen] = useState(false);
  const openRegister = useCallback(() => setRegisterOpen(true), []);
  const value = useMemo(() => ({ openRegister }), [openRegister]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <RegisterModal isOpen={registerOpen} onOpenChange={setRegisterOpen} />
    </AuthModalContext.Provider>
  );
}
