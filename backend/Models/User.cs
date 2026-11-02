using System.Text.Json.Serialization;

namespace LibraryManagementSystem.Api.Models;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    
    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Member"; // Admin, Librarian, Member
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string MembershipCardNumber { get; set; } = string.Empty;
    public DateTime MembershipDate { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // Navigation
    [JsonIgnore]
    public ICollection<BorrowRecord> BorrowRecords { get; set; } = new List<BorrowRecord>();
    
    [JsonIgnore]
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}
