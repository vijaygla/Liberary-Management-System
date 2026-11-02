using System.ComponentModel.DataAnnotations;

namespace LibraryManagementSystem.Api.DTOs;

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int BookCount { get; set; }
}

public class CreateCategoryDto
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class AuthorDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Biography { get; set; }
    public string? Nationality { get; set; }
    public int BookCount { get; set; }
}

public class CreateAuthorDto
{
    [Required]
    [StringLength(150)]
    public string Name { get; set; } = string.Empty;
    public string? Biography { get; set; }
    public string? Nationality { get; set; }
}
