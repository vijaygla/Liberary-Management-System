namespace LibraryManagementSystem.Api.Models;

public class BorrowRecord
{
    public int Id { get; set; }
    
    public int BookId { get; set; }
    public Book? Book { get; set; }
    
    public int UserId { get; set; }
    public User? User { get; set; }
    
    public DateTime BorrowDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(14);
    public DateTime? ReturnDate { get; set; }
    
    public string Status { get; set; } = "Active"; // Active, Returned, Overdue
    public decimal FineAmount { get; set; } = 0.0m;
    public bool FinePaid { get; set; } = true;
    public string? Notes { get; set; }
}
