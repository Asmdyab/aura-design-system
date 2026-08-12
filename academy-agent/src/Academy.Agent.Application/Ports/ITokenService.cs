using Academy.Agent.Domain.Entities;

namespace Academy.Agent.Application.Ports;

public record AuthToken(string AccessToken, DateTime ExpiresAt, AdminUserInfo User);

public record AdminUserInfo(Guid Id, string UserName, string FullName);

public interface ITokenService
{
    AuthToken CreateToken(AdminUser user);
}
