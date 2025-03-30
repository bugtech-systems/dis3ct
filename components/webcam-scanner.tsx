"use client";

import * as React from "react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Dialog,
    DialogContent,

} from "@/components/ui/dialog";

import toast from "react-hot-toast";
import { useComponent } from "@/components/providers/ComponentContext";
import { findObject, updateOrPushObject } from "@/lib/helpers";
import axios from "axios";
import CamScreen from "./webcam-selector";

export function CamScanner() {
    const { modal, setModal, record } = useComponent();


    // 📌 Handle Form Submission





    console.log(modal, 'MODal')
    return (
        <>
            <Dialog open={modal == 'facecam'} onOpenChange={() => setModal(null)}>
                <DialogContent>
                    <CamScreen camType="scanner" />
                </DialogContent>
            </Dialog >
        </>
    );
}
