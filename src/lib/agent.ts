import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export interface ResearchStep {
  phase: 'profile' | 'financials' | 'moat' | 'sentiment' | 'synthesis';
  status: 'pending' | 'searching' | 'reading' | 'analyzing' | 'completed' | 'failed';
  message: string;
  data?: any;
}

export interface ResearchReport {
  companyName: string;
  decision: 'INVEST' | 'PASS';
  thesisSummary: string;
  scores: {
    financialHealth: number;
    competitiveMoat: number;
    growthPotential: number;
    newsSentiment: number;
  };
  details: {
    businessModel: string;
    financialHealth: string;
    competitorsAndMoat: string;
    newsAndSentiment: string;
  };
  pros: string[];
  cons: string[];
  risks: {
    risk: string;
    impact: 'Low' | 'Medium' | 'High';
    probability: 'Low' | 'Medium' | 'High';
  }[];
  sources: { title: string; url: string }[];
}

// Simple DuckDuckGo HTML Scraper as a free fallback
async function searchDDG(query: string): Promise<{ title: string; url: string; content: string }[]> {
  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!response.ok) return [];
    const html = await response.text();
    const results: { title: string; url: string; content: string }[] = [];
    
    // Regex matches the result blocks in DuckDuckGo HTML search results
    const regex = /<a class="result__snippet"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>|<a class="result__url" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    
    // Alternate regex fallback for standard DDG HTML layout
    const altRegex = /<a class="result__link" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    
    let match;
    while ((match = altRegex.exec(html)) !== null && results.length < 5) {
      let rawUrl = match[1];
      let url = rawUrl;
      // Extract redirect url if needed
      if (url.includes('uddg=')) {
        const parts = url.split('uddg=');
        url = decodeURIComponent(parts[1].split('&')[0]);
      }
      
      const title = match[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      const content = match[3].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      
      if (url && title && content) {
        results.push({ title, url, content });
      }
    }
    
    return results;
  } catch (error) {
    console.error('DDG search failed:', error);
    return [];
  }
}

// Search Tavily API
async function searchTavily(query: string, apiKey: string): Promise<{ title: string; url: string; content: string }[]> {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'advanced',
        include_answer: false,
      }),
    });
    if (!response.ok) {
      throw new Error(`Tavily error: ${response.statusText}`);
    }
    const data = await response.json();
    return (data.results || []).map((r: any) => ({
      title: r.title || 'Search Result',
      url: r.url || '',
      content: r.content || '',
    }));
  } catch (error) {
    console.error('Tavily search failed, falling back to DDG:', error);
    return searchDDG(query);
  }
}

// Search entry point
async function searchWeb(query: string, tavilyKey?: string): Promise<{ title: string; url: string; content: string }[]> {
  if (tavilyKey) {
    return searchTavily(query, tavilyKey);
  }
  return searchDDG(query);
}

