import { useState, useCallback } from 'react';

interface FileUploadState {
    file: File | null;
    fileName: string | null;
    fileContent: string | null;
}

interface UseFileUploadReturn extends FileUploadState {
    triggerFileUpload: () => void;
    reset: () => void;
}

export const useFileUpload = ({ acceptFileTypes = '.json,.txt' }: { acceptFileTypes?: string } = {}): UseFileUploadReturn => {
    const [state, setState] = useState<FileUploadState>({
        file: null,
        fileName: null,
        fileContent: null,
    });

    const triggerFileUpload = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = acceptFileTypes;

        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];

            if (file) {
                try {
                    const text = await file.text();
                    setState({
                        file,
                        fileName: file.name,
                        fileContent: text,
                    });
                } catch (error) {
                    console.error("Error reading file:", error);
                    // Optionally handle error state here
                }
            }
        };

        input.click();
    }, [acceptFileTypes]);

    const reset = useCallback(() => {
        setState({
            file: null,
            fileName: null,
            fileContent: null,
        });
    }, []);

    return {
        ...state,
        triggerFileUpload,
        reset,
    };
};
