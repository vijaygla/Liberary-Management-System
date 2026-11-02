using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LibraryManagementSystem.Api.DTOs;
using LibraryManagementSystem.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace LibraryManagementSystem.Api.Services;

public class AuthService : IAuthService
{
    private readonly IConfiguration _configuration;

    public AuthService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
        catch
        {
            return false;
        }
    }

    public AuthResponseDto GenerateJwtToken(User user)
    {
        var secretKey = _configuration["JWT_SECRET"] 
            ?? Environment.GetEnvironmentVariable("JWT_SECRET") 
            ?? "CapgeminiLibrarySuperSecretKey_Min32CharsLongSecure2026!#";
        
        var issuer = _configuration["JWT_ISSUER"] 
            ?? Environment.GetEnvironmentVariable("JWT_ISSUER") 
            ?? "LibraryManagementSystemApi";

        var audience = _configuration["JWT_AUDIENCE"] 
            ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE") 
            ?? "LibraryManagementSystemClient";

        var expiryMinutesStr = _configuration["JWT_EXPIRY_MINUTES"] 
            ?? Environment.GetEnvironmentVariable("JWT_EXPIRY_MINUTES") 
            ?? "1440";

        if (!double.TryParse(expiryMinutesStr, out var expiryMinutes))
        {
            expiryMinutes = 1440;
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role),
            new("MembershipCardNumber", user.MembershipCardNumber)
        };

        var expires = DateTime.UtcNow.AddMinutes(expiryMinutes);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenString = tokenHandler.WriteToken(token);

        return new AuthResponseDto
        {
            Token = tokenString,
            ExpiresAt = expires,
            User = new UserProfileDto
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
            }
        };
    }
}
