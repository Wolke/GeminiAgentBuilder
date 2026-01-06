// G8N - Gemini Agent Builder
// Main Application Component

import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from './views/Canvas';
import { Toolbar } from './views/Toolbar';
import { PropertiesPanel } from './views/PropertiesPanel';
import { ChatPanel } from './views/ChatPanel';
import { useG8nStore } from './models/store';
import './styles/theme.css';

function App() {
    const appMode = useG8nStore((state) => state.ui.appMode);

    return (
        <ReactFlowProvider>
            <div className="g8n-app">
                <header className="g8n-header">
                    <div className="g8n-logo">
                        <span className="logo-icon">⚡</span>
                        <h1>G8N</h1>
                    </div>
                    <div className="mode-toggle">
                        <ModeToggle />
                    </div>
                </header>
                <main className="g8n-main">
                    {appMode === 'edit' && <Toolbar />}
                    <Canvas />
                    {appMode === 'edit' ? <PropertiesPanel /> : <ChatPanel />}
                </main>
            </div>
        </ReactFlowProvider>
    );
}

function ModeToggle() {
    // Use separate selectors to avoid returning new object each render
    const appMode = useG8nStore((state) => state.ui.appMode);
    const setAppMode = useG8nStore((state) => state.setAppMode);

    return (
        <>
            <button
                className={`mode-btn ${appMode === 'edit' ? 'active' : ''}`}
                onClick={() => setAppMode('edit')}
            >
                ✏️ Edit
            </button>
            <button
                className={`mode-btn ${appMode === 'run' ? 'active' : ''}`}
                onClick={() => setAppMode('run')}
            >
                ▶ Run
            </button>
        </>
    );
}

export default App;

