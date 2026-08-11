using System.Net.Http;
using Academy.Agent.Application;
using Academy.Agent.Application.Http;
using Academy.Agent.Application.Models;
using Academy.Agent.Application.Options;
using Academy.Agent.Application.Plugins;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Academy.Agent.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<SemanticKernelOptions>(configuration.GetSection(SemanticKernelOptions.SectionName));
        services.Configure<ChatOptions>(configuration.GetSection(ChatOptions.SectionName));
        services.Configure<PaymentInstructionsOptions>(configuration.GetSection(PaymentInstructionsOptions.SectionName));
        services.Configure<StorageOptions>(configuration.GetSection(StorageOptions.SectionName));
        services.Configure<WebSearchOptions>(configuration.GetSection(WebSearchOptions.SectionName));
        services.Configure<WhatsAppOptions>(configuration.GetSection(WhatsAppOptions.SectionName));

        services.AddSingleton<HttpClient>(_ =>
            new HttpClient(new GeminiFunctionRoleCompatibilityHandler(new HttpClientHandler())));

        services.AddScoped<AgentContext>();
        services.AddScoped<AcademyPlugin>();
        services.AddScoped<RegistrationPlugin>();
        services.AddScoped<WhatsAppPlugin>();
        services.AddScoped<SearchPlugin>();
        services.AddScoped<AgentEngine>();

        return services;
    }
}
