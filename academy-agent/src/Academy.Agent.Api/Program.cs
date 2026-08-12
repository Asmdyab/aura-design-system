using System.Text;
using System.Text.Json.Serialization;
using Academy.Agent.Api.Hubs;
using Academy.Agent.Api.Services;
using Academy.Agent.Api.Webhooks;
using Academy.Agent.Application;
using Academy.Agent.Application.Options;
using Academy.Agent.Application.Ports;
using Academy.Agent.Infrastructure;
using Academy.Agent.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();
builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    var origins = builder.Configuration.GetSection("Chat:CorsOrigins").Get<string[]>() ?? Array.Empty<string>();
    options.AddPolicy("chat", policy =>
        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services
    .AddApplication(builder.Configuration)
    .AddInfrastructure(builder.Configuration);

builder.Services.AddSingleton<WhatsAppWebhookQueue>();
builder.Services.AddScoped<WhatsAppInboundHandler>();
builder.Services.AddHostedService<WhatsAppWebhookProcessor>();
builder.Services.AddHostedService<AdminSeedService>();
builder.Services.AddSingleton<IAdminNotificationBroadcaster, AdminNotificationBroadcaster>();

// JWT auth
var jwtKey = builder.Configuration["Jwt:SigningKey"];
var signingKey = string.IsNullOrWhiteSpace(jwtKey)
    ? null
    : new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "academy-agent",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "academy-admin",
            ValidateIssuerSigningKey = signingKey is not null,
            IssuerSigningKey = signingKey,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
        };

        // Allow SignalR browser clients to pass the token via query string.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) &&
                    (                 path.StartsWithSegments("/hubs/admin-notifications")))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                return context.Response.WriteAsJsonAsync(new { error = "لم يتم المصادقة — الرجاء تسجيل الدخول." });
            },
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy =>
        policy.RequireAuthenticatedUser().RequireRole("Admin"));
});

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors("chat");

app.UseAuthentication();
app.UseAuthorization();

var storagePath = Path.GetFullPath(builder.Configuration["Storage:RootPath"] ?? "uploads");
Directory.CreateDirectory(storagePath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(storagePath),
    RequestPath = "/uploads",
});

app.MapOpenApi();

// Public chat + webhook endpoints
app.MapControllers();

// Admin hub (JWT-protected via [Authorize] on the hub class)
app.MapHub<AdminNotificationsHub>("/hubs/admin-notifications");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AcademyDbContext>();
    db.Database.Migrate();
}

app.Run();
