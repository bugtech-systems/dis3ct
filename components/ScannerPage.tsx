'use client'
import { useEffect, useState } from 'react';
import { useComponent } from './providers/ComponentContext';

const ScannerDialog: React.FC = () => {
    const { modal, setModal, record, setRecord, scannerStatus, setScannerStatus } = useComponent();
    const [htmlContent, setHtmlContent] = useState<string>('');
    const [open, setOpen] = useState<boolean>(false);

    useEffect(() => {
        if (record) {
            fetch(`/scanner.html?id=${record._id}`)
                .then((res) => res.text())
                .then(setHtmlContent)
                .catch((err) => console.error('Failed to load HTML:', err));
        }



    }, [record]);



    useEffect(() => {
        const script4 = document.createElement('script');
        script4.src = '/lib/jquery.min.js';
        script4.async = true;
        document.body.appendChild(script4);

        const script3 = document.createElement('script');
        script3.src = '/scripts/es6-shim.js';
        script3.async = true;
        document.body.appendChild(script3);

        const script2 = document.createElement('script');
        script2.src = '/scripts/websdk.client.bundle.min.js';
        script2.async = true;
        document.body.appendChild(script2);

        const script1 = document.createElement('script');
        script1.src = '/scripts/fingerprint.sdk.min.js';
        script1.async = true;
        document.body.appendChild(script1);
        const script = document.createElement('script');
        script.src = '/app.js';
        script.async = true;
        document.body.appendChild(script);
        <script src="/lib/jquery.min.js"></script>

        // <script src="scripts/es6-shim.js"></script>
        // <script src="scripts/websdk.client.bundle.min.js"></script>
        // <script src="scripts/fingerprint.sdk.min.js"></script>

        return () => {
            document.body.removeChild(script);
            document.body.removeChild(script1);
        };
    }, []);


    useEffect(() => {
        if (modal == 'scannerPage') {
            setOpen(true)
        } else {
            setOpen(false)
        }

    }, [modal])


    return (
        <div className="p-4">
            {open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white w-[90%] h-[90%] overflow-auto rounded-lg shadow-lg relative">
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute top-2 right-2 text-white bg-red-600 px-3 py-1 rounded"
                        >
                            Close
                        </button>

                        <div
                            className="p-4"
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScannerDialog;
