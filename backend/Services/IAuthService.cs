using LibraryManagementSystem.Api.DTOs;
using LibraryManagementSystem.Api.Models;

namespace LibraryManagementSystem.Api.Services;

public interface IAuthService
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
    AuthResponseDto GenerateJwtToken(User user);
}
