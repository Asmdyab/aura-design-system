using Academy.Agent.Application.Ports;
using Academy.Agent.Infrastructure.Integrations;
using Academy.Agent.Infrastructure.Persistence;
using Academy.Agent.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Academy.Agent.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("AzureSql") ??
            configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "No SQL Server connection string configured. Set ConnectionStrings:AzureSql (or DefaultConnection).");
        }

        services.AddDbContext<AcademyDbContext>(options => options.UseSqlServer(connectionString));

        services.AddScoped<IAcademyRepository, AcademyRepository>();
        services.AddScoped<IReservationRepository, ReservationRepository>();
        services.AddScoped<IConversationRepository, ConversationRepository>();
        services.AddScoped<IAdminNotifier, AdminNotifier>();

        services.AddHttpClient<IWhatsAppMessenger, WhatsAppMessenger>(client => client.Timeout = TimeSpan.FromSeconds(60));
        services.AddHttpClient<IWebSearchService, GoogleWebSearchService>(client => client.Timeout = TimeSpan.FromSeconds(25));
        services.AddSingleton<IFileStorage, LocalFileStorage>();

        return services;
    }
}
