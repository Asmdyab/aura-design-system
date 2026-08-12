using Academy.Agent.Application.Ports;
using Academy.Agent.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Academy.Agent.Infrastructure.Auth;

public sealed class AuthService : IAuthService
{
    private readonly AcademyDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly ITokenService _tokenService;

    public AuthService(AcademyDbContext db, IPasswordHasher hasher, ITokenService tokenService)
    {
        _db = db;
        _hasher = hasher;
        _tokenService = tokenService;
    }

    public async Task<AuthToken?> LoginAsync(string userName, string password, CancellationToken ct = default)
    {
        var user = await _db.AdminUsers
            .FirstOrDefaultAsync(u => u.UserName == userName && u.IsActive, ct);

        if (user is null)
            return null;

        if (!_hasher.Verify(password, user.PasswordHash, user.PasswordSalt))
            return null;

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return _tokenService.CreateToken(user);
    }
}
