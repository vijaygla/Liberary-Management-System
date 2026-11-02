using System.Text.Json.Serialization;

namespace LibraryManagementSystem.Api.Models;

public class Publisher
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? Address { get; set; }

    [JsonIgnore]
    public ICollection<Book> Books { get; set; } = new List<Book>();
}
