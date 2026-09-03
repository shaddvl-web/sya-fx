export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketQuoteDto {
  symbol: string;
  displayName: string;
  bid: number;
  ask: number;
  lastPrice: number;
  change24h: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  spread: number;
  volume24h: number;
  sessionStatus: string;
  lastUpdated: string;
  digits?: number;
  spreadPips?: number;
}

export interface MacdValueDto {
  macdLine: number;
  signalLine: number;
  histogram: number;
  crossover: string;
}

export interface BollingerBandsDto {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number;
}

export interface AdxDto {
  value: number;
  plusDi: number;
  minusDi: number;
  trendStrength: string;
}

export interface StochasticDto {
  k: number;
  d: number;
  condition: string;
}

export interface TechnicalAnalysisDto {
  ema20: number;
  ema50: number;
  ema200: number;
  rsi14: number;
  rsiCondition: string;
  macd: MacdValueDto;
  atr14: number;
  bollingerBands: BollingerBandsDto;
  adx: AdxDto;
  stochastic: StochasticDto;
  supportLevels: number[];
  resistanceLevels: number[];
  vwap: number;
  overallTechnicalBias: string;
}

export interface SwingPointDto {
  index: number;
  timestamp: string;
  price: number;
  type: string;
}

export interface StructureBreakDto {
  detected: boolean;
  type: string;
  direction: string;
  breakoutLevel: number;
  candleIndex: number;
  timestamp: string;
  volumeRatio: number;
  confirmationReason: string;
}

export interface MarketStructureDto {
  structure: string;
  confidence: number;
  recentHighs: SwingPointDto[];
  recentLows: SwingPointDto[];
  bos: StructureBreakDto | null;
  choch: StructureBreakDto | null;
  majorResistance: number;
  majorSupport: number;
  explanation: string;
}

export interface PatternDetectionDto {
  pattern: string;
  kurdishName?: string;
  direction: string;
  confidence: number;
  quality: number;
  startIndex: number;
  endIndex: number;
  validationStatus: string;
  targetPrice: number;
  invalidationLevel: number;
  description: string;
  kurdishDescription?: string;
}

export interface ConfluenceSignalDto {
  symbol: string;
  timeframe: string;
  technicalScore: number;
  structureScore: number;
  patternScore: number;
  momentumScore: number;
  riskScore: number;
  finalScore: number;
  signal: 'BUY' | 'SELL' | 'WAIT';
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  confluenceFactors: string[];
  conflictingFactors: string[];
  timestamp: string;
}

export interface RiskInfoDto {
  currentPrice: number;
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskRewardRatio: number;
  atrRiskPoints: number;
  recommendedPositionUnits: number;
  maxRiskPercent: number;
  invalidationRule: string;
  slPips: number;
  tp1Pips: number;
  tp2Pips: number;
  pipUnit: string;
}

export interface FullAnalysisDto {
  symbol: string;
  timeframe: string;
  currentPrice: number;
  quote: MarketQuoteDto;
  technical: TechnicalAnalysisDto;
  structure: MarketStructureDto;
  patterns: PatternDetectionDto[];
  signal: ConfluenceSignalDto;
  risk: RiskInfoDto;
  analysisTimestamp: string;
}

export interface SignalRecord {
  id: number;
  symbol: string;
  timeframe: string;
  signalType: string;
  score: number;
  confidence: number;
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskRewardRatio: number;
  timestamp: string;
  result: string;
  strategyVersion: string;
  technicalScore: number;
  structureScore: number;
  patternScore: number;
  momentumScore: number;
  riskScore: number;
  notes: string;
}

export interface BacktestRequestDto {
  symbol: string;
  timeframe?: string;
  strategy?: string;
  startDate?: string;
  endDate?: string;
  initialBalance?: number;
  riskPerTradePercent?: number;
}

export interface BacktestTradeDto {
  id: number;
  entryTime: string;
  exitTime: string;
  type: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  profitLoss: number;
  profitLossPercent: number;
  balanceAfter: number;
  exitReason: string;
}

export interface EquityPointDto {
  timestamp: string;
  equity: number;
  drawdownPercent: number;
}

export interface BacktestResultDto {
  symbol: string;
  timeframe: string;
  strategy: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  netProfit: number;
  netProfitPercent: number;
  maxDrawdownPercent: number;
  averageRiskReward: number;
  sharpeRatio: number;
  longestLosingStreak: number;
  longestWinningStreak: number;
  initialBalance: number;
  finalBalance: number;
  equityCurve: EquityPointDto[];
  trades: BacktestTradeDto[];
}
