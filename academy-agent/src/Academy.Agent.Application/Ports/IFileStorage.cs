namespace Academy.Agent.Application.Ports;

public interface IFileStorage
{
    Task<string> SaveAsync(Stream content, string fileName, string contentType, CancellationToken ct = default);
    string ResolveUrl(string storedPath);
}
