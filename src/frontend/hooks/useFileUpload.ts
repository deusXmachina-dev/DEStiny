"use client";

import { useState, useCallback, useRef } from 'react';

interface FileUploadState {
    file: File | null;
    fileName: string | null;
    fileContent: string | null;
}

interface UseFileUploadOptions {
    acceptFileTypes?: string;
    onSuccess?: (file: File, content: string) => void;
}

interface UseFileUploadReturn extends FileUploadState {
    triggerFileUpload: () => void;
    reset: () => void;
}

export const useFileUpload = ({ 
    acceptFileTypes = '.json,.txt',
    onSuccess,
}: UseFileUploadOptions = {}): UseFileUploadReturn => {
    const [state, setState] = useState<FileUploadState>({
        file: null,
        fileName: null,
        fileContent: null,
    });
    
    // Use ref to avoid stale closure issues with onSuccess callback
    const onSuccessRef = useRef(onSuccess);
    onSuccessRef.current = onSuccess;

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
                    onSuccessRef.current?.(file, text);
                } catch (error) {
                    console.error("Error reading file:", error);
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
