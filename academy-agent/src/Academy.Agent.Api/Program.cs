using Academy.Agent.Api.Webhooks;
using Academy.Agent.Application;
using Academy.Agent.Infrastructure;
using Academy.Agent.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    var origins = builder.Configuration.GetSection("Chat:CorsOrigins").Get<string[]>() ?? Array.Empty<string>();
    options.AddPolicy("chat", policy =>
        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services
    .AddApplication(builder.Configuration)
    .AddInfrastructure(builder.Configuration);

builder.Services.AddSingleton<WhatsAppWebhookQueue>();
builder.Services.AddScoped<WhatsAppInboundHandler>();
builder.Services.AddHostedService<WhatsAppWebhookProcessor>();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors("chat");

var storagePath = Path.GetFullPath(builder.Configuration["Storage:RootPath"] ?? "uploads");
Directory.CreateDirectory(storagePath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(storagePath),
    RequestPath = "/uploads",
});

app.MapOpenApi();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AcademyDbContext>();
    db.Database.Migrate();
}

app.Run();
