// G8N Views - Import n8n Dialog Component

import { useState, useRef, useCallback } from 'react';
import { convertN8nToG8n, type ConversionResult } from '../../services/converter/n8nConverter';
import { useG8nStore } from '../../models/store';
import './ImportN8nDialog.css';

interface ImportN8nDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ImportN8nDialog({ isOpen, onClose }: ImportN8nDialogProps) {
    const [result, setResult] = useState<ConversionResult | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const setWorkflow = useG8nStore((state) => state.setWorkflow);

    const handleFileRead = useCallback((file: File) => {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const conversionResult = convertN8nToG8n(content);
            setResult(conversionResult);
        };
        reader.readAsText(file);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileRead(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.json')) {
            handleFileRead(file);
        }
    };

    const handleImport = () => {
        if (result?.success && result.workflow) {
            setWorkflow(result.workflow);
            onClose();
            setResult(null);
            setFileName(null);
        }
    };

    const handleClose = () => {
        setResult(null);
        setFileName(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="dialog-overlay" onClick={handleClose}>
            <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
                <div className="dialog-header">
                    <h2>Import n8n Workflow</h2>
                    <button className="close-btn" onClick={handleClose}>×</button>
                </div>

                <div className="dialog-body">
                    {!result ? (
                        <div
                            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="drop-icon">📁</div>
                            <p>Drag & drop an n8n workflow JSON file here</p>
                            <p className="sub-text">or click to browse</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </div>
                    ) : (
                        <div className="result-section">
                            <div className="file-name">
                                <span className="icon">📄</span>
                                {fileName}
                            </div>

                            {result.success ? (
                                <>
                                    <div className="success-message">
                                        ✅ Conversion successful!
                                    </div>
                                    <div className="stats">
                                        <div className="stat">
                                            <span className="label">Nodes:</span>
                                            <span className="value">{result.workflow?.nodes.length}</span>
                                        </div>
                                        <div className="stat">
                                            <span className="label">Edges:</span>
                                            <span className="value">{result.workflow?.edges.length}</span>
                                        </div>
                                    </div>

                                    {result.warnings.length > 0 && (
                                        <div className="warnings-section">
                                            <h4>⚠️ Warnings ({result.warnings.length})</h4>
                                            <ul>
                                                {result.warnings.map((w, i) => (
                                                    <li key={i}>
                                                        <strong>{w.nodeName}:</strong> {w.message}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="error-section">
                                    <h4>❌ Conversion Failed</h4>
                                    <ul>
                                        {result.errors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="dialog-footer">
                    <button className="btn-secondary" onClick={handleClose}>
                        Cancel
                    </button>
                    {result?.success && (
                        <button className="btn-primary" onClick={handleImport}>
                            Import Workflow
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
