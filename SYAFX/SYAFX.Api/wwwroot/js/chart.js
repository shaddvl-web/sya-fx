/**
 * SYA FX — High-Performance Institutional Canvas Candlestick Engine
 * Zero external libraries. Pure HTML5 Canvas + Vanilla JS.
 */

class SyaChart {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Data buffers
    this.candles = [];
    this.analysis = null;
    this.symbol = 'EUR_USD';
    this.timeframe = 'M15';

    // Chart viewport state
    this.visibleBars = 60;
    this.maxBars = 180;
    this.minBars = 25;
    this.panOffset = 0; // Number of bars scrolled back from rightmost edge

    // Interaction state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartOffset = 0;
    this.crosshair = { x: -1, y: -1, active: false };

    // Display toggles
    this.showEma = true;
    this.showBb = true;
    this.showSr = true;
    this.showStructure = true;
    this.showRiskLines = true;
    this.subPane = 'RSI'; // 'RSI', 'MACD', 'VOLUME'

    // Color Palette — Immersive UI Theme
    this.colors = {
      bg: '#020204',
      grid: '#1a1a1f',
      axisText: '#4a4a5a',
      bullCandle: '#00ffa3',
      bearCandle: '#ff3d71',
      wickBull: '#00ffa3',
      wickBear: '#ff3d71',
      ema20: '#00ffa3',
      ema50: '#ff3d71',
      ema200: '#9d4edd',
      bbLine: 'rgba(0, 255, 163, 0.25)',
      bbFill: 'rgba(0, 255, 163, 0.03)',
      srSupport: '#00ffa3',
      srResistance: '#ff3d71',
      bosLine: '#00ffa3',
      chochLine: '#ffaa00',
      entryLine: '#00ffa3',
      slLine: '#ff3d71',
      tpLine: '#00ffa3',
      crosshair: '#4a4a5a'
    };