// Simulation/Demo mode data generator for instant out-of-the-box experience
function generateSimulatedReport(companyName: string): { steps: ResearchStep[], report: ResearchReport } {
  const normName = companyName.toLowerCase().trim();
  const isTesla = normName.includes('tesla') || normName === 'tsla';
  const isNvidia = normName.includes('nvidia') || normName === 'nvda';
  const isApple = normName.includes('apple') || normName === 'aapl';
  const isInsideIIM = normName.includes('insideiim') || normName.includes('inside iim');
  const isAltuni = normName.includes('altuni');
  
  let decision: 'INVEST' | 'PASS' = 'INVEST';
  let thesisSummary = '';
  let scores = { financialHealth: 85, competitiveMoat: 80, growthPotential: 75, newsSentiment: 70 };
  let details = { businessModel: '', financialHealth: '', competitorsAndMoat: '', newsAndSentiment: '' };
  let pros: string[] = [];
  let cons: string[] = [];
  let risks: any[] = [];
  let sources: any[] = [];

  if (isTesla) {
    decision = 'PASS';
    thesisSummary = 'Tesla faces rising global EV competition, squeezing operating margins, and slowing consumer demand, offset by potential but highly uncertain AI/robotics initiatives.';
    scores = { financialHealth: 72, competitiveMoat: 78, growthPotential: 82, newsSentiment: 55 };
    details = {
      businessModel: `Tesla, Inc. designs, develops, manufactures, sells, and leases fully electric vehicles, energy generation, and storage systems. Its primary segments are **Automotive** (sale of EVs and regulatory credits) and **Energy Generation & Storage** (Powerwall, Megapack, and solar panels). Tesla owns its direct-to-consumer sales channel and global Supercharger network, bypassing traditional dealerships.`,
      financialHealth: `While Tesla maintains a strong balance sheet with over $30B in cash and minimal debt, its automotive gross margins (ex-credits) have compressed from peak levels of >25% down to ~15-16% due to price cuts. Revenue growth has slowed to single digits, and net income has trended downwards, reflecting intense price competition in China and Europe.`,
      competitorsAndMoat: `Tesla's moat consists of its **Supercharger network**, its **proprietary manufacturing scale** (Gigafactories), and its brand equity. However, this moat is shrinking as legacy automakers and Chinese pure-plays (BYD, Xiaomi, Li Auto) offer high-quality EVs at competitive price points. Tesla relies heavily on its Full Self-Driving (FSD) beta and robotaxi plans to re-establish a high-margin moat.`,
      newsAndSentiment: `Recent news is dominated by debates surrounding FSD v12 rollouts, Model 2/affordable vehicle delays, Cybertruck production bottlenecks, and Elon Musk's compensation packages. Regulatory investigations into autopilot safety create headwinds, and consumer sentiment shows weariness regarding EV pricing and Musk's public actions.`
    };
    pros = [
      "Industry leader in EV manufacturing capacity and brand recognition.",
      "Vast proprietary Supercharger network provides a powerful ecosystem lock-in.",
      "Energy storage segment (Megapack) is growing rapidly (>100% YoY) with high margins."
    ];
    cons = [
      "Operating and gross margins are compressing due to global EV price wars.",
      "Significant valuation premium rests on autonomous driving (FSD) and robotics, which face regulatory and technical challenges.",
      "Slowing global demand for electric vehicles relative to hybrid models."
    ];
    risks = [
      { risk: "Intense price competition in China from BYD and others", impact: "High", probability: "High" },
      { risk: "Delays or failures in delivering full autonomous driving (L4/L5 FSD)", impact: "High", probability: "Medium" },
      { risk: "Key-man risk and distractions surrounding CEO Elon Musk", impact: "Medium", probability: "High" }
    ];
    sources = [
      { title: "Tesla Q4 and Full Year Financial Results", url: "https://ir.tesla.com" },
      { title: "BYD Surpasses Tesla in EV Sales Metrics - Bloomberg", url: "https://www.bloomberg.com" },
      { title: "NHTSA AutoPilot Investigation Updates - Reuters", url: "https://www.reuters.com" }
    ];
  } else if (isInsideIIM) {
    decision = 'INVEST';
    thesisSummary = 'InsideIIM holds a strong competitive advantage as India\'s premier MBA and career community platform, boasting a highly captive audience of business graduates and top-tier recruiters.';
    scores = { financialHealth: 85, competitiveMoat: 88, growthPotential: 80, newsSentiment: 85 };
    details = {
      businessModel: `InsideIIM is India’s largest community-driven platform for management education, MBA aspirants, and professional talent. Its **core business model** encompasses educational partnerships, recruitment branding campaigns, student skills training (such as Altuni programs), and corporate partner outreach. It acts as a bridge connecting thousands of MBA applicants/students with top global recruiters.`,
      financialHealth: `InsideIIM shows healthy financial metrics with an organic growth rate driven by high-quality content and student loyalty. Its capital efficiency is notable, leveraging low customer acquisition costs (CAC) due to its strong search and social media organic traffic. Operating margins are highly sustainable.`,
      competitorsAndMoat: `InsideIIM's moat lies in its **captive student-professional community** and deep relationships with business schools and marquee corporate recruiters. While general recruitment portals (Naukri, LinkedIn) and education forums (Pagalguy) exist, InsideIIM has carved a premium niche in management recruitment branding.`,
      newsAndSentiment: `Sentiment is highly positive across student forums and alumni networks. Recent news is focused on successful career-readiness bootcamps and corporate training outcomes. Regulatory headwinds are low as the business operates primarily in educational media and training services.`
    };
    pros = [
      "Unrivaled brand equity and positioning in the MBA student segment.",
      "Highly profitable organic content ecosystem with low customer acquisition costs.",
      "Strong corporate recruiter retention due to successful branding campaigns."
    ];
    cons = [
      "Niche focus on MBA/management limits total addressable market (TAM) expansion.",
      "Vulnerability to seasonal corporate recruitment cycles.",
      "High dependency on the popularity of management credentials (MBA) in India."
    ];
    risks = [
      { risk: "Economic cyclicality affecting corporate hiring budgets", impact: "High", probability: "Medium" },
      { risk: "Expansion into non-MBA segments requires significant marketing spend", impact: "Medium", probability: "Medium" }
    ];
    sources = [
      { title: "InsideIIM Corporate Profile & Stats", url: "https://insideiim.com" },
      { title: "India EdTech & Career Platforms - TechinAsia", url: "https://www.techinasia.com" }
    ];
  } else if (isAltuni) {
    decision = 'INVEST';
    thesisSummary = 'Altuni AI Labs is positioning itself at the forefront of AI-driven educational technology and enterprise productivity tools, demonstrating rapid innovation and strong synergy with parent community networks.';
    scores = { financialHealth: 82, competitiveMoat: 90, growthPotential: 95, newsSentiment: 90 };
    details = {
      businessModel: `Altuni AI Labs acts as the innovation engine building AI products, automated agent workflows, and EdTech tools. Its **business model** relies on licensing custom AI solutions to enterprises, providing AI-powered career training programs (e.g. AI-Product Management and Development bootcamps), and deploying productivity utilities.`,
      financialHealth: `Backed by strong revenue generation from high-demand AI training credentials, Altuni AI Labs exhibits robust growth metrics. R&D spending is elevated but scalable due to low code-replication costs of software assets.`,
      competitorsAndMoat: `Altuni's moat is its **proprietary AI curriculum, fast deployment capabilities, and direct access to InsideIIM's community distribution channel**. This allows it to launch and test AI features (like the Investment Research Agent itself!) directly with real-world users, a loop traditional EdTech players cannot replicate easily.`,
      newsAndSentiment: `Developers and industry learners rank Altuni bootcamps highly for practical skills. Public sentiment is bullish on Altuni's transition into automated product agents. The primary risk is technology churn in foundational LLM models.`
    };
    pros = [
      "Rapid product delivery cycle and execution efficiency.",
      "Direct synergy and distribution integration with InsideIIM career networks.",
      "High-demand specialization in AI/ML engineering and Product Management."
    ];
    cons = [
      "Intense talent competition for top-tier AI researchers and engineers.",
      "Shorter lifecycle of AI product interfaces requiring continuous engineering maintenance.",
      "Dependency on public APIs from LLM providers (Google, OpenAI)."
    ];
    risks = [
      { risk: "Rapid obsolescence of custom wrappers due to foundational LLM updates", impact: "High", probability: "High" },
      { risk: "Talent acquisition constraints in high-tech fields", impact: "Medium", probability: "High" }
    ];
    sources = [
      { title: "Altuni AI Labs Homepage & Shipped Tech", url: "https://altunilabs.ai" },
      { title: "AI Agent Ecosystem Trends - VentureBeat", url: "https://venturebeat.com" }
    ];
  } else if (isNvidia) {
    decision = 'INVEST';
    thesisSummary = 'Nvidia enjoys a near-monopoly in AI accelerators with its CUDA software ecosystem acting as an insurmountable moat, coupled with exceptional margins and triple-digit revenue growth.';
    scores = { financialHealth: 95, competitiveMoat: 96, growthPotential: 90, newsSentiment: 88 };
    details = {
      businessModel: `Nvidia Corporation designs graphics processing units (GPUs) for gaming and professional markets, and System on a Chip units (SoCs) for mobile computing and automotive. Its core engine is the **Data Center segment**, selling GPU clusters (H100, H200, Blackwell) and networking hardware (Mellanox InfiniBand) to hyperscalers, cloud providers, and enterprise AI builders.`,
      financialHealth: `Nvidia's financial performance is historic. Revenues have grown over 200% year-on-year, driven by AI hardware demand. Gross margins exceed 75%, and net income margins hover near 50%. The company generates immense free cash flow ($20B+ per quarter) and maintains a net cash position with high returns on invested capital (ROIC).`,
      competitorsAndMoat: `Nvidia's competitive moat is not just its hardware speed, but its **CUDA software platform**. CUDA has been built over 18 years, locking in millions of developers. Competitors like AMD (ROCm platform) and Intel, or in-house chips (TPUs, Trainium, Maida), lack the developer ecosystem and optimized library support that Nvidia provides out of the box.`,
      newsAndSentiment: `Recent news centers on the launch of the **Blackwell platform**, which is sold out for several quarters. Sentiment is overwhelmingly positive regarding capital expenditure commitments from Microsoft, Meta, and Alphabet. Concerns exist around export restrictions to China and GPU supply constraints.`
    };
    pros = [
      "CUDA software ecosystem creates an extremely high barrier to entry for competitors.",
      "Blackwell GPU generation maintains performance leadership and high pre-order backlog.",
      "Superb financial health: >75% gross margins and massive free cash flow generation."
    ];
    cons = [
      "Concentrated customer base: Top 4 cloud providers account for a large portion of data center revenue.",
      "High cyclicality risk: If AI infrastructure demand peaks, revenue growth could stall rapidly.",
      "Geopolitical risks regarding Taiwan semiconductor manufacturing (TSMC dependency)."
    ];
    risks = [
      { risk: "Export control adjustments restricting shipments to key Asian markets", impact: "High", probability: "Medium" },
      { risk: "Supply chain capacity limitations at TSMC packaging facilities (CoWoS)", impact: "Medium", probability: "High" },
      { risk: "Hyperscalers designing custom silicon to bypass GPU purchases", impact: "Medium", probability: "Medium" }
    ];
    sources = [
      { title: "Nvidia Fiscal Earnings Reports", url: "https://investor.nvidia.com" },
      { title: "Blackwell Architecture Deep Dive - NextPlatform", url: "https://www.nextplatform.com" },
      { title: "The AI Hardware Supply Chain Matrix - EE Times", url: "https://www.eetimes.com" }
    ];
  } else {
    // Default fallback for any other company
    decision = 'INVEST';
    const capName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
    thesisSummary = `${capName} demonstrates stable operational metrics, reasonable valuation, and solid market share, making it a compelling buy-and-hold opportunity.`;
    scores = { financialHealth: 80, competitiveMoat: 75, growthPotential: 70, newsSentiment: 75 };
    details = {
      businessModel: `${capName} operates a robust business model focused on high-quality product delivery, diversified revenue streams, and solid customer retention. Its core value proposition focuses on efficiency and technology integration to solve key client pain points.`,
      financialHealth: `${capName} shows consistent revenue growth of 8-12% annually, stable operating margins, and a healthy debt-to-equity ratio. Free cash flow conversion remains high, supporting share buybacks and dividend payments.`,
      competitorsAndMoat: `The competitive landscape is active, but ${capName} retains a strong market position. Its moat is built on proprietary intellectual property, switching costs, and strong brand awareness. Key competitors exist, but they lag in technical features and global distribution networks.`,
      newsAndSentiment: `Public news is balanced. Recent earnings surpassed estimates, and sentiment remains stable. The company is actively investing in digital transformation and AI-powered operational tools, which is viewed favorably by analysts.`
    };
    pros = [
      "Stable cash flows and reliable balance sheet metrics.",
      "Consistent product innovation leading to high customer retention.",
      "Clear AI integration strategy to lower operational costs."
    ];
    cons = [
      "Relatively moderate organic growth rate in mature markets.",
      "Exposure to raw material or labor cost inflation.",
      "Increasing competitive spending from newer boutique players."
    ];
    risks = [
      { risk: "Macroeconomic slowdown impacting corporate IT spending", impact: "Medium", probability: "Medium" },
      { risk: "Talent acquisition constraints in high-tech fields", impact: "Low", probability: "Medium" }
    ];
    sources = [
      { title: `${capName} Corporate Investor Relations`, url: `https://www.google.com/search?q=${encodeURIComponent(companyName)}+investor+relations` },
      { title: `Industry Competitor Analysis Reports`, url: "https://www.marketwatch.com" }
    ];
  }

  const steps: ResearchStep[] = [
    { phase: 'profile', status: 'searching', message: `Searching profile, business model, and products for ${companyName}...` },
    { phase: 'profile', status: 'reading', message: `Found 5 sources. Fetching website and profile info...` },
    { phase: 'profile', status: 'completed', message: `Identified core business segments and product suite.`, data: details.businessModel },
    
    { phase: 'financials', status: 'searching', message: `Searching financial performance, revenue growth, and profit margins...` },
    { phase: 'financials', status: 'reading', message: `Reading latest quarterly balance sheets and income statements...` },
    { phase: 'financials', status: 'completed', message: `Synthesized financial health metrics. Revenue: Trend established.`, data: details.financialHealth },
    
    { phase: 'moat', status: 'searching', message: `Searching competitors, market share, and competitive advantages...` },
    { phase: 'moat', status: 'reading', message: `Comparing margins and market position relative to major competitors...` },
    { phase: 'moat', status: 'completed', message: `Evaluated barriers to entry and competitor offerings.`, data: details.competitorsAndMoat },
    
    { phase: 'sentiment', status: 'searching', message: `Searching recent news sentiment, controversies, and regulatory risks...` },
    { phase: 'sentiment', status: 'reading', message: `Evaluating news feeds and media reports from the last 90 days...` },
    { phase: 'sentiment', status: 'completed', message: `Completed sentiment analysis. Captured 3 critical risks.`, data: details.newsAndSentiment },
    
    { phase: 'synthesis', status: 'analyzing', message: `Running Synthesis Engine: Weighing pros, cons, and rating metrics...` },
    { phase: 'synthesis', status: 'completed', message: `Formulated final decision: ${decision}.` }
  ];

  const report: ResearchReport = {
    companyName: companyName.toUpperCase(),
    decision,
    thesisSummary,
    scores,
    details,
    pros,
    cons,
    risks,
    sources
  };

  return { steps, report };
}

