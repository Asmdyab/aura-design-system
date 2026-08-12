namespace Academy.Agent.Application.Ports;

public interface IAuthService
{
    Task<AuthToken?> LoginAsync(string userName, string password, CancellationToken ct = default);
}