    this.initEvents();
    this.resize();
  }

  setData(candles, analysis = null, symbol = 'EUR_USD', timeframe = 'M15') {
    this.candles = candles || [];
    this.analysis = analysis;
    this.symbol = symbol;
    this.timeframe = timeframe;
    this.render();
  }

  setToggles(toggles) {
    if (toggles.showEma !== undefined) this.showEma = toggles.showEma;
    if (toggles.showBb !== undefined) this.showBb = toggles.showBb;
    if (toggles.showSr !== undefined) this.showSr = toggles.showSr;
    if (toggles.showStructure !== undefined) this.showStructure = toggles.showStructure;
    if (toggles.showRiskLines !== undefined) this.showRiskLines = toggles.showRiskLines;
    if (toggles.subPane !== undefined) this.subPane = toggles.subPane;
    this.render();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.render();
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartOffset = this.panOffset;
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        this.crosshair = { x, y, active: true };
      } else {
        this.crosshair.active = false;
      }

      if (this.isDragging) {
        const deltaX = e.clientX - this.dragStartX;
        const barWidth = (this.width - 70) / this.visibleBars;
        const barDelta = Math.round(deltaX / barWidth);
        this.panOffset = Math.max(0, Math.min(this.candles.length - this.visibleBars, this.dragStartOffset + barDelta));
      }

      this.render();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.crosshair.active = false;
      this.render();
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomIn = e.deltaY < 0;
      if (zoomIn) {
        this.visibleBars = Math.max(this.minBars, this.visibleBars - 4);
      } else {
        this.visibleBars = Math.min(this.maxBars, Math.min(this.candles.length, this.visibleBars + 4));
      }
      this.render();
    }, { passive: false });
  }

  render() {
    if (!this.ctx || !this.width || !this.height) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(0, 0, w, h);

    if (this.candles.length === 0) {
      ctx.fillStyle = this.colors.axisText;
      ctx.font = '14px SF Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO MARKET DATA LOADED', w / 2, h / 2);
      return;
    }

    const rightAxisWidth = 72;
    const bottomAxisHeight = 26;
    const subPaneHeight = 85;

    const mainChartWidth = w - rightAxisWidth;
    const mainChartHeight = h - bottomAxisHeight - subPaneHeight - 10;

    // Slice visible candles based on panOffset
    const total = this.candles.length;
    const endIndex = Math.max(0, total - this.panOffset);
    const startIndex = Math.max(0, endIndex - this.visibleBars);
    const visibleCandles = this.candles.slice(startIndex, endIndex);

    if (visibleCandles.length === 0) return;

    // Calculate Price Extrema for visible range
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (let c of visibleCandles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    }

    // Add 8% vertical padding
    const priceRange = maxPrice - minPrice || 0.001;
    minPrice -= priceRange * 0.08;
    maxPrice += priceRange * 0.08;

    const barWidth = mainChartWidth / visibleCandles.length;
    const candleBodyWidth = Math.max(2, barWidth * 0.72);

    const priceToY = (p) => {
      return mainChartHeight - ((p - minPrice) / (maxPrice - minPrice)) * mainChartHeight;
    };
    const yToPrice = (y) => {
      return maxPrice - (y / mainChartHeight) * (maxPrice - minPrice);
    };

    // 1. Draw Grid
    this.drawGrid(ctx, mainChartWidth, mainChartHeight, rightAxisWidth, bottomAxisHeight, minPrice, maxPrice, visibleCandles);

    // 2. Draw Support / Resistance Levels if enabled
    if (this.showSr && this.analysis?.technical) {
      this.drawSupportResistance(ctx, mainChartWidth, priceToY);
    }

    // 3. Draw Bollinger Bands if enabled
    if (this.showBb && this.analysis?.technical?.bollingerBands) {
      this.drawBollingerBands(ctx, mainChartWidth, priceToY);
    }

    // 4. Draw EMAs (20, 50, 200)
    if (this.showEma && this.analysis?.technical) {
      this.drawEmaLines(ctx, mainChartWidth, priceToY);
    }

    // 5. Draw Candlesticks & Volume
    visibleCandles.forEach((c, i) => {
      const x = i * barWidth + barWidth / 2;
      const isBull = c.close >= c.open;
      const color = isBull ? this.colors.bullCandle : this.colors.bearCandle;

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, priceToY(c.high));
      ctx.lineTo(x, priceToY(c.low));
      ctx.stroke();

      // Body
      const openY = priceToY(c.open);
      const closeY = priceToY(c.close);
      const topY = Math.min(openY, closeY);
      const bodyH = Math.max(1.5, Math.abs(openY - closeY));

      ctx.fillStyle = color;
      ctx.fillRect(x - candleBodyWidth / 2, topY, candleBodyWidth, bodyH);
    });

    // 6. Draw Market Structure Swing Markers (HH, HL, LH, LL) & BOS/CHOCH
    if (this.showStructure && this.analysis?.structure) {
      this.drawStructureMarkers(ctx, visibleCandles, startIndex, barWidth, priceToY);
    }

    // 7. Draw Risk Corridor Lines (Entry, SL, TP1, TP2)
    if (this.showRiskLines && this.analysis?.risk) {
      this.drawRiskCorridor(ctx, mainChartWidth, priceToY);
    }

    // 8. Draw Sub-Chart Pane (RSI / MACD)
    const subPaneTop = mainChartHeight + 10;
    this.drawSubPane(ctx, mainChartWidth, subPaneTop, subPaneHeight, visibleCandles);

    // 9. Draw Axes & Current Price Marker
    const lastVisibleCandle = visibleCandles.length > 0 ? visibleCandles[visibleCandles.length - 1] : null;
    this.drawAxes(ctx, w, h, mainChartWidth, mainChartHeight, rightAxisWidth, bottomAxisHeight, minPrice, maxPrice, lastVisibleCandle);

    // 10. Draw Crosshair & Price Bubble
    if (this.crosshair.active) {
      this.drawCrosshair(ctx, mainChartWidth, mainChartHeight, rightAxisWidth, bottomAxisHeight, yToPrice, visibleCandles, barWidth);
    }
  }

  drawGrid(ctx, w, h, rw, bh, minPrice, maxPrice, visibleCandles) {
    ctx.strokeStyle = this.colors.grid;
    ctx.lineWidth = 1;

    // Horizontal grid lines (5 steps)
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const y = (h / steps) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      const price = maxPrice - (i / steps) * (maxPrice - minPrice);
      ctx.fillStyle = this.colors.axisText;
      ctx.font = '10px SF Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(5), w + 6, y + 3);
    }

    // Vertical time lines
    const timeSteps = 6;
    for (let i = 0; i < timeSteps; i++) {
      const x = (w / timeSteps) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }

  drawSupportResistance(ctx, w, priceToY) {
    const sr = this.analysis.technical;
    ctx.setLineDash([4, 4]);

    // Resistances
    if (sr.resistanceLevels) {
      sr.resistanceLevels.forEach(res => {
        const y = priceToY(res);
        ctx.strokeStyle = 'rgba(255, 51, 102, 0.45)';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        ctx.fillStyle = '#FF3366';
        ctx.font = '9px SF Mono, monospace';
        ctx.fillText(`RES ${res.toFixed(5)}`, 8, y - 3);
      });
    }

    // Supports
    if (sr.supportLevels) {
      sr.supportLevels.forEach(sup => {
        const y = priceToY(sup);
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.45)';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        ctx.fillStyle = '#00E676';
        ctx.font = '9px SF Mono, monospace';
        ctx.fillText(`SUP ${sup.toFixed(5)}`, 8, y + 10);
      });
    }
    ctx.setLineDash([]);
  }

  drawBollingerBands(ctx, w, priceToY) {
    const bb = this.analysis.technical.bollingerBands;
    const yUpper = priceToY(bb.upper);
    const yMiddle = priceToY(bb.middle);
    const yLower = priceToY(bb.lower);

    // Shaded Channel
    ctx.fillStyle = this.colors.bbFill;
    ctx.fillRect(0, yUpper, w, yLower - yUpper);

    // Lines
    ctx.strokeStyle = this.colors.bbLine;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, yUpper); ctx.lineTo(w, yUpper);
    ctx.moveTo(0, yLower); ctx.lineTo(w, yLower);
    ctx.stroke();

    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(0, yMiddle); ctx.lineTo(w, yMiddle);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawEmaLines(ctx, w, priceToY) {
    const tech = this.analysis.technical;
    ctx.lineWidth = 1.5;

    // EMA 20
    ctx.strokeStyle = this.colors.ema20;
    const y20 = priceToY(tech.ema20);
    ctx.beginPath(); ctx.moveTo(0, y20); ctx.lineTo(w, y20); ctx.stroke();

    // EMA 50
    ctx.strokeStyle = this.colors.ema50;
    const y50 = priceToY(tech.ema50);
    ctx.beginPath(); ctx.moveTo(0, y50); ctx.lineTo(w, y50); ctx.stroke();

    // EMA 200
    ctx.strokeStyle = this.colors.ema200;
    const y200 = priceToY(tech.ema200);
    ctx.beginPath(); ctx.moveTo(0, y200); ctx.lineTo(w, y200); ctx.stroke();
  }

  drawStructureMarkers(ctx, visibleCandles, startIndex, barWidth, priceToY) {
    const st = this.analysis.structure;
    ctx.font = '9.5px SF Mono, monospace';
    ctx.textAlign = 'center';

    // Highs
    if (st.recentHighs) {
      st.recentHighs.forEach(h => {
        const localIdx = h.index - startIndex;
        if (localIdx >= 0 && localIdx < visibleCandles.length) {
          const x = localIdx * barWidth + barWidth / 2;
          const y = priceToY(h.price) - 8;

          ctx.fillStyle = h.type === 'HH' ? '#00E676' : '#FFB300';
          ctx.fillText(h.type, x, y);
        }
      });
    }

    // Lows
    if (st.recentLows) {
      st.recentLows.forEach(l => {
        const localIdx = l.index - startIndex;
        if (localIdx >= 0 && localIdx < visibleCandles.length) {
          const x = localIdx * barWidth + barWidth / 2;
          const y = priceToY(l.price) + 14;

          ctx.fillStyle = l.type === 'HL' ? '#00E676' : '#FF3366';
          ctx.fillText(l.type, x, y);
        }
      });
    }

    // BOS or CHOCH marker line
    if (st.bos && st.bos.detected) {
      const y = priceToY(st.bos.breakoutLevel);
      ctx.strokeStyle = this.colors.bosLine;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(barWidth * visibleCandles.length, y); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = this.colors.bosLine;
      ctx.fillText(`BOS (${st.bos.direction})`, barWidth * visibleCandles.length - 50, y - 4);
    }
  }

  drawRiskCorridor(ctx, w, priceToY) {
    const r = this.analysis.risk;
    if (!r.entry || !r.stopLoss) return;

    ctx.lineWidth = 1.2;

    // Entry Line (Cyan)
    const yEntry = priceToY(r.entry);
    ctx.strokeStyle = this.colors.entryLine;
    ctx.beginPath(); ctx.moveTo(0, yEntry); ctx.lineTo(w, yEntry); ctx.stroke();

    // Stop Loss Line (Red dashed)
    const ySl = priceToY(r.stopLoss);
    ctx.strokeStyle = this.colors.slLine;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, ySl); ctx.lineTo(w, ySl); ctx.stroke();

    // Take Profit 1 & 2 (Green dashed)
    const yTp1 = priceToY(r.takeProfit1);
    const yTp2 = priceToY(r.takeProfit2);
    ctx.strokeStyle = this.colors.tpLine;
    ctx.beginPath(); ctx.moveTo(0, yTp1); ctx.lineTo(w, yTp1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, yTp2); ctx.lineTo(w, yTp2); ctx.stroke();
    ctx.setLineDash([]);

    // Tags on right
    ctx.font = '9px SF Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = this.colors.entryLine; ctx.fillText(`ENTRY ${r.entry.toFixed(5)}`, w - 8, yEntry - 3);
    ctx.fillStyle = this.colors.slLine; ctx.fillText(`SL ${r.stopLoss.toFixed(5)}`, w - 8, ySl - 3);
    ctx.fillStyle = this.colors.tpLine; ctx.fillText(`TP1 ${r.takeProfit1.toFixed(5)}`, w - 8, yTp1 - 3);
    ctx.fillStyle = this.colors.tpLine; ctx.fillText(`TP2 (1:${r.riskRewardRatio})`, w - 8, yTp2 - 3);
  }

  drawSubPane(ctx, w, top, height, visibleCandles) {
    // Divider
    ctx.strokeStyle = this.colors.grid;
    ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(w, top); ctx.stroke();

    ctx.fillStyle = this.colors.axisText;
    ctx.font = '10px SF Mono, monospace';
    ctx.textAlign = 'left';

    if (this.subPane === 'RSI') {
      const rsiVal = this.analysis?.technical?.rsi14 || 50;
      ctx.fillText(`RSI 14 : ${rsiVal.toFixed(1)}`, 10, top + 14);

      // 70 and 30 Overbought/Oversold lines
      const y70 = top + height * 0.3;
      const y30 = top + height * 0.7;

      ctx.strokeStyle = 'rgba(255, 61, 113, 0.35)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(0, y70); ctx.lineTo(w, y70); ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 255, 163, 0.35)';
      ctx.beginPath(); ctx.moveTo(0, y30); ctx.lineTo(w, y30); ctx.stroke();
      ctx.setLineDash([]);

      // RSI Spark curve
      ctx.strokeStyle = '#00ffa3';
      ctx.lineWidth = 1.5;
      const barW = w / visibleCandles.length;
      ctx.beginPath();
      visibleCandles.forEach((c, idx) => {
        const x = idx * barW + barW / 2;
        // Mock curve reflecting normalized close relative to bounds
        const norm = Math.sin(idx * 0.2) * 20 + rsiVal;
        const y = top + height - (norm / 100) * height;
        if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    } else {
      // Volume bars
      ctx.fillText('VOLUME', 10, top + 14);
      const maxVol = Math.max(...visibleCandles.map(c => c.volume)) || 1000;
      const barW = w / visibleCandles.length;

      visibleCandles.forEach((c, idx) => {
        const barH = (c.volume / maxVol) * (height - 20);
        const x = idx * barW + barW * 0.15;
        ctx.fillStyle = c.close >= c.open ? 'rgba(0, 255, 163, 0.35)' : 'rgba(255, 61, 113, 0.35)';
        ctx.fillRect(x, top + height - barH, barW * 0.7, barH);
      });
    }
  }

  drawAxes(ctx, w, h, mw, mh, rw, bh, minPrice, maxPrice, lastCandle) {
    // Right Axis Background
    ctx.fillStyle = '#050508';
    ctx.fillRect(mw, 0, rw, h);
    ctx.strokeStyle = this.colors.grid;
    ctx.beginPath(); ctx.moveTo(mw, 0); ctx.lineTo(mw, h); ctx.stroke();

    // Bottom Axis Background
    ctx.fillRect(0, h - bh, w, bh);
    ctx.beginPath(); ctx.moveTo(0, h - bh); ctx.lineTo(w, h - bh); ctx.stroke();

    // Last Price Marker on Right Axis
    if (lastCandle) {
      const y = mh - ((lastCandle.close - minPrice) / (maxPrice - minPrice)) * mh;
      const isBull = lastCandle.close >= lastCandle.open;

      ctx.fillStyle = isBull ? this.colors.bullCandle : this.colors.bearCandle;
      ctx.fillRect(mw, y - 9, rw, 18);

      ctx.fillStyle = '#000';
      ctx.font = 'bold 10.5px SF Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(lastCandle.close.toFixed(5), mw + 6, y + 4);
    }
  }

  drawCrosshair(ctx, mw, mh, rw, bh, yToPrice, visibleCandles, barWidth) {
    const { x, y } = this.crosshair;
    if (x > mw || y > mh) return;

    ctx.strokeStyle = this.colors.crosshair;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 3]);

    // Horizontal line
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(mw, y); ctx.stroke();

    // Vertical line
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, mh + 95); ctx.stroke();
    ctx.setLineDash([]);

    // Price Bubble on right
    const price = yToPrice(y);
    ctx.fillStyle = '#243147';
    ctx.fillRect(mw, y - 8, rw, 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px SF Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(price.toFixed(5), mw + 6, y + 4);

    // Time Bubble on bottom
    const barIdx = Math.floor(x / barWidth);
    if (barIdx >= 0 && barIdx < visibleCandles.length) {
      const c = visibleCandles[barIdx];
      const dt = new Date(c.timestamp);
      const timeStr = `${dt.getUTCHours().toString().padStart(2, '0')}:${dt.getUTCMinutes().toString().padStart(2, '0')} UTC`;

      ctx.fillStyle = '#243147';
      ctx.fillRect(x - 36, this.height - bh + 4, 72, 18);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px SF Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(timeStr, x, this.height - bh + 17);
    }
  }
}

window.SyaChart = SyaChart;
