'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  BookOpen, 
  Download, 
  ExternalLink,
  Info,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { ResearchReport as ReportType } from '@/lib/agent';

interface ResearchReportProps {
  report: ReportType;
}

// Simple regex-based Markdown-to-HTML parser to avoid external dependencies
function renderSimpleMarkdown(md: string): { __html: string } {
  if (!md) return { __html: '' };
  
  let html = md
    // Escape HTML tags slightly (basic protection)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Restore markdown headers which got escaped
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Bullet lists
    .replace(/^\s*[-*]\s+(.*?)$/gm, '<li>$1</li>')
    // Wrap lists
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    // Clean up consecutive ul elements
    .replace(/<\/ul>\s*<ul>/g, '')
    // Paragraphs (split by double newlines, wrap non-blocks)
    .split(/\n\n+/)
    .map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li')) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');

  return { __html: html };
}

export default function ResearchReport({ report }: ResearchReportProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'financials' | 'moat' | 'sentiment'>('profile');

  const {
    companyName,
    decision,
    thesisSummary,
    scores,
    details,
    pros,
    cons,
    risks,
    sources
  } = report;

  const handlePrint = () => {
    window.print();
  };

  // Helper for progress ring circle math
  const strokeDashoffset = (score: number) => {
    const radius = 26;
    const circumference = 2 * Math.PI * radius;
    return circumference - (score / 100) * circumference;
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'color-success';
    if (score >= 60) return 'color-warning';
    return 'color-danger';
  };

  return (
    <div className="report-layout">
      {/* Header Decision Card */}
      <div className={`glass-panel decision-card ${decision === 'INVEST' ? 'decision-invest' : 'decision-pass'}`}>
        <div className="decision-header-row">
          <div className="company-title-info">
            <h2>{companyName}</h2>
            <p>Comprehensive Equity Investment Analysis</p>
          </div>
          
          <div className={`decision-badge ${decision === 'INVEST' ? 'invest' : 'pass'}`}>
            {decision === 'INVEST' ? (
              <>
                <CheckCircle2 size={24} />
                <span>INVEST / BUY</span>
              </>
            ) : (
              <>
                <XCircle size={24} />
                <span>PASS / HOLD</span>
              </>
            )}
          </div>
        </div>

        <div className="thesis-box">
          <h4>Investment Thesis Summary</h4>
          <p>"{thesisSummary}"</p>
        </div>
      </div>

      {/* Scores Dashboard */}
      <div className="scores-grid">
        {/* Financial Health */}
        <div className="glass-panel score-card">
          <div className="score-circle-wrapper">
            <svg className="score-svg">
              <circle className="score-bg-ring" cx="30" cy="30" r="26" />
              <circle 
                className={`score-fill-ring ${getScoreColorClass(scores.financialHealth)}`} 
                cx="30" 
                cy="30" 
                r="26" 
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={strokeDashoffset(scores.financialHealth)}
              />
            </svg>
            <span className="score-text-val">{scores.financialHealth}</span>
          </div>
          <div className="score-label-group">
            <span className="score-label">Financials</span>
            <span className="score-desc">
              {scores.financialHealth >= 80 ? 'Excellent' : scores.financialHealth >= 60 ? 'Moderate' : 'Strained'}
            </span>
          </div>
        </div>

        {/* Competitive Moat */}
        <div className="glass-panel score-card">
          <div className="score-circle-wrapper">
            <svg className="score-svg">
              <circle className="score-bg-ring" cx="30" cy="30" r="26" />
              <circle 
                className={`score-fill-ring ${getScoreColorClass(scores.competitiveMoat)}`} 
                cx="30" 
                cy="30" 
                r="26" 
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={strokeDashoffset(scores.competitiveMoat)}
              />
            </svg>
            <span className="score-text-val">{scores.competitiveMoat}</span>
          </div>
          <div className="score-label-group">
            <span className="score-label">Moat Strength</span>
            <span className="score-desc">
              {scores.competitiveMoat >= 80 ? 'Wide Moat' : scores.competitiveMoat >= 60 ? 'Narrow Moat' : 'No Moat'}
            </span>
          </div>
        </div>

        {/* Growth Potential */}
        <div className="glass-panel score-card">
          <div className="score-circle-wrapper">
            <svg className="score-svg">
              <circle className="score-bg-ring" cx="30" cy="30" r="26" />
              <circle 
                className={`score-fill-ring ${getScoreColorClass(scores.growthPotential)}`} 
                cx="30" 
                cy="30" 
                r="26" 
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={strokeDashoffset(scores.growthPotential)}
              />
            </svg>
            <span className="score-text-val">{scores.growthPotential}</span>
          </div>
          <div className="score-label-group">
            <span className="score-label">Growth Outlook</span>
            <span className="score-desc">
              {scores.growthPotential >= 80 ? 'High Growth' : scores.growthPotential >= 60 ? 'Steady' : 'Slowing'}
            </span>
          </div>
        </div>

        {/* News Sentiment */}
        <div className="glass-panel score-card">
          <div className="score-circle-wrapper">
            <svg className="score-svg">
              <circle className="score-bg-ring" cx="30" cy="30" r="26" />
              <circle 
                className={`score-fill-ring ${getScoreColorClass(scores.newsSentiment)}`} 
                cx="30" 
                cy="30" 
                r="26" 
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={strokeDashoffset(scores.newsSentiment)}
              />
            </svg>
            <span className="score-text-val">{scores.newsSentiment}</span>
          </div>
          <div className="score-label-group">
            <span className="score-label">Sentiment</span>
            <span className="score-desc">
              {scores.newsSentiment >= 85 ? 'Bullish' : scores.newsSentiment >= 55 ? 'Neutral' : 'Bearish'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Research Details Tabs */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div className="tabs-container">
          <div className="tabs-nav">
            <button 
              className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Business Model
            </button>
            <button 
              className={`tab-button ${activeTab === 'financials' ? 'active' : ''}`}
              onClick={() => setActiveTab('financials')}
            >
              Financial Health
            </button>
            <button 
              className={`tab-button ${activeTab === 'moat' ? 'active' : ''}`}
              onClick={() => setActiveTab('moat')}
            >
              Moat & Competition
            </button>
            <button 
              className={`tab-button ${activeTab === 'sentiment' ? 'active' : ''}`}
              onClick={() => setActiveTab('sentiment')}
            >
              News & Headwinds
            </button>
          </div>

          <div className="tab-content">
            <div className="print-section-header">Business Model & Profile</div>
            <div 
              className={`tab-pane ${activeTab === 'profile' ? 'active' : ''}`}
              dangerouslySetInnerHTML={renderSimpleMarkdown(details.businessModel)} 
            />
            
            <div className="print-section-header">Financial Health & Growth</div>
            <div 
              className={`tab-pane ${activeTab === 'financials' ? 'active' : ''}`}
              dangerouslySetInnerHTML={renderSimpleMarkdown(details.financialHealth)} 
            />
            
            <div className="print-section-header">Moat & Competition Analysis</div>
            <div 
              className={`tab-pane ${activeTab === 'moat' ? 'active' : ''}`}
              dangerouslySetInnerHTML={renderSimpleMarkdown(details.competitorsAndMoat)} 
            />
            
            <div className="print-section-header">News & Risk Sentiment</div>
            <div 
              className={`tab-pane ${activeTab === 'sentiment' ? 'active' : ''}`}
              dangerouslySetInnerHTML={renderSimpleMarkdown(details.newsAndSentiment)} 
            />
          </div>
        </div>
      </div>

      {/* Pros & Cons Section */}
      <div className="pros-cons-grid">
        {/* Pros Card */}
        <div className="glass-panel pro-con-card" style={{ borderTop: '4px solid var(--success)' }}>
          <div className="pro-con-title pro">
            <TrendingUp size={22} />
            <span>Key Catalysts / Strengths</span>
          </div>
          <ul className="pro-con-list">
            {pros.map((pro, index) => (
              <li key={index} className="pro-con-item">
                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons Card */}
        <div className="glass-panel pro-con-card" style={{ borderTop: '4px solid var(--danger)' }}>
          <div className="pro-con-title con">
            <TrendingDown size={22} />
            <span>Concerns / Weaknesses</span>
          </div>
          <ul className="pro-con-list">
            {cons.map((con, index) => (
              <li key={index} className="pro-con-item">
                <XCircle size={16} style={{ color: 'var(--danger)' }} />
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Risks Table Section */}
      {risks && risks.length > 0 && (
        <div className="glass-panel risks-section" style={{ padding: '2rem' }}>
          <h3>
            <AlertTriangle size={22} className="glow-text-red" style={{ color: 'var(--danger)' }} />
            <span>Risk Matrix / Headwinds</span>
          </h3>
          
          <div className="risk-table-container">
            <table className="risk-table">
              <thead>
                <tr>
                  <th>Risk Factor</th>
                  <th>Impact</th>
                  <th>Probability</th>
                </tr>
              </thead>
              <tbody>
                {risks.map((r, index) => (
                  <tr key={index}>
                    <td>{r.risk}</td>
                    <td>
                      <span className={`pill-badge level-${r.impact?.toLowerCase()}`}>
                        {r.impact}
                      </span>
                    </td>
                    <td>
                      <span className={`pill-badge level-${r.probability?.toLowerCase()}`}>
                        {r.probability}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Citations / Sources */}
      {sources && sources.length > 0 && (
        <div className="sources-section">
          <h3>
            <BookOpen size={20} style={{ color: 'var(--accent-primary)' }} />
            <span>Research References ({sources.length})</span>
          </h3>
          <div className="sources-grid">
            {sources.map((s, index) => (
              <div className="glass-panel source-item-card" key={index}>
                <h4>{s.title}</h4>
                <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>Visit Source</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Options */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
        <button className="btn-primary" onClick={handlePrint}>
          <Download size={18} />
          <span>Export PDF Report</span>
        </button>
      </div>
    </div>
  );
}
