"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";



interface ComponentContextType {
    modal: string | null;
    setModal: (type: any, id?: any) => void;
    modalId: string | null;
    setModalId: (temp: any) => void;
}

const ComponentContext = createContext<ComponentContextType | undefined>(undefined);

export const ComponentProvider = ({ children }: { children: ReactNode }) => {
    const [modal, setModal] = useState<any>(null);
    const [modalId, setModalId] = useState<any>(null);

    const handleModal = (type: any, id: any) => {
        if (type) {
            setModal(type)
            setModalId(id)

        } else {
            setModal(null)
            setModalId(null)
        }

    }


    return (
        <ComponentContext.Provider value={{ modal, setModal: (type, id) => handleModal(type, id), modalId, setModalId }}>
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