namespace LibraryManagementSystem.Api.Services;

public interface IActivityLogService
{
    Task LogAsync(string action, string details, int? userId = null);
}
