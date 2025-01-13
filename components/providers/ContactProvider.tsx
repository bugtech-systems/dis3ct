'use client';

import { IContact } from "@/models/Contact";
import React, { createContext, useContext, useState, ReactNode } from "react";


interface ContactContextProvider {
  user: any;
  setUser: (temp: any) => void;
  selectedContacts: any[];
  setSelectedContacts: (temp: any) => void;
}

interface ContactProviderProps {
  children: ReactNode;
  defaultUser?: any;
  
  
}

// Create the context
const ContactContext = createContext<ContactContextProvider | undefined>(undefined);

// Provider component
export const ContactProvider: React.FC<ContactProviderProps> = ({
  children,
  defaultUser,
}) => {
  const [user, setUser] = useState<any>(defaultUser);
  const [selectedContacts, setSelectedContacts] = useState<IContact[]>([]);


  return (
    <ContactContext.Provider value={{ user, setUser, selectedContacts, setSelectedContacts }}>
      {children}
    </ContactContext.Provider>
  );
};

// Custom hook for consuming the context
export const useContact = (): ContactContextProvider => {
  const context = useContext(ContactContext);
  if (!context) {
    throw new Error("useContact must be used within a ContactProvider");
  }
  return context;
};