export async function runResearchAgent(
  companyName: string,
  config: { geminiKey?: string; openaiKey?: string; tavilyKey?: string; useMock?: boolean; preferredProvider?: 'gemini' | 'openai' },
  onStep: (step: ResearchStep) => void
): Promise<ResearchReport> {
  
  if (config.useMock || (!config.geminiKey && !config.openaiKey)) {
    // Run simulation
    const simulated = generateSimulatedReport(companyName);
    
    // Simulate real-time steps
    for (const step of simulated.steps) {
      onStep(step);
      // Wait between steps to simulate real work
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    return simulated.report;
  }

  // Live Mode: LangChain execution
  const apiKeys = {
    gemini: config.geminiKey || process.env.GEMINI_API_KEY,
    openai: config.openaiKey || process.env.OPENAI_API_KEY,
    tavily: config.tavilyKey || process.env.TAVILY_API_KEY,
  };

  // Initialize model
  let model: ChatGoogleGenerativeAI | ChatOpenAI;
  
  const provider = config.preferredProvider || (apiKeys.gemini ? 'gemini' : 'openai');
  
  if (provider === 'gemini') {
    if (!apiKeys.gemini) {
      throw new Error("Gemini API Key is selected but not provided.");
    }
    model = new ChatGoogleGenerativeAI({
      apiKey: apiKeys.gemini,
      model: "gemini-1.5-flash",
      maxOutputTokens: 2048,
    });
  } else if (provider === 'openai') {
    if (!apiKeys.openai) {
      throw new Error("OpenAI API Key is selected but not provided.");
    }
    model = new ChatOpenAI({
      apiKey: apiKeys.openai,
      model: "gpt-4o-mini",
      temperature: 0.2,
    });
  } else {
    throw new Error("No valid LLM Provider selected.");
  }

  // Step 1: Business Profile
  onStep({ phase: 'profile', status: 'searching', message: `[LIVE] Searching web for ${companyName} profile & business model...` });
  const profileResults = await searchWeb(`${companyName} company profile products business model`, apiKeys.tavily);
  onStep({ phase: 'profile', status: 'reading', message: `[LIVE] Analyzing ${profileResults.length} search results...` });
  
  const profilePrompt = `Summarize the business profile, products, and revenue streams for "${companyName}" based on these search results. Highlight the core business model in markdown format:
  
  ${profileResults.map((r, i) => `Result [${i+1}]: ${r.title}\nUrl: ${r.url}\nContent: ${r.content}\n`).join('\n')}`;
  
  const profileResponse = await model.invoke([new HumanMessage(profilePrompt)]);
  const businessModelText = typeof profileResponse.content === 'string' ? profileResponse.content : JSON.stringify(profileResponse.content);
  onStep({ phase: 'profile', status: 'completed', message: `[LIVE] Synthesized business profile.`, data: businessModelText });

  // Step 2: Financial Performance
  onStep({ phase: 'financials', status: 'searching', message: `[LIVE] Searching web for ${companyName} financials & revenue...` });
  const financialsResults = await searchWeb(`${companyName} financial performance revenue profit margin balance sheet 2025 2026`, apiKeys.tavily);
  onStep({ phase: 'financials', status: 'reading', message: `[LIVE] Analyzing financial reports and trends...` });
  
  const financialsPrompt = `Summarize the financial health, recent revenue, net profit margins, and growth trends for "${companyName}" based on these search results. Put it in markdown format:
  
  ${financialsResults.map((r, i) => `Result [${i+1}]: ${r.title}\nUrl: ${r.url}\nContent: ${r.content}\n`).join('\n')}`;
  
  const financialsResponse = await model.invoke([new HumanMessage(financialsPrompt)]);
  const financialsText = typeof financialsResponse.content === 'string' ? financialsResponse.content : JSON.stringify(financialsResponse.content);
  onStep({ phase: 'financials', status: 'completed', message: `[LIVE] Synthesized financial profile.`, data: financialsText });

  // Step 3: Market Moat & Competitors
  onStep({ phase: 'moat', status: 'searching', message: `[LIVE] Searching web for ${companyName} competitors & competitive moat...` });
  const moatResults = await searchWeb(`${companyName} competitors market share competitive advantage moat barriers to entry`, apiKeys.tavily);
  onStep({ phase: 'moat', status: 'reading', message: `[LIVE] Analyzing competitor landscape and moat durability...` });
  
  const moatPrompt = `Summarize the competitive landscape, main competitors, market share, and competitive advantages (moat) for "${companyName}" based on these search results. Format as markdown:
  
  ${moatResults.map((r, i) => `Result [${i+1}]: ${r.title}\nUrl: ${r.url}\nContent: ${r.content}\n`).join('\n')}`;
  
  const moatResponse = await model.invoke([new HumanMessage(moatPrompt)]);
  const moatText = typeof moatResponse.content === 'string' ? moatResponse.content : JSON.stringify(moatResponse.content);
  onStep({ phase: 'moat', status: 'completed', message: `[LIVE] Synthesized competitive profile.`, data: moatText });

  // Step 4: News & Sentiment
  onStep({ phase: 'sentiment', status: 'searching', message: `[LIVE] Searching web for ${companyName} recent news & risks...` });
  const newsResults = await searchWeb(`${companyName} recent news problems risks headwinds scandals`, apiKeys.tavily);
  onStep({ phase: 'sentiment', status: 'reading', message: `[LIVE] Analyzing market sentiment and key risks...` });
  
  const newsPrompt = `Summarize the recent news, brand sentiment, and key headwinds or risk factors for "${companyName}" based on these search results. Format as markdown:
  
  ${newsResults.map((r, i) => `Result [${i+1}]: ${r.title}\nUrl: ${r.url}\nContent: ${r.content}\n`).join('\n')}`;
  
  const newsResponse = await model.invoke([new HumanMessage(newsPrompt)]);
  const newsText = typeof newsResponse.content === 'string' ? newsResponse.content : JSON.stringify(newsResponse.content);
  onStep({ phase: 'sentiment', status: 'completed', message: `[LIVE] Synthesized news sentiment.`, data: newsText });

  // Step 5: Synthesis & Decision
  onStep({ phase: 'synthesis', status: 'analyzing', message: `[LIVE] Running Synthesis Engine to weight factors...` });

  const synthesisPrompt = `You are a professional Investment Research Analyst. Combine the following research reports on "${companyName}" to decide whether to INVEST or PASS.
  
  Report Business Model:
  ${businessModelText}
  
  Report Financial Health:
  ${financialsText}
  
  Report Competitive Moat:
  ${moatText}
  
  Report News and Sentiment:
  ${newsText}
  
  You must output a single valid JSON object containing your final report. Do not wrap the JSON output in markdown formatting (like \`\`\`json). The output must conform exactly to this schema:
  {
    "companyName": "${companyName.toUpperCase()}",
    "decision": "INVEST" or "PASS",
    "thesisSummary": "1-2 sentences summarizing your investment thesis.",
    "scores": {
      "financialHealth": number between 0 and 100,
      "competitiveMoat": number between 0 and 100,
      "growthPotential": number between 0 and 100,
      "newsSentiment": number between 0 and 100
    },
    "details": {
      "businessModel": "a professional markdown summary of their business model, products, and target market based on our findings",
      "financialHealth": "a professional markdown summary of financial highlights, revenue metrics, profits, and growth based on our findings",
      "competitorsAndMoat": "a professional markdown summary of competitors, market share, and moat strength based on our findings",
      "newsAndSentiment": "a professional markdown summary of news, public sentiment, and controversies based on our findings"
    },
    "pros": [
      "bullet point 1",
      "bullet point 2",
      "bullet point 3"
    ],
    "cons": [
      "bullet point 1",
      "bullet point 2",
      "bullet point 3"
    ],
    "risks": [
      {
        "risk": "Description of risk 1",
        "impact": "Low" or "Medium" or "High",
        "probability": "Low" or "Medium" or "High"
      },
      {
        "risk": "Description of risk 2",
        "impact": "Low" or "Medium" or "High",
        "probability": "Low" or "Medium" or "High"
      }
    ],
    "sources": [
      { "title": "Source Title 1", "url": "url 1" },
      { "title": "Source Title 2", "url": "url 2" }
    ]
  }`;

  const synthesisResponse = await model.invoke([
    new SystemMessage("You only output raw, valid JSON matching the exact schema specified. No preamble, no explanation, no code blocks."),
    new HumanMessage(synthesisPrompt)
  ]);
  
  let rawOutput = typeof synthesisResponse.content === 'string' ? synthesisResponse.content : JSON.stringify(synthesisResponse.content);
  
  // Clean markdown json wrappers if LLM still output them
  let cleanJson = rawOutput.trim();
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```$/, '').trim();
  }

  try {
    const report: ResearchReport = JSON.parse(cleanJson);
    // Combine all parsed sources and original search urls
    const uniqueSources = [
      ...report.sources,
      ...profileResults.slice(0, 2).map(r => ({ title: r.title, url: r.url })),
      ...financialsResults.slice(0, 2).map(r => ({ title: r.title, url: r.url }))
    ].filter((s, index, self) => self.findIndex(t => t.url === s.url) === index);
    
    report.sources = uniqueSources.slice(0, 6);
    
    onStep({ phase: 'synthesis', status: 'completed', message: `[LIVE] Investment research completed.` });
    return report;
  } catch (error) {
    console.error("Failed to parse JSON response:", cleanJson);
    // Return a structured report manually parsed or built using default
    const fallback = generateSimulatedReport(companyName).report;
    fallback.thesisSummary = `[Failed to parse AI output, showing smart fallback] ${fallback.thesisSummary}`;
    onStep({ phase: 'synthesis', status: 'completed', message: `[LIVE] Investment research completed with fallback.` });
    return fallback;
  }
}
