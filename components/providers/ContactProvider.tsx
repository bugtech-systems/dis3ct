'use client';

import { IContact } from "@/models/Contact";
import React, { createContext, useContext, useState, ReactNode } from "react";


interface ContactContextProvider {
  user: any;
  setUser: (temp: any) => void;
  contactTable: any[];
  setContactTable: (temp: any) => void;
  system: any;
  setSystem: (temp: any) => void;
  teams: any;
  setTeams: (temp: any) => void;
  parentSystem: any;
  setParentSystem: (temp: any) => void;
  selectedContacts: any[];
  setSelectedContacts: (temp: any) => void;
  filterOpts: any[];
  setFilterOpts: (temp: any) => void;
}

interface ContactProviderProps {
  children: ReactNode;
  defaultUser?: any;
  defaultSystem?: any;
}

// Create the context
const ContactContext = createContext<ContactContextProvider | undefined>(undefined);

// Provider component
export const ContactProvider: React.FC<ContactProviderProps> = ({
  children,
  defaultUser,
  defaultSystem
}) => {
  const [user, setUser] = useState<any>(defaultUser);
  const [system, setSystem] = useState<any>(defaultSystem);
  const [parentSystem, setParentSystem] = useState<any>();
  const [contactTable, setContactTable] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState<IContact[]>([]);
  const [teams, setTeams] = useState<IContact[]>([]);
  const [filterOpts, setFilterOpts] = useState([]);



  return (
    <ContactContext.Provider value={{ filterOpts, setFilterOpts, contactTable, setContactTable, teams, setTeams, user, setUser, selectedContacts, setSelectedContacts, system, setSystem, parentSystem, setParentSystem }}>
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
