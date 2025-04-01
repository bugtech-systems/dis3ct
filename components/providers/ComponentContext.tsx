"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";



interface ComponentContextType {
    modal: string | null;
    setModal: (type: any, id?: any) => void;
    modalId: string | null;
    setModalId: (temp: any) => void;
    record: any;
    setRecord: (temp: any) => void;
    refreshId: any;
    setRefreshId: (temp: any) => void;
    isRefreshing: boolean;
    setIsRefreshing: (temp: any) => void;
    biometricRunning: boolean;
    setBiometricRunning: (temp: any) => void;
    biometricConnected: boolean;
    setBiometricConnected: (temp: any) => void;
    scannerStatus: string;
    setScannerStatus: (temp: any) => void;
    contacts: any;
    setContacts: (temp: any) => void;
    isEnrolling: any;
    setIsEnrolling: (temp: any) => void;
    error: any;
    setError: (temp: any) => void;
    tab: any;
    setTab: (temp: any) => void;
}

const ComponentContext = createContext<ComponentContextType | undefined>(undefined);

export const ComponentProvider = ({ children }: { children: ReactNode }) => {
    const [modal, setModal] = useState<any>(null);
    const [modalId, setModalId] = useState<any>(null);
    const [tab, setTab] = useState<any>('image');
    const [record, setRecord] = useState<any>(null);
    const [refreshId, setRefreshId] = useState<any>(null);
    const [isRefreshing, setIsRefreshing] = useState<any>(false);
    const [biometricRunning, setBiometricRunning] = useState<any>(false);
    const [biometricConnected, setBiometricConnected] = useState<any>(false);
    const [contacts, setContacts] = useState<any>([]);
    const [scannerStatus, setScannerStatus] = useState("Disconnected");
    const [isEnrolling, setIsEnrolling] = React.useState(false);
    const [error, setError] = React.useState(null)

    const handleModal = (type: any, id: any) => {
        if (type) {
            setModal(type)
            setModalId(id)

        } else {
            setModal(null)
            setModalId(null)
            setRecord(null)
        }

    }

    const handleRefreshId = (e: any) => {
        setRefreshId(e ? Math.random() : null)
    }


    return (
        <ComponentContext.Provider value={{ contacts, setContacts, tab, setTab, error, setError, isEnrolling, setIsEnrolling, record, setRecord, biometricRunning, setBiometricRunning, biometricConnected, setBiometricConnected, scannerStatus, setScannerStatus, isRefreshing, setIsRefreshing, refreshId, setRefreshId: handleRefreshId, modal, setModal: (type, id) => handleModal(type, id), modalId, setModalId }}>
            {children}
        </ComponentContext.Provider>
    );
};

export const useComponent = () => {
    const context = useContext(ComponentContext);
    if (!context) {
        throw new Error("useComponent must be used within a ComponentProvider");
    }
    return context;
};