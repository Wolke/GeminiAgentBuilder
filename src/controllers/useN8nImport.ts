// G8N Controllers - useN8nImport Hook
// Handles n8n workflow import flow

import { useCallback, useState } from 'react';
import { useG8nStore } from '../models/store';
import { convertN8nToG8n, type ConversionResult } from '../services/converter/n8nConverter';

export function useN8nImport() {
    const setWorkflow = useG8nStore((state) => state.setWorkflow);
    const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Convert n8n JSON string
    const convert = useCallback((jsonString: string) => {
        setIsProcessing(true);

        try {
            const result = convertN8nToG8n(jsonString);
            setConversionResult(result);
            return result;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    // Convert from file
    const convertFromFile = useCallback((file: File): Promise<ConversionResult> => {
        return new Promise((resolve) => {
            setIsProcessing(true);

            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                const result = convertN8nToG8n(content);
                setConversionResult(result);
                setIsProcessing(false);
                resolve(result);
            };
            reader.onerror = () => {
                const result: ConversionResult = {
                    success: false,
                    errors: ['Failed to read file'],
                    warnings: [],
                };
                setConversionResult(result);
                setIsProcessing(false);
                resolve(result);
            };
            reader.readAsText(file);
        });
    }, []);

    // Apply converted workflow
    const applyConversion = useCallback(() => {
        if (conversionResult?.success && conversionResult.workflow) {
            setWorkflow(conversionResult.workflow);
            setConversionResult(null);
            return true;
        }
        return false;
    }, [conversionResult, setWorkflow]);

    // Clear conversion result
    const clearResult = useCallback(() => {
        setConversionResult(null);
    }, []);

    return {
        // State
        conversionResult,
        isProcessing,

        // Actions
        convert,
        convertFromFile,
        applyConversion,
        clearResult,
    };
}
