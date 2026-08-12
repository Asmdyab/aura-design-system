using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Academy.Agent.Application.Options;
using Academy.Agent.Application.Ports;
using Academy.Agent.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Academy.Agent.Infrastructure.Auth;

public sealed class JwtTokenService : ITokenService
{
    private readonly JwtOptions _options;

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    public AuthToken CreateToken(AdminUser user)
    {
        if (string.IsNullOrWhiteSpace(_options.SigningKey))
            throw new InvalidOperationException(
                "Jwt:SigningKey is not configured. Set it in appsettings or via environment variable Jwt__SigningKey.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expires = DateTime.UtcNow.AddHours(_options.ExpiryHours);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        return new AuthToken(
            new JwtSecurityTokenHandler().WriteToken(token),
            expires,
            new AdminUserInfo(user.Id, user.UserName, user.FullName));
    }
}
