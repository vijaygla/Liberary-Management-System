using LibraryManagementSystem.Api.Data;
using LibraryManagementSystem.Api.DTOs;
using LibraryManagementSystem.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly LibraryDbContext _context;
    private readonly IActivityLogService _logService;

    public UsersController(LibraryDbContext context, IActivityLogService logService)
    {
        _context = context;
        _logService = logService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Librarian")]
    public async Task<ActionResult<IEnumerable<UserProfileDto>>> GetUsers([FromQuery] string? role, [FromQuery] string? search)
    {
        var query = _context.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(role))
        {
            query = query.Where(u => u.Role.ToLower() == role.Trim().ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(u =>
                u.FullName.ToLower().Contains(searchLower) ||
                u.Email.ToLower().Contains(searchLower) ||
                u.MembershipCardNumber.ToLower().Contains(searchLower));
        }

        var users = await query
            .OrderBy(u => u.FullName)
            .Select(u => new UserProfileDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role,
                PhoneNumber = u.PhoneNumber,
                Address = u.Address,
                MembershipCardNumber = u.MembershipCardNumber,
                MembershipDate = u.MembershipDate,
                IsActive = u.IsActive
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<UserProfileDto>> GetUserById(int id)
    {
        var user = await _context.Users.FindAsync(id);
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

    [HttpPut("{id}/toggle-status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleUserStatus(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        user.IsActive = !user.IsActive;
        await _context.SaveChangesAsync();

        await _logService.LogAsync("USER_STATUS_TOGGLED", $"User '{user.FullName}' status changed to {(user.IsActive ? "Active" : "Inactive")}.", user.Id);

        return Ok(new { message = $"User status updated to {(user.IsActive ? "Active" : "Inactive")}.", isActive = user.IsActive });
    }
}
