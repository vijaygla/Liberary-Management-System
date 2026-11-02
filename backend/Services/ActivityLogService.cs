using LibraryManagementSystem.Api.Data;
using LibraryManagementSystem.Api.Models;

namespace LibraryManagementSystem.Api.Services;

public class ActivityLogService : IActivityLogService
{
    private readonly LibraryDbContext _context;

    public ActivityLogService(LibraryDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(string action, string details, int? userId = null)
    {
        try
        {
            var log = new ActivityLog
            {
                UserId = userId,
                Action = action,
                Details = details,
                Timestamp = DateTime.UtcNow
            };
            await _context.ActivityLogs.AddAsync(log);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Fail-safe for audit logs so core operations are never disrupted
        }
    }
}
