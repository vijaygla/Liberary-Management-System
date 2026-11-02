using LibraryManagementSystem.Api.Data;
using LibraryManagementSystem.Api.DTOs;
using LibraryManagementSystem.Api.Models;
using LibraryManagementSystem.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly LibraryDbContext _context;
    private readonly IActivityLogService _logService;

    public BooksController(LibraryDbContext context, IActivityLogService logService)
    {
        _context = context;
        _logService = logService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<BookDto>>> GetBooks([FromQuery] BookQueryParameters query)
    {
        var booksQuery = _context.Books
            .Include(b => b.Author)
            .Include(b => b.Category)
            .Include(b => b.Publisher)
            .AsNoTracking();

        // Search
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var searchLower = query.Search.Trim().ToLower();
            booksQuery = booksQuery.Where(b =>
                b.Title.ToLower().Contains(searchLower) ||
                b.ISBN.ToLower().Contains(searchLower) ||
                b.Author!.Name.ToLower().Contains(searchLower) ||
                b.Category!.Name.ToLower().Contains(searchLower));
        }

        // Category filter
        if (query.CategoryId.HasValue && query.CategoryId.Value > 0)
        {
            booksQuery = booksQuery.Where(b => b.CategoryId == query.CategoryId.Value);
        }

        // Author filter
        if (query.AuthorId.HasValue && query.AuthorId.Value > 0)
        {
            booksQuery = booksQuery.Where(b => b.AuthorId == query.AuthorId.Value);
        }

        // Availability filter
        if (query.AvailableOnly == true)
        {
            booksQuery = booksQuery.Where(b => b.AvailableCopies > 0);
        }

        // Sorting
        booksQuery = (query.SortBy?.ToLower(), query.SortDescending) switch
        {
            ("year", false) => booksQuery.OrderBy(b => b.PublishedYear),
            ("year", true) => booksQuery.OrderByDescending(b => b.PublishedYear),
            ("author", false) => booksQuery.OrderBy(b => b.Author!.Name),
            ("author", true) => booksQuery.OrderByDescending(b => b.Author!.Name),
            ("available", false) => booksQuery.OrderBy(b => b.AvailableCopies),
            ("available", true) => booksQuery.OrderByDescending(b => b.AvailableCopies),
            ("title", true) => booksQuery.OrderByDescending(b => b.Title),
            _ => booksQuery.OrderBy(b => b.Title)
        };

        var totalCount = await booksQuery.CountAsync();
        var pageNumber = query.PageNumber > 0 ? query.PageNumber : 1;
        var pageSize = query.PageSize > 0 ? query.PageSize : 12;

        var items = await booksQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BookDto
            {
                Id = b.Id,
                Title = b.Title,
                ISBN = b.ISBN,
                Description = b.Description,
                AuthorId = b.AuthorId,
                AuthorName = b.Author != null ? b.Author.Name : string.Empty,
                CategoryId = b.CategoryId,
                CategoryName = b.Category != null ? b.Category.Name : string.Empty,
                PublisherId = b.PublisherId,
                PublisherName = b.Publisher != null ? b.Publisher.Name : null,
                PublishedYear = b.PublishedYear,
                Edition = b.Edition,
                ShelfLocation = b.ShelfLocation,
                CoverImageUrl = b.CoverImageUrl,
                TotalCopies = b.TotalCopies,
                AvailableCopies = b.AvailableCopies,
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();

        return Ok(new PagedResult<BookDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BookDto>> GetBook(int id)
    {
        var book = await _context.Books
            .Include(b => b.Author)
            .Include(b => b.Category)
            .Include(b => b.Publisher)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id);

        if (book == null)
        {
            return NotFound(new { message = $"Book with ID {id} not found." });
        }

        return Ok(new BookDto
        {
            Id = book.Id,
            Title = book.Title,
            ISBN = book.ISBN,
            Description = book.Description,
            AuthorId = book.AuthorId,
            AuthorName = book.Author?.Name ?? string.Empty,
            CategoryId = book.CategoryId,
            CategoryName = book.Category?.Name ?? string.Empty,
            PublisherId = book.PublisherId,
            PublisherName = book.Publisher?.Name,
            PublishedYear = book.PublishedYear,
            Edition = book.Edition,
            ShelfLocation = book.ShelfLocation,
            CoverImageUrl = book.CoverImageUrl,
            TotalCopies = book.TotalCopies,
            AvailableCopies = book.AvailableCopies,
            CreatedAt = book.CreatedAt
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Librarian")]
    public async Task<ActionResult<BookDto>> CreateBook([FromBody] CreateBookDto dto)
    {
        if (await _context.Books.AnyAsync(b => b.ISBN.ToLower() == dto.ISBN.ToLower()))
        {
            return BadRequest(new { message = "A book with this ISBN already exists." });
        }

        if (!await _context.Authors.AnyAsync(a => a.Id == dto.AuthorId))
        {
            return BadRequest(new { message = "Selected Author does not exist." });
        }

        if (!await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId))
        {
            return BadRequest(new { message = "Selected Category does not exist." });
        }

        var book = new Book
        {
            Title = dto.Title.Trim(),
            ISBN = dto.ISBN.Trim(),
            Description = dto.Description.Trim(),
            AuthorId = dto.AuthorId,
            CategoryId = dto.CategoryId,
            PublisherId = dto.PublisherId,
            PublishedYear = dto.PublishedYear,
            Edition = dto.Edition,
            ShelfLocation = string.IsNullOrWhiteSpace(dto.ShelfLocation) ? "General Stacks" : dto.ShelfLocation.Trim(),
            CoverImageUrl = dto.CoverImageUrl,
            TotalCopies = dto.TotalCopies,
            AvailableCopies = dto.TotalCopies,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Books.AddAsync(book);
        await _context.SaveChangesAsync();

        await _logService.LogAsync("BOOK_CREATED", $"New book '{book.Title}' added (ISBN: {book.ISBN}).");

        return CreatedAtAction(nameof(GetBook), new { id = book.Id }, new BookDto
        {
            Id = book.Id,
            Title = book.Title,
            ISBN = book.ISBN,
            Description = book.Description,
            AuthorId = book.AuthorId,
            CategoryId = book.CategoryId,
            PublisherId = book.PublisherId,
            PublishedYear = book.PublishedYear,
            Edition = book.Edition,
            ShelfLocation = book.ShelfLocation,
            CoverImageUrl = book.CoverImageUrl,
            TotalCopies = book.TotalCopies,
            AvailableCopies = book.AvailableCopies,
            CreatedAt = book.CreatedAt
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Librarian")]
    public async Task<IActionResult> UpdateBook(int id, [FromBody] UpdateBookDto dto)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null)
        {
            return NotFound(new { message = $"Book with ID {id} not found." });
        }

        if (await _context.Books.AnyAsync(b => b.ISBN.ToLower() == dto.ISBN.ToLower() && b.Id != id))
        {
            return BadRequest(new { message = "Another book with this ISBN already exists." });
        }

        book.Title = dto.Title.Trim();
        book.ISBN = dto.ISBN.Trim();
        book.Description = dto.Description.Trim();
        book.AuthorId = dto.AuthorId;
        book.CategoryId = dto.CategoryId;
        book.PublisherId = dto.PublisherId;
        book.PublishedYear = dto.PublishedYear;
        book.Edition = dto.Edition;
        book.ShelfLocation = dto.ShelfLocation.Trim();
        book.CoverImageUrl = dto.CoverImageUrl;
        book.TotalCopies = dto.TotalCopies;
        book.AvailableCopies = dto.AvailableCopies;

        await _context.SaveChangesAsync();
        await _logService.LogAsync("BOOK_UPDATED", $"Book '{book.Title}' updated.");

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteBook(int id)
    {
        var book = await _context.Books
            .Include(b => b.BorrowRecords)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (book == null)
        {
            return NotFound(new { message = $"Book with ID {id} not found." });
        }

        if (book.BorrowRecords.Any(r => r.Status == "Active" || r.Status == "Overdue"))
        {
            return BadRequest(new { message = "Cannot delete a book that is currently checked out by members." });
        }

        _context.Books.Remove(book);
        await _context.SaveChangesAsync();
        await _logService.LogAsync("BOOK_DELETED", $"Book '{book.Title}' (ID {id}) deleted.");

        return NoContent();
    }
}
