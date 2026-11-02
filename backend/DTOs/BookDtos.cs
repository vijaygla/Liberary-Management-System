using System.ComponentModel.DataAnnotations;

namespace LibraryManagementSystem.Api.DTOs;

public class BookDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ISBN { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    public int AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    
    public int? PublisherId { get; set; }
    public string? PublisherName { get; set; }
    
    public int PublishedYear { get; set; }
    public string? Edition { get; set; }
    public string ShelfLocation { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    
    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateBookDto
{
    [Required]
    [StringLength(250)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string ISBN { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Required]
    public int AuthorId { get; set; }

    [Required]
    public int CategoryId { get; set; }

    public int? PublisherId { get; set; }

    public int PublishedYear { get; set; } = DateTime.UtcNow.Year;
    public string? Edition { get; set; }
    public string ShelfLocation { get; set; } = "General Stacks";
    public string? CoverImageUrl { get; set; }

    [Range(1, 1000)]
    public int TotalCopies { get; set; } = 1;
}

public class UpdateBookDto
{
    [Required]
    [StringLength(250)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string ISBN { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Required]
    public int AuthorId { get; set; }

    [Required]
    public int CategoryId { get; set; }

    public int? PublisherId { get; set; }

    public int PublishedYear { get; set; }
    public string? Edition { get; set; }
    public string ShelfLocation { get; set; } = "General Stacks";
    public string? CoverImageUrl { get; set; }

    [Range(1, 1000)]
    public int TotalCopies { get; set; }

    [Range(0, 1000)]
    public int AvailableCopies { get; set; }
}

public class BookQueryParameters
{
    public string? Search { get; set; }
    public int? CategoryId { get; set; }
    public int? AuthorId { get; set; }
    public bool? AvailableOnly { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 12;
    public string? SortBy { get; set; } = "title";
    public bool SortDescending { get; set; } = false;
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / (PageSize > 0 ? PageSize : 1));
}
