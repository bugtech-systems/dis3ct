'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';

// Optional: put your backend socket URL here
const SOCKET_URL = 'https://dis3ct.sharewin.pro';

let socket: ReturnType<typeof io> | null = null;

export default function SocketRedirector() {
    const router = useRouter();

    useEffect(() => {
        if (!socket) {
            socket = io(SOCKET_URL);
        }

        const handleRedirect = (data: { path: string; params?: Record<string, string> }) => {
            const queryParams = data.params
                ? '?' + new URLSearchParams(data.params).toString()
                : '';
            const target = `${data.path}${queryParams}`;
            router.push(target);
        };

        socket.on('redirectTo', handleRedirect);

        return () => {
            socket?.off('redirectTo', handleRedirect);
        };
    }, [router]);

    return null; // does not render anything
}
