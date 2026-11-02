using LibraryManagementSystem.Api.Data;
using LibraryManagementSystem.Api.DTOs;
using LibraryManagementSystem.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthorsController : ControllerBase
{
    private readonly LibraryDbContext _context;

    public AuthorsController(LibraryDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AuthorDto>>> GetAuthors()
    {
        var authors = await _context.Authors
            .Include(a => a.Books)
            .AsNoTracking()
            .Select(a => new AuthorDto
            {
                Id = a.Id,
                Name = a.Name,
                Biography = a.Biography,
                Nationality = a.Nationality,
                BookCount = a.Books.Count
            })
            .OrderBy(a => a.Name)
            .ToListAsync();

        return Ok(authors);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AuthorDto>> GetAuthor(int id)
    {
        var author = await _context.Authors
            .Include(a => a.Books)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id);

        if (author == null)
        {
            return NotFound(new { message = $"Author with ID {id} not found." });
        }

        return Ok(new AuthorDto
        {
            Id = author.Id,
            Name = author.Name,
            Biography = author.Biography,
            Nationality = author.Nationality,
            BookCount = author.Books.Count
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Librarian")]
    public async Task<ActionResult<AuthorDto>> CreateAuthor([FromBody] CreateAuthorDto dto)
    {
        var author = new Author
        {
            Name = dto.Name.Trim(),
            Biography = dto.Biography?.Trim(),
            Nationality = dto.Nationality?.Trim()
        };

        await _context.Authors.AddAsync(author);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAuthor), new { id = author.Id }, new AuthorDto
        {
            Id = author.Id,
            Name = author.Name,
            Biography = author.Biography,
            Nationality = author.Nationality,
            BookCount = 0
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Librarian")]
    public async Task<IActionResult> UpdateAuthor(int id, [FromBody] CreateAuthorDto dto)
    {
        var author = await _context.Authors.FindAsync(id);
        if (author == null)
        {
            return NotFound(new { message = $"Author with ID {id} not found." });
        }

        author.Name = dto.Name.Trim();
        author.Biography = dto.Biography?.Trim();
        author.Nationality = dto.Nationality?.Trim();

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAuthor(int id)
    {
        var author = await _context.Authors
            .Include(a => a.Books)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (author == null)
        {
            return NotFound(new { message = $"Author with ID {id} not found." });
        }

        if (author.Books.Any())
        {
            return BadRequest(new { message = "Cannot delete author who has associated books in the library." });
        }

        _context.Authors.Remove(author);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
