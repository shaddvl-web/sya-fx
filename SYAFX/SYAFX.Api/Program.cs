using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using SYAFX.Api.Data;
using SYAFX.Api.Engines;
using SYAFX.Api.Middleware;
using SYAFX.Api.Services;

Environment.SetEnvironmentVariable("ASPNETCORE_HTTP_PORTS", "5000");
Environment.SetEnvironmentVariable("ASPNETCORE_URLS", "http://127.0.0.1:5000");

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://127.0.0.1:5000");

// 1. Database - SQLite for development, configured for high-performance Forex candles
string dbPath = Path.Combine(builder.Environment.ContentRootPath, "syafx.db");
builder.Services.AddDbContext<SyaDbContext>(options =>
{
    options.UseSqlite($"Data Source={dbPath}");
});

// 2. HTTP Client & Services
builder.Services.AddHttpClient();
builder.Services.AddScoped<IMarketDataProvider, MarketDataEngine>();
builder.Services.AddScoped<BacktestEngine>();
builder.Services.AddScoped<AiAnalystService>();
builder.Services.AddScoped<AnalysisCoordinatorService>();

// 3. Controllers and JSON serialization
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// 4. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});



var app = builder.Build();

// 5. Ensure SQLite Database & Seed Data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SyaDbContext>();
    db.Database.EnsureCreated();
}

// 6. Middleware Pipeline
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseCors("AllowAll");

// 7. Static Files for SYAFX.Web
// Check both sibling ../SYAFX.Web and root SYAFX/SYAFX.Web
string webPath = Path.Combine(builder.Environment.ContentRootPath, "..", "SYAFX.Web");
if (!Directory.Exists(webPath))
{
    webPath = Path.Combine(Directory.GetCurrentDirectory(), "SYAFX", "SYAFX.Web");
}
if (!Directory.Exists(webPath))
{
    webPath = Path.Combine(Directory.GetCurrentDirectory(), "SYAFX.Web");
}

if (Directory.Exists(webPath))
{
    var fileProvider = new PhysicalFileProvider(Path.GetFullPath(webPath));
    var defaultFilesOptions = new DefaultFilesOptions
    {
        FileProvider = fileProvider,
        RequestPath = ""
    };
    defaultFilesOptions.DefaultFileNames.Clear();
    defaultFilesOptions.DefaultFileNames.Add("index.html");

    app.UseDefaultFiles(defaultFilesOptions);
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = fileProvider,
        RequestPath = ""
    });
}
else
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.MapControllers();

// Fallback for SPA routing if requested
app.MapFallback(async context =>
{
    if (context.Request.Path.StartsWithSegments("/api"))
    {
        context.Response.StatusCode = 404;
        await context.Response.WriteAsJsonAsync(new { success = false, error = new { code = "ENDPOINT_NOT_FOUND", message = "API endpoint not found" } });
        return;
    }

    string indexFile = Path.Combine(webPath, "index.html");
    if (File.Exists(indexFile))
    {
        context.Response.ContentType = "text/html";
        await context.Response.SendFileAsync(indexFile);
    }
    else
    {
        context.Response.StatusCode = 200;
        await context.Response.WriteAsync("SYA FX Server Running. Frontend files not found.");
    }
});

app.Run();
