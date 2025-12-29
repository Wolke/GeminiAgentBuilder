// Main App Component

import { ReactFlowProvider } from '@xyflow/react';
import { NodeCanvas, Toolbar, PropertiesPanel } from './components';
import './App.css';

function App() {
  return (
    <ReactFlowProvider>
      <div className="app">
        <header className="app-header">
          <div className="app-logo">
            <span className="logo-icon">✨</span>
            <h1>Gemini Agent Builder</h1>
          </div>
          <div className="app-subtitle">
            Visual workflow builder for Gemini AI agents
          </div>
        </header>
        <main className="app-main">
          <Toolbar />
          <NodeCanvas />
          <PropertiesPanel />
        </main>
      </div>
    </ReactFlowProvider>
  );
}

export default App;
