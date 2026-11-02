using System.Security.Claims;
using LibraryManagementSystem.Api.Data;
using LibraryManagementSystem.Api.DTOs;
using LibraryManagementSystem.Api.Models;
using LibraryManagementSystem.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly LibraryDbContext _context;
    private readonly IAuthService _authService;
    private readonly IActivityLogService _logService;

    public AuthController(LibraryDbContext context, IAuthService authService, IActivityLogService logService)
    {
        _context = context;
        _authService = authService;
        _logService = logService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower()))
        {
            return BadRequest(new { message = "An account with this email address already exists." });
        }

        var membershipNumber = "LIB-MEM-" + Random.Shared.Next(10000, 99999);
        var role = string.IsNullOrWhiteSpace(dto.Role) ? "Member" : dto.Role;
        if (role != "Admin" && role != "Librarian" && role != "Member")
        {
            role = "Member";
        }

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = _authService.HashPassword(dto.Password),
            Role = role,
            PhoneNumber = dto.PhoneNumber,
            Address = dto.Address,
            MembershipCardNumber = membershipNumber,
            MembershipDate = DateTime.UtcNow,
            IsActive = true
        };

        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        await _logService.LogAsync("USER_REGISTERED", $"User '{user.FullName}' registered as '{user.Role}'.", user.Id);

        var response = _authService.GenerateJwtToken(user);
        return Ok(response);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());
        if (user == null || !_authService.VerifyPassword(dto.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        if (!user.IsActive)
        {
            return Unauthorized(new { message = "Your library account has been deactivated. Please contact support." });
        }

        await _logService.LogAsync("USER_LOGGED_IN", $"User '{user.FullName}' logged in successfully.", user.Id);

        var response = _authService.GenerateJwtToken(user);
        return Ok(response);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserProfileDto>> GetCurrentUser()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        return Ok(new UserProfileDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            PhoneNumber = user.PhoneNumber,
            Address = user.Address,
            MembershipCardNumber = user.MembershipCardNumber,
            MembershipDate = user.MembershipDate,
            IsActive = user.IsActive
        });
    }
}
