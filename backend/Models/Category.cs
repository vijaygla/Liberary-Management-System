using System.Text.Json.Serialization;

namespace LibraryManagementSystem.Api.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    [JsonIgnore]
    public ICollection<Book> Books { get; set; } = new List<Book>();
}
