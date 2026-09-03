/**
 * SYA FX — Terminal Application Controller
 * High-Density Institutional Trading Intelligence
 */

document.addEventListener('DOMContentLoaded', () => {
  const App = {
    currentSymbol: 'EUR_USD',
    currentTimeframe: 'M15',
    currentAnalysis: null,
    currentCandles: [],
    chart: null,
    pollTimer: null,

    init() {
      this.initChart();
      this.initEvents();
      this.startClock();
      this.loadAllData();
      this.startPolling();
    },

    initChart() {
      this.chart = new SyaChart('candlestickChart');
    },

    startClock() {
      const clockEl = document.getElementById('utcClock');
      const updateTime = () => {
        const d = new Date();
        if (clockEl) {
          clockEl.textContent = `${d.toUTCString().slice(17, 25)} UTC`;
        }
        this.updateSessionBadges(d.getUTCHours());
      };
      updateTime();
      setInterval(updateTime, 1000);
    },

    updateSessionBadges(utcHour) {
      // London: 08:00 - 16:00 UTC
      // New York: 13:00 - 21:00 UTC
      // Tokyo: 00:00 - 08:00 UTC
      // Sydney: 21:00 - 05:00 UTC
      const sessions = [];
      if (utcHour >= 8 && utcHour < 16) sessions.push('LONDON');
      if (utcHour >= 13 && utcHour < 21) sessions.push('NEW YORK');
      if (utcHour >= 0 && utcHour < 8) sessions.push('TOKYO');
      if (utcHour >= 21 || utcHour < 5) sessions.push('SYDNEY');

      const el = document.getElementById('activeSessionText');
      if (el) {
        el.textContent = sessions.length > 0 ? sessions.join(' / ') : 'OVERNIGHT';
      }
    },

    initEvents() {
      // Sidebar View Navigation
      document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
          const viewId = item.getAttribute('data-view');
          this.switchView(viewId);
        });
      });

      // Quick Symbol Buttons
      document.querySelectorAll('.symbol-quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const sym = btn.getAttribute('data-symbol');
          this.changeSymbol(sym);
        });
      });

      // Dropdown Symbol Selector
      const dropdown = document.getElementById('symbolDropdown');
      if (dropdown) {
        dropdown.addEventListener('change', (e) => {
          this.changeSymbol(e.target.value);
        });
      }

      // Timeframe Switcher
      document.querySelectorAll('.tf-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const tf = btn.getAttribute('data-tf');
          this.changeTimeframe(tf);
        });
      });

      // Below-Chart Sub Tabs
      document.querySelectorAll('.sub-tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
          const target = tab.getAttribute('data-tab');
          this.switchSubTab(target);
        });
      });

      // Chart Toggle Buttons
      document.querySelectorAll('.chart-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          btn.classList.toggle('active');
          const toggleType = btn.getAttribute('data-toggle');
          const isActive = btn.classList.contains('active');

          if (toggleType === 'ema') this.chart.setToggles({ showEma: isActive });
          if (toggleType === 'bb') this.chart.setToggles({ showBb: isActive });
          if (toggleType === 'sr') this.chart.setToggles({ showSr: isActive });
          if (toggleType === 'structure') this.chart.setToggles({ showStructure: isActive });
          if (toggleType === 'risk') this.chart.setToggles({ showRiskLines: isActive });
        });
      });

      // Sub-Pane Switcher (RSI / Volume)
      const subPaneToggle = document.getElementById('subPaneToggle');
      if (subPaneToggle) {
        subPaneToggle.addEventListener('click', () => {
          const current = this.chart.subPane;
          const next = current === 'RSI' ? 'VOLUME' : 'RSI';
          this.chart.setToggles({ subPane: next });
          subPaneToggle.textContent = next;
        });
      }

      // Refresh Button
      const refreshBtn = document.getElementById('btnRefresh');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          this.loadAllData();
        });
      }

      // Run Deep AI Button
      const runAiBtn = document.getElementById('btnRunAi');
      if (runAiBtn) {
        runAiBtn.addEventListener('click', () => {
          this.executeDeepAiAnalysis();
        });
      }

      // Run Backtest Form
      const backtestBtn = document.getElementById('btnRunBacktest');
      if (backtestBtn) {
        backtestBtn.addEventListener('click', () => {
          this.executeBacktest();
        });
      }
    },

    switchView(viewId) {
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      const activeNav = document.querySelector(`.nav-item[data-view="${viewId}"]`);
      if (activeNav) activeNav.classList.add('active');

      document.querySelectorAll('.view-container').forEach(el => el.classList.remove('active'));
      const activeView = document.getElementById(`view-${viewId}`);
      if (activeView) activeView.classList.add('active');

      if (viewId === 'markets') this.loadMarketsView();
      if (viewId === 'history') this.loadHistoryView();
      if (viewId === 'dashboard') this.chart.resize();
    },

    switchSubTab(tabId) {
      document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.remove('active'));
      const targetBtn = document.querySelector(`.sub-tab-btn[data-tab="${tabId}"]`);
      if (targetBtn) targetBtn.classList.add('active');

      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      const targetPane = document.getElementById(`pane-${tabId}`);
      if (targetPane) targetPane.classList.add('active');
    },

    changeSymbol(symbol) {
      if (this.currentSymbol === symbol) return;
      this.currentSymbol = symbol;

      // Update pills
      document.querySelectorAll('.symbol-quick-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-symbol') === symbol);
      });
      const dropdown = document.getElementById('symbolDropdown');
      if (dropdown) dropdown.value = symbol;

      this.loadAllData();
    },

    changeTimeframe(tf) {
      if (this.currentTimeframe === tf) return;
      this.currentTimeframe = tf;

      document.querySelectorAll('.tf-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tf') === tf);
      });

      this.loadAllData();
    },

    async loadAllData() {
      try {
        const [candlesRes, analysisRes] = await Promise.all([
          Api.getCandles(this.currentSymbol, this.currentTimeframe, 120),
          Api.getAnalysis(this.currentSymbol, this.currentTimeframe)
        ]);

        this.currentCandles = candlesRes.candles || [];
        this.currentAnalysis = analysisRes;

        // Render Chart
        this.chart.setData(this.currentCandles, this.currentAnalysis, this.currentSymbol, this.currentTimeframe);

        // Update Topbar and Ticker
        this.renderTopbarTicker();

        // Update Dashboard Sub-Panels
        this.renderStructurePanel();
        this.renderTechnicalPanel();
        this.renderPatternsPanel();
        this.renderConfluenceSignalPanel();
        this.renderAiPanel();
      } catch (err) {
        console.error('Failed loading data:', err);
      }
    },

    renderTopbarTicker() {
      const q = this.currentAnalysis?.quote;
      if (!q) return;

      const symEl = document.getElementById('tickerSymbol');
      const priceEl = document.getElementById('tickerPrice');
      const changeEl = document.getElementById('tickerChange');
      const spreadEl = document.getElementById('tickerSpread');

      if (symEl) symEl.textContent = q.symbol.replace('_', '/');
      if (priceEl) priceEl.textContent = q.bid.toFixed(q.digits);

      if (changeEl) {
        const isPos = q.change24h >= 0;
        changeEl.textContent = `${isPos ? '+' : ''}${q.change24hPercent.toFixed(2)}% (${isPos ? '+' : ''}${q.change24h.toFixed(q.digits)})`;
        changeEl.className = `ticker-change ${isPos ? 'change-pos' : 'change-neg'}`;
      }

      if (spreadEl) spreadEl.textContent = `Spread: ${q.spreadPips.toFixed(1)} pips`;
    },

    renderStructurePanel() {
      const st = this.currentAnalysis?.structure;
      if (!st) return;

      const regimeBadge = document.getElementById('structRegimeBadge');
      if (regimeBadge) {
        regimeBadge.textContent = `${st.structure} (${st.confidence.toFixed(0)}%)`;
        regimeBadge.className = `metric-card-value ${st.structure === 'BULLISH' ? 'change-pos' : (st.structure === 'BEARISH' ? 'change-neg' : 'text-muted')}`;
      }

      const bosEl = document.getElementById('structBosStatus');
      if (bosEl) {
        if (st.bos && st.bos.detected) {
          bosEl.innerHTML = `<span class="${st.bos.direction === 'BULLISH' ? 'change-pos' : 'change-neg'}">${st.bos.type} ${st.bos.direction}</span> at ${st.bos.breakoutLevel.toFixed(5)}`;
        } else {
          bosEl.textContent = 'None Detected';
        }
      }

      const chochEl = document.getElementById('structChochStatus');
      if (chochEl) {
        if (st.choch && st.choch.detected) {
          chochEl.innerHTML = `<span class="change-neg">${st.choch.direction} Reversal</span> at ${st.choch.breakoutLevel.toFixed(5)}`;
        } else {
          chochEl.textContent = 'None Active';
        }
      }

      const swingsContainer = document.getElementById('structSwingsList');
      if (swingsContainer) {
        const allSwings = [...(st.recentHighs || []), ...(st.recentLows || [])].sort((a, b) => b.index - a.index).slice(0, 6);
        swingsContainer.innerHTML = allSwings.map(s => `
          <div class="risk-level-row">
            <span class="risk-label ${s.type.includes('H') ? 'change-pos' : 'change-neg'}">${s.type}</span>
            <span>${s.price.toFixed(5)}</span>
          </div>
        `).join('');
      }
    },

    renderTechnicalPanel() {
      const t = this.currentAnalysis?.technical;
      if (!t) return;

      // Moving Averages
      const ema20El = document.getElementById('techEma20');
      const ema50El = document.getElementById('techEma50');
      const ema200El = document.getElementById('techEma200');
      if (ema20El) ema20El.textContent = t.ema20.toFixed(5);
      if (ema50El) ema50El.textContent = t.ema50.toFixed(5);
      if (ema200El) ema200El.textContent = t.ema200.toFixed(5);

      // Oscillators
      const rsiEl = document.getElementById('techRsi');
      if (rsiEl) {
        rsiEl.innerHTML = `${t.rsi14.toFixed(1)} <span style="font-size: 11px; font-weight: normal; color: var(--text-secondary)">(${t.rsi14 > 70 ? 'Overbought' : (t.rsi14 < 30 ? 'Oversold' : 'Neutral')})</span>`;
      }

      const macdEl = document.getElementById('techMacd');
      if (macdEl) {
        macdEl.innerHTML = `H: <span class="${t.macd.histogram >= 0 ? 'change-pos' : 'change-neg'}">${t.macd.histogram.toFixed(5)}</span> | M: ${t.macd.macdLine.toFixed(5)}`;
      }

      const atrEl = document.getElementById('techAtr');
      if (atrEl) atrEl.textContent = `${t.atr14.toFixed(5)} (${(t.atr14 * 10000).toFixed(1)} pips)`;

      const bbEl = document.getElementById('techBbWidth');
      if (bbEl) bbEl.textContent = `${t.bollingerBands.bandwidth.toFixed(2)}%`;

      const adxEl = document.getElementById('techAdx');
      if (adxEl) adxEl.textContent = `${t.adx.value.toFixed(1)} (${t.adx.trendStrength})`;
    },

    renderPatternsPanel() {
      const patterns = this.currentAnalysis?.patterns || [];
      const listEl = document.getElementById('patternsGridList');
      if (!listEl) return;

      if (patterns.length === 0) {
        listEl.innerHTML = `<div style="grid-column: 1 / -1; padding: 20px; text-align: center; color: var(--text-muted)">No active classical patterns detected in current historical frame.</div>`;
        return;
      }

      listEl.innerHTML = patterns.map(p => `
        <div class="pattern-item-card">
          <div class="pattern-header">
            <span class="pattern-name">${p.pattern}</span>
            <span class="tab-badge ${p.direction === 'BULLISH' ? 'badge-buy' : 'badge-sell'}">${p.direction}</span>
          </div>
          <div style="font-size: 11px; color: var(--text-secondary); display: flex; justify-content: space-between;">
            <span>Confidence: <b>${p.confidence.toFixed(0)}%</b></span>
            <span>Quality: <b>${p.quality.toFixed(0)}%</b></span>
          </div>
          <div class="score-progress-track">
            <div class="score-progress-fill" style="width: ${p.confidence}%"></div>
          </div>
          <div style="font-size: 10.5px; color: var(--text-muted)">
            Target: <b style="color: var(--color-buy)">${p.targetPrice.toFixed(5)}</b> | Inval: <b style="color: var(--color-sell)">${p.invalidationPrice.toFixed(5)}</b>
          </div>
        </div>
      `).join('');
    },

    renderConfluenceSignalPanel() {
      const sig = this.currentAnalysis?.signal;
      const risk = this.currentAnalysis?.risk;
      if (!sig || !risk) return;

      // Large Signal Badge & Radial Gauge
      const badge = document.getElementById('signalMainBadge');
      if (badge) {
        badge.textContent = sig.signal;
        badge.className = `signal-badge-large ${sig.signal.toLowerCase()}`;
      }

      const gaugeNum = document.getElementById('confluenceGaugeScore');
      const gaugeCircle = document.getElementById('confluenceGaugeCircle');
      if (gaugeNum) gaugeNum.textContent = Math.round(sig.finalScore);
      if (gaugeCircle) {
        const score = Math.min(100, Math.max(0, sig.finalScore));
        const offset = 251.2 - (251.2 * score) / 100;
        gaugeCircle.style.strokeDashoffset = offset;
        gaugeCircle.style.stroke = sig.signal === 'BUY' ? 'var(--color-buy)' : (sig.signal === 'SELL' ? 'var(--color-sell)' : 'var(--color-wait)');
        gaugeCircle.style.filter = sig.signal === 'BUY' ? 'drop-shadow(0 0 8px rgba(0,255,163,0.5))' : (sig.signal === 'SELL' ? 'drop-shadow(0 0 8px rgba(255,61,113,0.5))' : 'none');
      }

      const strengthEl = document.getElementById('signalStrengthText');
      if (strengthEl) strengthEl.textContent = `${sig.strength} CONFLUENCE (${sig.finalScore.toFixed(0)}/100)`;

      // Confluence Score Bars
      const setBar = (id, val) => {
        const valEl = document.getElementById(`${id}Val`);
        const fillEl = document.getElementById(`${id}Fill`);
        if (valEl) valEl.textContent = `${val.toFixed(0)}`;
        if (fillEl) fillEl.style.width = `${Math.min(100, Math.max(0, val))}%`;
      };

      setBar('scoreTech', sig.technicalScore);
      setBar('scoreStruct', sig.structureScore);
      setBar('scorePattern', sig.patternScore);
      setBar('scoreMomentum', sig.momentumScore);
      setBar('scoreRisk', sig.riskScore);

      // Confluence Factors
      const confList = document.getElementById('confluenceFactorsList');
      if (confList) {
        confList.innerHTML = sig.confluenceFactors.map(f => `<li style="color: var(--color-buy)">✓ ${f}</li>`).join('');
      }
      const conflictList = document.getElementById('conflictingFactorsList');
      if (conflictList) {
        conflictList.innerHTML = sig.conflictingFactors.map(f => `<li style="color: var(--color-sell)">✕ ${f}</li>`).join('');
      }

      // Risk Levels Box
      const entryEl = document.getElementById('riskEntry');
      const slEl = document.getElementById('riskSl');
      const tp1El = document.getElementById('riskTp1');
      const tp2El = document.getElementById('riskTp2');
      const rrEl = document.getElementById('riskRr');
      const unitsEl = document.getElementById('riskUnits');
      const invalEl = document.getElementById('riskInvalidationText');

      if (entryEl) entryEl.textContent = risk.entry.toFixed(5);
      if (slEl) slEl.textContent = risk.stopLoss.toFixed(5);
      if (tp1El) tp1El.textContent = risk.takeProfit1.toFixed(5);
      if (tp2El) tp2El.textContent = risk.takeProfit2.toFixed(5);
      if (rrEl) rrEl.textContent = `1:${risk.riskRewardRatio.toFixed(1)}`;
      if (unitsEl) unitsEl.textContent = `${risk.recommendedPositionUnits.toLocaleString()} units`;
      if (invalEl) invalEl.textContent = risk.invalidationRule;
    },

    renderAiPanel(aiResult = null) {
      const container = document.getElementById('aiAnalystContent');
      if (!container) return;

      if (!aiResult) {
        const sig = this.currentAnalysis?.signal;
        const risk = this.currentAnalysis?.risk;
        container.innerHTML = `
          <div style="color: var(--text-secondary); line-height: 1.6; font-size: 12.5px;">
            <b>Automated Status:</b> Model <span class="ai-badge">qwen/qwen3.6-27b</span> is ready to evaluate verified telemetry for <b>${this.currentSymbol}</b> (${this.currentTimeframe}).
            <br>Click <b>"Execute AI Analysis"</b> to run the Groq deep reasoning pass.
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="background-color: var(--bg-input); padding: 12px; border-radius: var(--radius-sm); border-left: 3px solid var(--color-cyan);">
            <div style="font-weight: 700; color: var(--color-cyan); font-size: 11px; margin-bottom: 4px; text-transform: uppercase;">Executive Intelligence Summary</div>
            <div style="color: var(--text-primary); font-size: 13px; line-height: 1.5;">${aiResult.summary}</div>
          </div>

          <div class="ai-tier-box" style="border-left-color: #00E676;">
            <div class="ai-tier-title" style="color: #00E676;">1. FACTUAL TELEMETRY (VERIFIED BACKEND EVIDENCE)</div>
            <ul class="ai-tier-list">
              ${(aiResult.facts || []).map(f => `<li>• ${f}</li>`).join('')}
            </ul>
          </div>

          <div class="ai-tier-box" style="border-left-color: #2979FF;">
            <div class="ai-tier-title" style="color: #2979FF;">2. CONFLUENCE ANALYSIS & TACTICAL PLAN</div>
            <ul class="ai-tier-list">
              ${(aiResult.analysis || []).map(a => `<li>• ${a}</li>`).join('')}
            </ul>
            <div style="margin-top: 8px; color: var(--text-primary); font-weight: 600;">Recommendation: ${aiResult.recommendation}</div>
          </div>

          <div class="ai-tier-box" style="border-left-color: #FFB300;">
            <div class="ai-tier-title" style="color: #FFB300;">3. SYSTEMIC UNCERTAINTIES & RISK BOUNDARIES</div>
            <ul class="ai-tier-list">
              ${(aiResult.uncertainties || []).map(u => `<li>• ${u}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    },

    async executeDeepAiAnalysis() {
      const btn = document.getElementById('btnRunAi');
      const container = document.getElementById('aiAnalystContent');
      if (btn) btn.disabled = true;
      if (container) container.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--color-cyan); font-family: var(--font-mono)">Querying SYA AI Analyst (qwen/qwen3.6-27b)...</div>`;

      try {
        const result = await Api.runAiAnalysis(this.currentSymbol, this.currentTimeframe);
        this.renderAiPanel(result);
      } catch (err) {
        if (container) container.innerHTML = `<div style="color: var(--color-sell); padding: 10px;">AI Analysis error: ${err.message}</div>`;
      } finally {
        if (btn) btn.disabled = false;
      }
    },

    async loadMarketsView() {
      const tbody = document.getElementById('marketsTableBody');
      if (!tbody) return;
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px;">Streaming market telemetry...</td></tr>`;

      try {
        const quotes = await Api.getMarkets();
        tbody.innerHTML = quotes.map(q => {
          const isPos = q.change24h >= 0;
          return `
            <tr style="cursor: pointer" onclick="window.App.changeSymbol('${q.symbol}'); window.App.switchView('dashboard');">
              <td style="font-weight: 700; color: var(--text-primary)">${q.symbol.replace('_', '/')}</td>
              <td style="font-weight: 600">${q.bid.toFixed(q.digits)}</td>
              <td style="font-weight: 600">${q.ask.toFixed(q.digits)}</td>
              <td>${q.spreadPips.toFixed(1)}</td>
              <td class="${isPos ? 'change-pos' : 'change-neg'}">${isPos ? '+' : ''}${q.change24hPercent.toFixed(2)}%</td>
              <td>${q.high24h.toFixed(q.digits)}</td>
              <td>${q.low24h.toFixed(q.digits)}</td>
            </tr>
          `;
        }).join('');
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="color: var(--color-sell)">Error loading quotes: ${err.message}</td></tr>`;
      }
    },

    async loadHistoryView() {
      const tbody = document.getElementById('historyTableBody');
      if (!tbody) return;
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px;">Fetching audit history...</td></tr>`;

      try {
        const history = await Api.getHistory();
        if (history.length === 0) {
          tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">No historical signals recorded yet.</td></tr>`;
          return;
        }

        tbody.innerHTML = history.map(h => {
          const dt = new Date(h.timestamp);
          return `
            <tr>
              <td>${dt.toLocaleDateString()} ${dt.toLocaleTimeString()}</td>
              <td style="font-weight: 700">${h.symbol.replace('_', '/')}</td>
              <td>${h.timeframe}</td>
              <td><span class="tab-badge badge-${h.signalType.toLowerCase()}">${h.signalType}</span></td>
              <td style="font-weight: 700">${h.score.toFixed(0)}</td>
              <td>${h.entry.toFixed(5)}</td>
              <td>SL: ${h.stopLoss.toFixed(5)} | TP1: ${h.takeProfit1.toFixed(5)}</td>
            </tr>
          `;
        }).join('');
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="color: var(--color-sell)">Error: ${err.message}</td></tr>`;
      }
    },

    async executeBacktest() {
      const symbol = document.getElementById('btSymbol')?.value || this.currentSymbol;
      const timeframe = document.getElementById('btTimeframe')?.value || 'M15';
      const strategy = document.getElementById('btStrategy')?.value || 'CONFLUENCE';
      const balance = parseFloat(document.getElementById('btBalance')?.value || '10000');
      const risk = parseFloat(document.getElementById('btRisk')?.value || '1.0');

      const resultsContainer = document.getElementById('backtestResultsArea');
      if (resultsContainer) {
        resultsContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--color-cyan); font-family: var(--font-mono)">Simulating quantitative strategy execution bar-by-bar...</div>`;
      }

      try {
        const res = await Api.runBacktest({
          symbol,
          timeframe,
          strategy,
          initialBalance: balance,
          riskPerTradePercent: risk
        });

        if (resultsContainer) {
          const isProfitable = res.netProfit >= 0;
          resultsContainer.innerHTML = `
            <div class="grid-4col" style="margin-bottom: 16px;">
              <div class="metric-card">
                <span class="metric-card-header">Net Return</span>
                <span class="metric-card-value ${isProfitable ? 'change-pos' : 'change-neg'}">${isProfitable ? '+' : ''}$${res.netProfit.toFixed(2)} (${isProfitable ? '+' : ''}${res.netProfitPercent.toFixed(1)}%)</span>
                <span class="metric-card-sub">Final Balance: $${res.finalBalance.toFixed(2)}</span>
              </div>
              <div class="metric-card">
                <span class="metric-card-header">Win Rate</span>
                <span class="metric-card-value">${res.winRate.toFixed(1)}%</span>
                <span class="metric-card-sub">${res.wins} Wins / ${res.losses} Losses (${res.totalTrades} Total)</span>
              </div>
              <div class="metric-card">
                <span class="metric-card-header">Profit Factor</span>
                <span class="metric-card-value">${res.profitFactor.toFixed(2)}</span>
                <span class="metric-card-sub">Sharpe Metric: ${res.sharpeRatio.toFixed(2)}</span>
              </div>
              <div class="metric-card">
                <span class="metric-card-header">Max Drawdown</span>
                <span class="metric-card-value change-neg">-${res.maxDrawdownPercent.toFixed(1)}%</span>
                <span class="metric-card-sub">Max Loss Streak: ${res.longestLosingStreak}</span>
              </div>
            </div>

            <div class="data-table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Trade</th>
                    <th>Type</th>
                    <th>Entry</th>
                    <th>Exit</th>
                    <th>Result</th>
                    <th>P&L ($)</th>
                    <th>P&L (%)</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  ${(res.trades || []).slice(0, 20).map(t => `
                    <tr>
                      <td>#${t.id}</td>
                      <td><span class="tab-badge badge-${t.type.toLowerCase()}">${t.type}</span></td>
                      <td>${t.entryPrice.toFixed(5)}</td>
                      <td>${t.exitPrice.toFixed(5)} (${t.exitReason})</td>
                      <td class="${t.profitLoss >= 0 ? 'change-pos' : 'change-neg'}">${t.profitLoss >= 0 ? 'WIN' : 'LOSS'}</td>
                      <td class="${t.profitLoss >= 0 ? 'change-pos' : 'change-neg'}">${t.profitLoss >= 0 ? '+' : ''}$${t.profitLoss.toFixed(2)}</td>
                      <td class="${t.profitLoss >= 0 ? 'change-pos' : 'change-neg'}">${t.profitLossPercent.toFixed(1)}%</td>
                      <td>$${t.balanceAfter.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        }
      } catch (err) {
        if (resultsContainer) {
          resultsContainer.innerHTML = `<div style="color: var(--color-sell); padding: 14px;">Backtest simulation error: ${err.message}</div>`;
        }
      }
    },

    startPolling() {
      // Poll ticker quote every 5 seconds, full analysis every 20 seconds
      this.pollTimer = setInterval(async () => {
        try {
          const q = await Api.getMarket(this.currentSymbol);
          if (q) {
            this.currentAnalysis = this.currentAnalysis || {};
            this.currentAnalysis.quote = q;
            this.renderTopbarTicker();
          }
        } catch { }
      }, 5000);
    }
  };

  window.App = App;
  App.init();
});
