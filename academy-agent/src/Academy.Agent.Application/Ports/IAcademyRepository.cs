using Academy.Agent.Domain.Entities;

namespace Academy.Agent.Application.Ports;

public interface IAcademyRepository
{
    Task<IReadOnlyList<AcademyProgram>> GetActiveProgramsAsync(CancellationToken ct = default);
    Task<AcademyProgram?> GetProgramAsync(int id, CancellationToken ct = default);
}
