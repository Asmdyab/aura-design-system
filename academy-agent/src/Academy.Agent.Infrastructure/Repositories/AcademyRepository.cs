using Academy.Agent.Application.Ports;
using Academy.Agent.Domain.Entities;
using Academy.Agent.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Academy.Agent.Infrastructure.Repositories;

public sealed class AcademyRepository : IAcademyRepository
{
    private readonly AcademyDbContext _db;

    public AcademyRepository(AcademyDbContext db) => _db = db;

    public async Task<IReadOnlyList<AcademyProgram>> GetActiveProgramsAsync(CancellationToken ct = default)
    {
        var programs = await _db.Programs.AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.Id)
            .ToListAsync(ct);

        return programs;
    }

    public async Task<AcademyProgram?> GetProgramAsync(int id, CancellationToken ct = default) =>
        await _db.Programs.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, ct);
}
