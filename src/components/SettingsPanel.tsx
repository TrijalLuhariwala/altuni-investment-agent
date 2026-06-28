'use client';

import React, { useState, useEffect } from 'react';
import { X, Sliders, Key, Search, ToggleLeft } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AgentConfig) => void;
  initialConfig: AgentConfig;
}

export interface AgentConfig {
  geminiKey: string;
  openaiKey: string;
  tavilyKey: string;
  useMock: boolean;
  preferredProvider: 'gemini' | 'openai';
}

export default function SettingsPanel({ isOpen, onClose, onSave, initialConfig }: SettingsPanelProps) {
  const [config, setConfig] = useState<AgentConfig>(initialConfig);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggle = () => {
    setConfig((prev) => ({
      ...prev,
      useMock: !prev.useMock,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
    onClose();
  };

  return (
    <div className={`settings-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="settings-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <div className="settings-title">
            <Sliders size={20} className="glow-text-purple" />
            <span>Agent Control Center</span>
          </div>
          <button className="settings-close" onClick={onClose} aria-label="Close settings">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-toggle">
            <div className="toggle-label">
              <span className="toggle-label-main">Demo / Simulation Mode</span>
              <span className="toggle-label-sub">Runs offline with rich simulated reports</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={config.useMock}
                onChange={handleToggle}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="form-group" style={{ opacity: config.useMock ? 0.5 : 1, transition: 'opacity 0.3s' }}>
            <label>
              <span>Preferred LLM Provider</span>
              <span>Active Model</span>
            </label>
            <select
              name="preferredProvider"
              value={config.preferredProvider}
              onChange={handleChange}
              disabled={config.useMock}
              className="form-input"
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px', padding: '0.75rem' }}
            >
              <option value="gemini" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Google Gemini (gemini-1.5-flash)</option>
              <option value="openai" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>OpenAI (gpt-4o-mini)</option>
            </select>
          </div>

          <div className="form-group" style={{ opacity: config.useMock ? 0.5 : 1, transition: 'opacity 0.3s' }}>
            <label>
              <span>Gemini API Key</span>
              <span>Google Generative AI</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: '#6B7280' }} />
              <input
                type="password"
                name="geminiKey"
                value={config.geminiKey}
                onChange={handleChange}
                disabled={config.useMock}
                placeholder="AIzaSy..."
                className="form-input"
                style={{ width: '100%', paddingLeft: '32px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ opacity: config.useMock ? 0.5 : 1, transition: 'opacity 0.3s' }}>
            <label>
              <span>OpenAI API Key</span>
              <span>Alternative LLM provider</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: '#6B7280' }} />
              <input
                type="password"
                name="openaiKey"
                value={config.openaiKey}
                onChange={handleChange}
                disabled={config.useMock}
                placeholder="sk-..."
                className="form-input"
                style={{ width: '100%', paddingLeft: '32px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ opacity: config.useMock ? 0.5 : 1, transition: 'opacity 0.3s' }}>
            <label>
              <span>Tavily Search API Key</span>
              <span>For live web search tools</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: '#6B7280' }} />
              <input
                type="password"
                name="tavilyKey"
                value={config.tavilyKey}
                onChange={handleChange}
                disabled={config.useMock}
                placeholder="tvly-..."
                className="form-input"
                style={{ width: '100%', paddingLeft: '32px' }}
              />
            </div>
          </div>

          {config.useMock && (
            <div style={{ fontSize: '0.8rem', color: '#9CA3AF', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              💡 <strong>Note:</strong> In Simulation Mode, no requests are sent to Gemini or Tavily. Simply type a company name (e.g., <em>Tesla</em>, <em>Nvidia</em>, <em>Apple</em>, or any other) on the homepage to see the agent generate instant, realistic reports.
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              Apply Config
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
