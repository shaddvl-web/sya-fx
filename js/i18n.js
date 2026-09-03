/**
 * SYA FX — Internationalization & Localization Engine
 * Full Kurdish (کوردی سۆرانی) & English Support
 */

const I18n = {
  currentLang: localStorage.getItem('sya_lang') || 'ku', // Default to Kurdish as requested

  translations: {
    ku: {
      // Brand & Subtitle
      brandName: "SYA FX",
      brandBadge: "پڕۆ",
      brandSubtitle: "تێرمیناڵی دارایی و فۆرێکس",

      // Navigation
      navDashboard: "داشبۆرد",
      navMarkets: "بازاڕەکان",
      navAi: "شیکاری ژیری دەستکرد",
      navSignals: "سیگناڵەکان",
      navBacktest: "تاقیگەی باکتێست",
      navHistory: "مێژووی سیگناڵ",

      // System Status
      engineStatus: "دۆخی سیستم",
      operational: "کارایە",
      liveTelemetry: "پەخشی ڕاستەوخۆ",
      session: "دانیشتن:",
      refreshTip: "نوێکردنەوەی شیکاری بازاڕ",
      langToggle: "English",

      // Chart Toolbar & Badges
      subOscillator: "نیشاندەری خوارەوە:",
      scrollZoom: "زووم: بە سکڕۆڵ",
      dragPan: "جوڵاندن: ڕابکێشە",
      toggleEma: "هێڵی EMA (20/50/200)",
      toggleBb: "بۆڵینجەر باندز (BB)",
      toggleSr: "پشتگیری و بەرگری (S/R)",
      toggleStruct: "شکانی ستراکچەر (SMC)",
      togglePatterns: "شێوەکانی چارت (PATTERNS)",
      toggleSignals: "دیاریکەری کڕین/فرۆشتن (BUY/SELL)",
      toggleRisk: "سنوری مەترسی",

      // Sub Tabs
      tabConfluence: "شیکاری کۆنفلۆنس",
      tabStructure: "ستراکچەری بازاڕ (SMC)",
      tabTechnical: "نیشاندەرە تەکنیکییەکان",
      tabPatterns: "شێوازەکان (Patterns)",
      tabAi: "شیکاری قووڵی AI",

      // Signals & Confluence
      confluenceScore: "نمرەی کۆنفلۆنس",
      score: "نمرە",
      confidence: "متمانە",
      signalBuy: "کڕین",
      signalStrongBuy: "کڕینی بەهێز",
      signalSell: "فرۆشتن",
      signalStrongSell: "فرۆشتنی بەهێز",
      signalWait: "چاوەڕوانی",
      techScore: "تەکنیکی",
      structScore: "ستراکچەر",
      patternScore: "شێوازەکان",
      momentumScore: "مۆمێنتەم",
      riskScore: "مەترسی",

      // Factors & Risk
      checkpointHeader: "خاڵەکانی کۆنفلۆنس و پشکنین",
      supportingFactors: "هۆکارە ئەرێنییەکانی پشتگیری سیگناڵ",
      conflictingFactors: "مەترسییەکان و هۆکارە دژبەیەکەکان",
      scanningOrderFlow: "گەڕان لە لێشاوی داواکارییەکانی بازاڕ...",
      consolidationFilter: "فلتەری چەقبەستنی نێوان تایم فریمەکان کارایە.",

      // Risk Management Corridor
      riskHeader: "بەڕێوەبردنی مەترسی و سەرمایە",
      riskEntry: "چوونەژوورەوە",
      riskSl: "ڕاگرتنی زیان (SL)",
      riskTp1: "ئامانجی ١ (TP1)",
      riskTp2: "ئامانجی ٢ (TP2)",
      rrRatio: "ڕێژەی R:R:",
      maxRisk: "زۆرترین مەترسی:",
      posSize: "قەبارەی پۆزیشن:",
      invalidationDefault: "سیگناڵ هەڵدەوەشێتەوە ئەگەر ئاستی پشتگیری پێچەوانە بشکێت.",

      // Market Structure
      marketRegime: "بارودۆخی بازاڕ",
      bosHeader: "شکانی ستراکچەر (BOS)",
      chochHeader: "گۆڕانی ڕەوشت (CHOCH)",
      recentSwings: "لووتکە و بنکەکانی نرخ (Swings)",
      liquidityZones: "زۆنەکانی نەختینە و S/R",
      noneDetected: "هیچ نەدۆزراوەتەوە",
      noneActive: "هیچ چالاک نییە",
      bullishConfirmed: "بەرزبوونەوەی نرخ پشتڕاستکراوەتەوە",
      bearishConfirmed: "دابەزینی نرخ پشتڕاستکراوەتەوە",

      // Technical Indicators
      ema20Sub: "ڕێنوێنی مۆمێنتەمی کورتخایەن",
      ema50Sub: "بەربەستی ترێندی ناوەندی",
      ema200Sub: "هێڵی بنەڕەتی دامەزراوەیی درێژخایەن",
      overbought: "زۆر کڕدراو (Overbought)",
      oversold: "زۆر فرۆشراو (Oversold)",
      neutral: "ئاسایی (Neutral)",
      macdSub: "مۆمێنتەمی هیستۆگرام",
      atrSub: "مەودای جوڵەی ئاسایی",
      bbSub: "فشاری باندەکان",
      adxSub: "هێزی ئاراستە",

      // Patterns
      noPatterns: "هیچ شێوازێکی کلاسیکی دیاریکراو لەم تایم فریمەدا بەدی ناکرێت.",
      patternTarget: "ئامانج",
      patternInval: "هەڵوەشانەوە",

      // AI Analyst
      aiTitle: "شیکاری ژیری دەستکردی SYA",
      aiSubtitle: "پڕۆتۆکۆڵی پارێزراوی زانیاری بەبێ دروستکراوی ناڕاست",
      btnRunAi: "ئەنجامدانی شیکاری AI",
      aiStatusReady: "مۆدێلی Qwen ئامادەیە بۆ شیکاری تەواوی جووتە دراوەکە.",
      aiFactTitle: "١. داتای سەلمێنراوی تەکنیکی (داتای ڕاستەقینە)",
      aiAnalysisTitle: "٢. شیکاری کۆنفلۆنس و پلانی تاکتیکی",
      aiUncertaintyTitle: "٣. نادڵنیایی و مەترسییە ئابوورییەکان",

      // Markets View
      marketsTitle: "تەختەی نرخی فۆرێکس",
      marketsSubtitle: "نرخە ڕاستەوخۆکان و سپڕێدی سات بە سات",
      colSymbol: "جووتە دراو",
      colBid: "کڕین (Bid)",
      colAsk: "فرۆشتن (Ask)",
      colSpread: "سپڕێد (pips)",
      col24hChange: "گۆڕانکاری ٢٤ کاتژمێر",
      colHigh: "بەرزترین",
      colLow: "نزمترین",

      // Backtest View
      backtestTitle: "تاقیگەی ئەنجامدانی باکتێست",
      backtestSubtitle: "تاقیکردنەوەی ستراتیژی لەسەر مێژووی ڕاستەقینەی مۆمەکان",
      btPair: "جووتە دراو",
      btTf: "تایم فریم",
      btStrategy: "ستراتیژ",
      btBalance: "باڵانسی سەرەتایی ($)",
      btRisk: "مەترسی بۆ هەر مامەڵەیەک (%)",
      btnExecuteBt: "دەستپێکردنی باکتێست",
      btSimulating: "تاقیکردنەوەی ستراتیژەکە لەسەر مۆمەکانی ڕابردوو بەڕێوەدەچێت...",
      btNetReturn: "قازانجی پوختە",
      btWinRate: "ڕێژەی سەرکەوتن",
      btProfitFactor: "فاکتەری قازانج",
      btMaxDrawdown: "زۆرترین دابەزین",

      // Audit History View
      historyTitle: "مێژووی پشکنین و سیگناڵەکان",
      historySubtitle: "تۆماری هەموو سیگناڵە دەرچووەکانی ڕابردوو",
      colTime: "کات و بەروار",
      colType: "جۆری سیگناڵ",
      colScore: "نمرەی متمانە",
      colEntry: "خاڵی چوونەژوورەوە",
      colSlTp: "ڕاگرتنی زیان و ئامانجەکان",
      noHistory: "تا ئێستا هیچ سیگناڵێکی مێژوویی تۆمار نەکراوە."
    },

    en: {
      brandName: "SYA FX",
      brandBadge: "PRO",
      brandSubtitle: "INSTITUTIONAL TERMINAL",

      navDashboard: "Dashboard",
      navMarkets: "Markets",
      navAi: "AI Analyst",
      navSignals: "Signals Feed",
      navBacktest: "Backtest Lab",
      navHistory: "Audit History",

      engineStatus: "Engine Status",
      operational: "OPERATIONAL",
      liveTelemetry: "LIVE TELEMETRY",
      session: "SESSION:",
      refreshTip: "Refresh Live Market Analysis",
      langToggle: "کوردی",

      subOscillator: "SUB-OSCILLATOR:",
      scrollZoom: "SCROLL: ZOOM",
      dragPan: "DRAG: PAN",
      toggleEma: "EMA (20/50/200)",
      toggleBb: "BOLLINGER BANDS",
      toggleSr: "SUPPORT / RESISTANCE",
      toggleStruct: "BOS / CHOCH / SWINGS",
      togglePatterns: "PATTERNS",
      toggleSignals: "BUY/SELL SIGNALS",
      toggleRisk: "TRADE LEVELS",

      tabConfluence: "Confluence Analysis",
      tabStructure: "Market Structure (SMC)",
      tabTechnical: "Technical Indicators",
      tabPatterns: "Chart Patterns",
      tabAi: "Live AI Analyst",

      confluenceScore: "Confluence Score",
      score: "Score",
      confidence: "Confidence",
      signalBuy: "BUY",
      signalStrongBuy: "STRONG BUY",
      signalSell: "SELL",
      signalStrongSell: "STRONG SELL",
      signalWait: "WAIT",
      techScore: "Technical",
      structScore: "Structure",
      patternScore: "Patterns",
      momentumScore: "Momentum",
      riskScore: "Risk & Corridors",

      checkpointHeader: "Confluence & Invalidation Checkpoints",
      supportingFactors: "SUPPORTING CONFLUENCE FACTORS",
      conflictingFactors: "CONFLICTING / RISK FACTORS",
      scanningOrderFlow: "Scanning live order flow...",
      consolidationFilter: "Cross-timeframe consolidation filter active.",

      riskHeader: "Institutional Risk Architecture",
      riskEntry: "ENTRY",
      riskSl: "STOP LOSS",
      riskTp1: "TP 1",
      riskTp2: "TP 2 (TARGET)",
      rrRatio: "R:R RATIO:",
      maxRisk: "MAX RISK:",
      posSize: "POSITION SIZE:",
      invalidationDefault: "Trade invalidated upon breach of structural support level.",

      marketRegime: "Market Regime",
      bosHeader: "Break of Structure (BOS)",
      chochHeader: "Change of Character (CHOCH)",
      recentSwings: "Recent Swings (Order Flow)",
      liquidityZones: "Liquidity Zones & Key S/R",
      noneDetected: "None Detected",
      noneActive: "None Active",
      bullishConfirmed: "Higher Highs & Higher Lows confirmed",
      bearishConfirmed: "Lower Highs & Lower Lows confirmed",

      ema20Sub: "Short-term momentum guide",
      ema50Sub: "Intermediate trend barrier",
      ema200Sub: "Macro institutional baseline",
      overbought: "Overbought",
      oversold: "Oversold",
      neutral: "Neutral",
      macdSub: "Histogram positive momentum",
      atrSub: "Normal volatility regime",
      bbSub: "Compression: Standard",
      adxSub: "+DI dominant over -DI",

      noPatterns: "No active classical patterns detected in current historical frame.",
      patternTarget: "Target",
      patternInval: "Inval",

      aiTitle: "SYA AI ANALYST",
      aiSubtitle: "Strict Grounding Protocol Active (No Hallucinations)",
      btnRunAi: "Execute AI Analysis",
      aiStatusReady: "Model is ready to evaluate verified telemetry for current symbol.",
      aiFactTitle: "1. FACTUAL TELEMETRY (VERIFIED BACKEND EVIDENCE)",
      aiAnalysisTitle: "2. CONFLUENCE ANALYSIS & TACTICAL PLAN",
      aiUncertaintyTitle: "3. UNCERTAINTIES & RISK VULNERABILITIES",

      marketsTitle: "Institutional Forex Matrix",
      marketsSubtitle: "Real-time spot quotes & spread telemetry",
      colSymbol: "Symbol",
      colBid: "Bid",
      colAsk: "Ask",
      colSpread: "Spread (pips)",
      col24hChange: "24h Change",
      colHigh: "24h High",
      colLow: "24h Low",

      backtestTitle: "Quantitative Backtest Engine",
      backtestSubtitle: "Bar-by-bar historical simulation with slippage model",
      btPair: "Pair",
      btTf: "Timeframe",
      btStrategy: "Strategy",
      btBalance: "Initial Balance ($)",
      btRisk: "Risk Per Trade (%)",
      btnExecuteBt: "Run Quantitative Backtest",
      btSimulating: "Simulating quantitative strategy execution bar-by-bar...",
      btNetReturn: "Net Return",
      btWinRate: "Win Rate",
      btProfitFactor: "Profit Factor",
      btMaxDrawdown: "Max Drawdown",

      historyTitle: "Institutional Audit History",
      historySubtitle: "Immutable historical log of generated trade signals",
      colTime: "Date & Time",
      colType: "Signal",
      colScore: "Score",
      colEntry: "Entry",
      colSlTp: "Risk Corridors (SL / TP)",
      noHistory: "No historical signals recorded yet."
    }
  },

  t(key) {
    const lang = this.currentLang;
    if (this.translations[lang] && this.translations[lang][key]) {
      return this.translations[lang][key];
    }
    if (this.translations.en && this.translations.en[key]) {
      return this.translations.en[key];
    }
    return key;
  },

  setLanguage(lang) {
    if (lang !== 'ku' && lang !== 'en') lang = 'ku';
    this.currentLang = lang;
    localStorage.setItem('sya_lang', lang);
    this.applyLanguage();
  },

  toggleLanguage() {
    const nextLang = this.currentLang === 'ku' ? 'en' : 'ku';
    this.setLanguage(nextLang);
  },

  applyLanguage() {
    const lang = this.currentLang;
    document.documentElement.lang = lang;
    if (lang === 'ku') {
      document.body.classList.add('lang-ku');
    } else {
      document.body.classList.remove('lang-ku');
    }

    // Update elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.t(key);
      if (text) el.textContent = text;
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      const text = this.t(key);
      if (text) el.setAttribute('placeholder', text);
    });

    // Update titles / tooltips
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const text = this.t(key);
      if (text) el.setAttribute('title', text);
    });

    // Update Language Toggle Button text
    const langBtn = document.getElementById('btnLangToggle');
    if (langBtn) {
      langBtn.innerHTML = `<span>🌐</span> <span>${this.t('langToggle')}</span>`;
    }

    // Re-render active view panels if App is ready
    if (window.App && window.App.currentAnalysis) {
      window.App.renderConfluenceSignalPanel();
      window.App.renderStructurePanel();
      window.App.renderTechnicalPanel();
    }
  }
};

window.I18n = I18n;
