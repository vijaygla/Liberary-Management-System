using System.Text.Json.Serialization;

namespace LibraryManagementSystem.Api.Models;

public class Author
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Biography { get; set; }
    public string? Nationality { get; set; }

    [JsonIgnore]
    public ICollection<Book> Books { get; set; } = new List<Book>();
}
