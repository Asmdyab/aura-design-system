using Academy.Agent.Application.Options;
using Academy.Agent.Application.Ports;
using Academy.Agent.Domain.Entities;
using Academy.Agent.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Academy.Agent.Api.Services;

public sealed class AdminSeedService : IHostedService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<AdminSeedService> _logger;

    public AdminSeedService(IServiceProvider services, ILogger<AdminSeedService> logger)
    {
        _services = services;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = _services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AcademyDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var options = scope.ServiceProvider.GetRequiredService<IOptions<AdminSeedOptions>>().Value;

        var exists = await db.AdminUsers.AnyAsync(cancellationToken);
        if (exists) return;

        var password = options.Password;
        if (string.IsNullOrWhiteSpace(password))
        {
            password = "Admin@123";
            _logger.LogWarning(
                "No AdminSeed:Password configured. Seeding default admin '{UserName}' with default password '{Password}'. Change it immediately.",
                options.UserName, password);
        }

        var (hash, salt) = hasher.Hash(password);

        db.AdminUsers.Add(new AdminUser
        {
            Id = Guid.NewGuid(),
            UserName = options.UserName,
            PasswordHash = hash,
            PasswordSalt = salt,
            FullName = options.FullName,
            IsActive = true,
        });

        await db.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded default admin '{UserName}'.", options.UserName);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
