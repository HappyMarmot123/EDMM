"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface ToggleContextType {
  isOpen: boolean;
  openToggle: () => void;
  closeToggle: () => void;
}

const ToggleContext = createContext<ToggleContextType | undefined>(undefined);

export const ToggleProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openToggle = () => setIsOpen(true);
  const closeToggle = () => setIsOpen(false);

  return (
    <ToggleContext.Provider value={{ isOpen, openToggle, closeToggle }}>
      {children}
    </ToggleContext.Provider>
  );
};

export const useToggle = () => {
  const context = useContext(ToggleContext);
  if (context === undefined) {
    throw new Error("useToggle must be used within a ToggleProvider");
  }
  return context;
};
