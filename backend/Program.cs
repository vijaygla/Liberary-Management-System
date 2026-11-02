using System.Text;
using LibraryManagementSystem.Api.Data;
using LibraryManagementSystem.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

// 1. Load .env environment variables into process
try
{
    var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
    if (File.Exists(envPath))
    {
        DotNetEnv.Env.Load(envPath);
    }
    else
    {
        DotNetEnv.Env.Load();
    }
}
catch (Exception ex)
{
    Console.WriteLine($"[Warning] Could not load .env file: {ex.Message}");
}

var builder = WebApplication.CreateBuilder(args);

// Add environment variables to builder configuration
builder.Configuration.AddEnvironmentVariables();

// Read configurations with fallback
var connectionString = builder.Configuration["DB_CONNECTION_STRING"]
    ?? Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
    ?? "Server=LIN-5CD6268KRS;Database=LiberaryManagementSystemDb;User Id=sa;Password=Capgemini@12345;TrustServerCertificate=True;";

var jwtSecret = builder.Configuration["JWT_SECRET"]
    ?? Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? "CapgeminiLibrarySuperSecretKey_Min32CharsLongSecure2026!#";

var jwtIssuer = builder.Configuration["JWT_ISSUER"]
    ?? Environment.GetEnvironmentVariable("JWT_ISSUER")
    ?? "LibraryManagementSystemApi";

var jwtAudience = builder.Configuration["JWT_AUDIENCE"]
    ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE")
    ?? "LibraryManagementSystemClient";

var allowedOriginsStr = builder.Configuration["ALLOWED_ORIGINS"]
    ?? Environment.GetEnvironmentVariable("ALLOWED_ORIGINS")
    ?? "http://localhost:4200,http://127.0.0.1:4200";

var allowedOrigins = allowedOriginsStr.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

// 2. Configure Database Context
builder.Services.AddDbContext<LibraryDbContext>(options =>
{
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null
        );
    });
});

// 3. Register Application Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IActivityLogService, ActivityLogService>();

// 4. Configure Authentication & JWT Bearer
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// 5. Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 6. Configure Swagger with JWT Support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Library Management System API",
        Version = "v1",
        Description = "Enterprise RESTful Web API for Library Management System with JWT Authentication."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 7. Auto-apply migrations and seed data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<LibraryDbContext>();
        await DbInitializer.InitializeAsync(context);
        Console.WriteLine("[Success] Database migrations and initialization completed.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Error] Database initialization failed: {ex.Message}");
    }
}

// 8. Pipeline Configuration
if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Library Management System API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseRouting();

app.UseCors("AllowAngularApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
