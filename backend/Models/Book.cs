using System.Text.Json.Serialization;

namespace LibraryManagementSystem.Api.Models;

public class Book
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ISBN { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    public int AuthorId { get; set; }
    public Author? Author { get; set; }
    
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
    
    public int? PublisherId { get; set; }
    public Publisher? Publisher { get; set; }
    
    public int PublishedYear { get; set; }
    public string? Edition { get; set; }
    public string ShelfLocation { get; set; } = "General Stacks";
    public string? CoverImageUrl { get; set; }
    
    public int TotalCopies { get; set; } = 1;
    public int AvailableCopies { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ICollection<BorrowRecord> BorrowRecords { get; set; } = new List<BorrowRecord>();

    [JsonIgnore]
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}
