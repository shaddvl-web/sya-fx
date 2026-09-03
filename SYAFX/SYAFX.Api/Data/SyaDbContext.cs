using Microsoft.EntityFrameworkCore;
using SYAFX.Api.Models;

namespace SYAFX.Api.Data;

public class SyaDbContext : DbContext
{
    public SyaDbContext(DbContextOptions<SyaDbContext> options) : base(options)
    {
    }

    public DbSet<MarketSymbol> MarketSymbols => Set<MarketSymbol>();
    public DbSet<Candle> Candles => Set<Candle>();
    public DbSet<SignalRecord> SignalRecords => Set<SignalRecord>();
    public DbSet<BacktestRecord> BacktestRecords => Set<BacktestRecord>();
    public DbSet<AiAnalysisRecord> AiAnalysisRecords => Set<AiAnalysisRecord>();
    public DbSet<TerminalSetting> TerminalSettings => Set<TerminalSetting>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // MarketSymbol configurations
        modelBuilder.Entity<MarketSymbol>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Symbol).IsUnique();
            entity.Property(e => e.Symbol).IsRequired().HasMaxLength(20);
            entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(50);
        });

        // Candle optimizations for large datasets
        modelBuilder.Entity<Candle>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.Symbol, e.Timeframe, e.Timestamp }).IsUnique();
            entity.HasIndex(e => new { e.Symbol, e.Timestamp });
            entity.Property(e => e.Symbol).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Timeframe).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Open).HasPrecision(18, 6);
            entity.Property(e => e.High).HasPrecision(18, 6);
            entity.Property(e => e.Low).HasPrecision(18, 6);
            entity.Property(e => e.Close).HasPrecision(18, 6);
            entity.Property(e => e.Volume).HasPrecision(18, 2);
        });

        // SignalRecord configurations
        modelBuilder.Entity<SignalRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.Symbol, e.Timestamp });
            entity.HasIndex(e => e.SignalType);
            entity.Property(e => e.Symbol).IsRequired().HasMaxLength(20);
            entity.Property(e => e.SignalType).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Entry).HasPrecision(18, 6);
            entity.Property(e => e.StopLoss).HasPrecision(18, 6);
            entity.Property(e => e.TakeProfit1).HasPrecision(18, 6);
            entity.Property(e => e.TakeProfit2).HasPrecision(18, 6);
        });

        // BacktestRecord configurations
        modelBuilder.Entity<BacktestRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.Symbol, e.CreatedAt });
            entity.Property(e => e.Symbol).IsRequired().HasMaxLength(20);
            entity.Property(e => e.InitialBalance).HasPrecision(18, 2);
            entity.Property(e => e.FinalBalance).HasPrecision(18, 2);
            entity.Property(e => e.NetProfit).HasPrecision(18, 2);
        });

        // AiAnalysisRecord configurations
        modelBuilder.Entity<AiAnalysisRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.Symbol, e.CreatedAt });
            entity.Property(e => e.Symbol).IsRequired().HasMaxLength(20);
        });

        // TerminalSetting
        modelBuilder.Entity<TerminalSetting>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Key).IsUnique();
        });

        // Seed initial market symbols
        modelBuilder.Entity<MarketSymbol>().HasData(
            new MarketSymbol { Id = 1, Symbol = "EUR_USD", BaseCurrency = "EUR", QuoteCurrency = "USD", DisplayName = "EUR/USD", Digits = 5, PipSize = 0.0001m, TypicalSpread = 0.8m },
            new MarketSymbol { Id = 2, Symbol = "GBP_USD", BaseCurrency = "GBP", QuoteCurrency = "USD", DisplayName = "GBP/USD", Digits = 5, PipSize = 0.0001m, TypicalSpread = 1.1m },
            new MarketSymbol { Id = 3, Symbol = "USD_JPY", BaseCurrency = "USD", QuoteCurrency = "JPY", DisplayName = "USD/JPY", Digits = 3, PipSize = 0.01m, TypicalSpread = 0.9m },
            new MarketSymbol { Id = 4, Symbol = "USD_CHF", BaseCurrency = "USD", QuoteCurrency = "CHF", DisplayName = "USD/CHF", Digits = 5, PipSize = 0.0001m, TypicalSpread = 1.2m },
            new MarketSymbol { Id = 5, Symbol = "AUD_USD", BaseCurrency = "AUD", QuoteCurrency = "USD", DisplayName = "AUD/USD", Digits = 5, PipSize = 0.0001m, TypicalSpread = 1.0m },
            new MarketSymbol { Id = 6, Symbol = "USD_CAD", BaseCurrency = "USD", QuoteCurrency = "CAD", DisplayName = "USD/CAD", Digits = 5, PipSize = 0.0001m, TypicalSpread = 1.3m },
            new MarketSymbol { Id = 7, Symbol = "NZD_USD", BaseCurrency = "NZD", QuoteCurrency = "USD", DisplayName = "NZD/USD", Digits = 5, PipSize = 0.0001m, TypicalSpread = 1.5m },
            new MarketSymbol { Id = 8, Symbol = "XAU_USD", BaseCurrency = "XAU", QuoteCurrency = "USD", DisplayName = "XAU/USD (Gold)", Digits = 2, PipSize = 0.1m, TypicalSpread = 2.5m }
        );
    }
}
