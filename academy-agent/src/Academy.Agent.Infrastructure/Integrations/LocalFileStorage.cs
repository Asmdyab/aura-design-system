using Academy.Agent.Application.Options;
using Academy.Agent.Application.Ports;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Academy.Agent.Infrastructure.Integrations;

public sealed class LocalFileStorage : IFileStorage
{
    private readonly StorageOptions _options;
    private readonly ILogger<LocalFileStorage> _logger;

    public LocalFileStorage(IOptions<StorageOptions> options, ILogger<LocalFileStorage> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task<string> SaveAsync(Stream content, string fileName, string contentType, CancellationToken ct = default)
    {
        var safeName = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(safeName)) safeName = Guid.NewGuid().ToString("N") + ".bin";

        var root = Path.GetFullPath(_options.RootPath);
        Directory.CreateDirectory(root);

        var uniqueName = $"{Guid.NewGuid():N}-{safeName}";
        var fullPath = Path.Combine(root, uniqueName);

        await using (var file = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true))
        {
            await content.CopyToAsync(file, ct);
        }

        _logger.LogInformation("Stored file {Path}.", fullPath);
        return uniqueName;
    }

    public string ResolveUrl(string storedPath)
    {
        var baseUrl = _options.PublicBaseUrl.TrimEnd('/');
        return $"{baseUrl}/{storedPath.Replace('\\', '/').TrimStart('/')}";
    }
}
