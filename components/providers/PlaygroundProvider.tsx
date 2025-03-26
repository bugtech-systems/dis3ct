'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Preset } from "../playground/data/presets"
import { Model } from "../playground/data/models";
import { models } from "../playground/data/models"
import { IAiPreset } from "@/models/AiPreset";
import axios from "axios";
import { useContact } from "./ContactProvider";

interface PlaygroundContextType {
  selectedContact: any;
  setSelectedContact: (contact: any) => void;
  selectedPreset: any | null;
  setSelectedPreset: (preset: any | null) => void;
  preset: any;
  setPreset: (event: string) => void;
  userMessage: string;
  setUserMessage: (event: string) => void;
  messages: any;
  setMessages: (temp: any) => void;
  conversations: any;
  setConversations: (temp: any) => void;
  presets: any;
  setPresets: (temp: any) => void;
}

interface PlaygroundProviderProps {
  children: ReactNode;
  defaultSelectedPreset?: any;
  defaultSelectedModel?: any;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
  defaultTopP?: number;
  defaultSystemBehavior?: string;
  defaultUserMessage?: string;
  defaultMessages?: any;
  defaultPresets?: any;
  defaultPreset?: any;

}

// Create the context
const PlaygroundContext = createContext<PlaygroundContextType | undefined>(undefined);

// Provider component
export const PlaygroundProvider: React.FC<PlaygroundProviderProps> = ({
  children,
  defaultSelectedPreset = {
    topP: 0.9,
    maxTokens: 2000,
    temperature: 0.3
  },
  defaultUserMessage = "",
  defaultMessages = [],
  defaultPresets = [],
  defaultPreset = {
    temperature: 0.2,
    maxTokens: 2000,
    topP: 0.9,
    systemBehavior: "",
    aiModel: "llama3.2"
  }

}) => {
  const { user, system } = useContact();
  const [selectedPreset, setSelectedPreset] = useState<IAiPreset | null>(defaultSelectedPreset);
  const [userMessage, setUserMessage] = useState<string>(defaultUserMessage);
  const [messages, setMessages] = useState<any>(defaultMessages);
  const [conversations, setConversations] = useState<any>(defaultMessages);
  const [presets, setPresets] = useState<any>(defaultPresets);
  const [preset, setPreset] = useState<any | null>(defaultPreset);
  const [selectedContact, setSelectedContact] = useState<any>(null);


  const getConversations = async () => {
    try {
      // setIsLoading(true);
      /*    axios.get(`/api/conversations?contact=${user.phone}&system=${system.phone}&preset=${selectedPreset?.value}`)
         .then((response) => {
             if(response.data){
               setConversations(response.data)
             }
         })
         .catch((error) => {
           console.error("Error fetching user data:", error);
         }) */
      const response = await fetch(`/api/interactions?contact=${user.phone}&system=${system.phone}${selectedPreset?.value ? `&preset=${selectedPreset?._id}` : ''}`); // Update the endpoint URL if necessary

      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();
      if (data && Array.isArray(data)) {
        setMessages(data); // Assuming `data.data` contains the conversations array
      }

    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      // setIsLoading(false);
    }
  };

  useEffect(() => {

    if (selectedPreset) {
      console.log(selectedPreset, 'SELECTED')
      setPreset(selectedPreset)
      getConversations()

    } else {
      setConversations([]);
      // setMessages()
      setPreset(defaultPreset)

    }


  }, [selectedPreset])





  return (
    <PlaygroundContext.Provider value={{ selectedContact, setSelectedContact, preset, setPreset, presets, setPresets, conversations, setConversations, messages, setMessages, userMessage, setUserMessage, selectedPreset, setSelectedPreset }}>
      {children}
    </PlaygroundContext.Provider>
  );
};

// Custom hook for consuming the context
export const usePlayground = (): PlaygroundContextType => {
  const context = useContext(PlaygroundContext);
  if (!context) {
    throw new Error("usePlayground must be used within a PlaygroundProvider");
  }
  return context;
};
