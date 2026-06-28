'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Search, 
  Building2, 
  Play, 
  Terminal as TerminalIcon, 
  ArrowRight, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import SettingsPanel, { AgentConfig } from '@/components/SettingsPanel';
import ResearchReport from '@/components/ResearchReport';
import { ResearchStep, ResearchReport as ReportType } from '@/lib/agent';

const DEFAULT_CONFIG: AgentConfig = {
  geminiKey: '',
  openaiKey: '',
  tavilyKey: '',
  useMock: true,
  preferredProvider: 'gemini',
};

export default function Home() {
  const [companyName, setCompanyName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logs, setLogs] = useState<ResearchStep[]>([]);
  const [activeStep, setActiveStep] = useState<ResearchStep | null>(null);
  const [report, setReport] = useState<ReportType | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Settings panel state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Load config from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('altuni_agent_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved config', e);
      }
    }
  }, []);

  // Save config to localStorage
  const handleSaveConfig = (newConfig: AgentConfig) => {
    setConfig(newConfig);
    localStorage.setItem('altuni_agent_config', JSON.stringify(newConfig));
  };

  // Scroll terminal to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeStep]);

  const startAnalysis = async (company: string) => {
    if (!company.trim()) return;
    
    setIsAnalyzing(true);
    setLogs([]);
    setActiveStep(null);
    setReport(null);
    setError(null);

    const normCompany = company.trim();

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: normCompany,
          config,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error occurred');
      }

      if (!response.body) {
        throw new Error('ReadableStream is not supported by backend response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        
        // Save the last partial line back to the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);
              
              if (event.type === 'step') {
                const step: ResearchStep = event.data;
                
                setActiveStep(step);
                
                // If it is a completed step, push it to history logs
                if (step.status === 'completed' || step.status === 'failed') {
                  setLogs((prev) => [...prev, step]);
                }
              } else if (event.type === 'report') {
                setReport(event.data);
                setIsAnalyzing(false);
                setActiveStep(null);
              } else if (event.type === 'error') {
                setError(event.data);
                setIsAnalyzing(false);
                setActiveStep(null);
              }
            } catch (e) {
              console.error('Failed to parse SSE line:', line, e);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'An unexpected communication error occurred.');
      setIsAnalyzing(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startAnalysis(companyName);
  };

  const handleQuickTagClick = (tag: string) => {
    setCompanyName(tag);
    startAnalysis(tag);
  };

  const getPhaseName = (phase: string) => {
    switch (phase) {
      case 'profile': return 'Business Model';
      case 'financials': return 'Financials';
      case 'moat': return 'Moat & Competition';
      case 'sentiment': return 'Sentiment & Risks';
      case 'synthesis': return 'Synthesis Decision';
      default: return phase;
    }
  };

  const getFormattedTime = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-badge">IR</div>
          <div className="logo-text">
            <h1>Altuni Analyst</h1>
            <span>InsideIIM × Altuni AI Labs</span>
          </div>
        </div>

        <div className="header-actions">
          {config.useMock && (
            <div 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: 'rgba(245, 158, 11, 0.08)', 
                color: 'var(--warning)', 
                fontSize: '0.8rem',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}
            >
              <HelpCircle size={14} />
              <span>Simulation Mode Active</span>
            </div>
          )}
          
          <button 
            className="btn-secondary" 
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open config settings"
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {/* Search Console */}
      <section className="search-container">
        <form onSubmit={handleSearchSubmit} className="search-box">
          <div className="search-input-wrapper">
            <Building2 className="search-icon-decor" size={20} />
            <input
              type="text"
              className="search-input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name (e.g. Nvidia, Tesla, Microsoft, TCS)..."
              disabled={isAnalyzing}
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isAnalyzing || !companyName.trim()}
          >
            <Play size={16} />
            <span>Analyze</span>
          </button>
        </form>

        <div className="quick-tags">
          <span className="quick-tag-label">Suggested Companies:</span>
          <button 
            className="tag-btn" 
            onClick={() => handleQuickTagClick('InsideIIM')}
            disabled={isAnalyzing}
          >
            InsideIIM
          </button>
          <button 
            className="tag-btn" 
            onClick={() => handleQuickTagClick('Altuni AI Labs')}
            disabled={isAnalyzing}
          >
            Altuni AI Labs
          </button>
          <button 
            className="tag-btn" 
            onClick={() => handleQuickTagClick('Nvidia')}
            disabled={isAnalyzing}
          >
            Nvidia
          </button>
          <button 
            className="tag-btn" 
            onClick={() => handleQuickTagClick('Tesla')}
            disabled={isAnalyzing}
          >
            Tesla
          </button>
          <button 
            className="tag-btn" 
            onClick={() => handleQuickTagClick('Apple')}
            disabled={isAnalyzing}
          >
            Apple
          </button>
        </div>
      </section>

      {/* Terminal Log Output during analysis */}
      {(isAnalyzing || logs.length > 0 || activeStep) && (
        <section className="terminal-container">
          <div className="terminal-header">
            <div className="terminal-dots">
              <div className="terminal-dot dot-red"></div>
              <div className="terminal-dot dot-yellow"></div>
              <div className="terminal-dot dot-green"></div>
            </div>
            <div className="terminal-title">
              <TerminalIcon size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              <span>agent@altuni-labs:~/research-terminal</span>
            </div>
            <div style={{ width: '40px' }}></div>
          </div>

          <div className="terminal-body">
            {logs.map((log, index) => (
              <div className="log-entry" key={index}>
                <span className="log-time">[{getFormattedTime()}]</span>
                <span className="log-bullet">&gt;</span>
                <span className="log-text">
                  <strong className={`log-phase-${log.phase}`}>{getPhaseName(log.phase)}</strong>:{' '}
                  {log.message}
                </span>
              </div>
            ))}
            
            {activeStep && activeStep.status !== 'completed' && activeStep.status !== 'failed' && (
              <div className="log-entry" style={{ opacity: 0.85 }}>
                <span className="log-time">[{getFormattedTime()}]</span>
                <span className="log-bullet">&gt;</span>
                <span className="log-text">
                  <strong className={`log-phase-${activeStep.phase}`}>{getPhaseName(activeStep.phase)}</strong>:{' '}
                  {activeStep.message}
                  <span className="pulse-loader">
                    <span className="pulse-bubble"></span>
                    <span className="pulse-bubble"></span>
                    <span className="pulse-bubble"></span>
                  </span>
                </span>
              </div>
            )}

            {isAnalyzing && !activeStep && logs.length === 0 && (
              <div className="log-entry">
                <span className="log-time">[{getFormattedTime()}]</span>
                <span className="log-bullet">&gt;</span>
                <span className="log-text">Initializing agent workspace and connections...</span>
              </div>
            )}

            <div ref={terminalEndRef} />
          </div>
        </section>
      )}

      {/* Error Message Box */}
      {error && (
        <div 
          className="glass-panel" 
          style={{ 
            borderColor: 'var(--danger)', 
            background: 'var(--danger-glow)', 
            padding: '1.5rem', 
            borderRadius: '12px',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}
        >
          <AlertCircle size={24} style={{ color: 'var(--danger)' }} />
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontWeight: 700 }}>Analysis Encountered an Error</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Report Showcase */}
      {report && !isAnalyzing && (
        <section style={{ animation: 'fadeIn 0.6s ease' }}>
          <ResearchReport report={report} />
        </section>
      )}

      {/* Settings Sliding Modal Drawer */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveConfig}
        initialConfig={config}
      />

      {/* Footer Branding */}
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Altuni AI Labs. Developed for InsideIIM Take-Home Assignment.</p>
        <p style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>Powered by Next.js & LangChain.js</p>
      </footer>
    </div>
  );
}
