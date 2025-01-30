'use client';

import { IContact } from "@/models/Contact";
import axios from "axios";
import React, { createContext, useContext, useState, ReactNode } from "react";


interface ContactContextProvider {
  user: any;
  setUser: (temp: any) => void;
  system: any;
  setSystem: (temp: any) => void;
  parentSystem: any;
  setParentSystem: (temp: any) => void;
  selectedContacts: any[];
  setSelectedContacts: (temp: any) => void;
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
  const [selectedContacts, setSelectedContacts] = useState<IContact[]>([]);

  // React.useEffect(() => {
  //   // Fetch user details from API if session exists

  //   console.log(system, 'SYSTEM')
  //   if (system) {
  //     axios.get(`/api/system/${system?.phone}`)
  //       .then((response) => {
  //           if(response.data){
  //             setParentSystem(response.data)
  //           }
  //       })
  //       .catch((error) => {
  //         console.error("Error fetching user data:", error);
  //       })
  //       // .finally(() => setLoading(false));
  // }

  // }, [system]);


  return (
    <ContactContext.Provider value={{ user, setUser, selectedContacts, setSelectedContacts, system, setSystem, parentSystem, setParentSystem }}>
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
