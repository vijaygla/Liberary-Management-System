using System.Security.Claims;
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
public class BorrowRecordsController : ControllerBase
{
    private readonly LibraryDbContext _context;
    private readonly IActivityLogService _logService;
    private const decimal DailyFineRate = 1.00m; // $1.00 per overdue day

    public BorrowRecordsController(LibraryDbContext context, IActivityLogService logService)
    {
        _context = context;
        _logService = logService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Librarian")]
    public async Task<ActionResult<IEnumerable<BorrowRecordDto>>> GetAllBorrows([FromQuery] string? status)
    {
        var query = _context.BorrowRecords
            .Include(r => r.Book)
            .Include(r => r.User)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(r => r.Status.ToLower() == status.Trim().ToLower());
        }

        var results = await query
            .OrderByDescending(r => r.BorrowDate)
            .Select(r => new BorrowRecordDto
            {
                Id = r.Id,
                BookId = r.BookId,
                BookTitle = r.Book != null ? r.Book.Title : string.Empty,
                BookIsbn = r.Book != null ? r.Book.ISBN : string.Empty,
                BookCoverUrl = r.Book != null ? r.Book.CoverImageUrl : null,
                UserId = r.UserId,
                UserName = r.User != null ? r.User.FullName : string.Empty,
                UserEmail = r.User != null ? r.User.Email : string.Empty,
                MembershipCardNumber = r.User != null ? r.User.MembershipCardNumber : string.Empty,
                BorrowDate = r.BorrowDate,
                DueDate = r.DueDate,
                ReturnDate = r.ReturnDate,
                Status = r.Status,
                FineAmount = r.FineAmount,
                FinePaid = r.FinePaid,
                Notes = r.Notes
            })
            .ToListAsync();

        return Ok(results);
    }

    [HttpGet("my-history")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<BorrowRecordDto>>> GetMyBorrowHistory()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var history = await _context.BorrowRecords
            .Include(r => r.Book)
            .Include(r => r.User)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.BorrowDate)
            .Select(r => new BorrowRecordDto
            {
                Id = r.Id,
                BookId = r.BookId,
                BookTitle = r.Book != null ? r.Book.Title : string.Empty,
                BookIsbn = r.Book != null ? r.Book.ISBN : string.Empty,
                BookCoverUrl = r.Book != null ? r.Book.CoverImageUrl : null,
                UserId = r.UserId,
                UserName = r.User != null ? r.User.FullName : string.Empty,
                UserEmail = r.User != null ? r.User.Email : string.Empty,
                MembershipCardNumber = r.User != null ? r.User.MembershipCardNumber : string.Empty,
                BorrowDate = r.BorrowDate,
                DueDate = r.DueDate,
                ReturnDate = r.ReturnDate,
                Status = r.Status,
                FineAmount = r.FineAmount,
                FinePaid = r.FinePaid,
                Notes = r.Notes
            })
            .ToListAsync();

        return Ok(history);
    }

    [HttpPost("borrow")]
    [Authorize]
    public async Task<ActionResult<BorrowRecordDto>> BorrowBook([FromBody] BorrowRequestDto dto)
    {
        var book = await _context.Books.FindAsync(dto.BookId);
        if (book == null)
        {
            return NotFound(new { message = "Book not found." });
        }

        if (book.AvailableCopies <= 0)
        {
            return BadRequest(new { message = "Sorry, all copies of this book are currently on loan." });
        }

        var user = await _context.Users.FindAsync(dto.UserId);
        if (user == null || !user.IsActive)
        {
            return BadRequest(new { message = "User not found or is currently inactive." });
        }

        // Check if user already has an active copy of this book
        var existingLoan = await _context.BorrowRecords
            .AnyAsync(r => r.BookId == dto.BookId && r.UserId == dto.UserId && (r.Status == "Active" || r.Status == "Overdue"));
        
        if (existingLoan)
        {
            return BadRequest(new { message = "Member already has an active borrow record for this book." });
        }

        // Decrement available copies
        book.AvailableCopies--;

        var days = dto.DueDays > 0 && dto.DueDays <= 60 ? dto.DueDays : 14;
        var record = new BorrowRecord
        {
            BookId = dto.BookId,
            UserId = dto.UserId,
            BorrowDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(days),
            Status = "Active",
            FineAmount = 0.0m,
            FinePaid = true,
            Notes = dto.Notes
        };

        await _context.BorrowRecords.AddAsync(record);
        await _context.SaveChangesAsync();

        await _logService.LogAsync("BOOK_BORROWED", $"User '{user.FullName}' borrowed '{book.Title}' (Due: {record.DueDate:yyyy-MM-dd}).", user.Id);

        return Ok(new BorrowRecordDto
        {
            Id = record.Id,
            BookId = book.Id,
            BookTitle = book.Title,
            BookIsbn = book.ISBN,
            BookCoverUrl = book.CoverImageUrl,
            UserId = user.Id,
            UserName = user.FullName,
            UserEmail = user.Email,
            MembershipCardNumber = user.MembershipCardNumber,
            BorrowDate = record.BorrowDate,
            DueDate = record.DueDate,
            ReturnDate = record.ReturnDate,
            Status = record.Status,
            FineAmount = record.FineAmount,
            FinePaid = record.FinePaid,
            Notes = record.Notes
        });
    }

    [HttpPost("return")]
    [Authorize(Roles = "Admin,Librarian")]
    public async Task<ActionResult<BorrowRecordDto>> ReturnBook([FromBody] ReturnRequestDto dto)
    {
        var record = await _context.BorrowRecords
            .Include(r => r.Book)
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == dto.BorrowRecordId);

        if (record == null)
        {
            return NotFound(new { message = "Borrow record not found." });
        }

        if (record.Status == "Returned")
        {
            return BadRequest(new { message = "This book has already been marked as returned." });
        }

        record.ReturnDate = DateTime.UtcNow;
        record.Status = "Returned";
        if (!string.IsNullOrWhiteSpace(dto.Notes))
        {
            record.Notes = (record.Notes + " | Return: " + dto.Notes).Trim();
        }

        // Calculate fine if returned late
        if (record.ReturnDate > record.DueDate)
        {
            var overdueDays = (int)Math.Ceiling((record.ReturnDate.Value - record.DueDate).TotalDays);
            if (overdueDays > 0)
            {
                record.FineAmount = overdueDays * DailyFineRate;
                record.FinePaid = false;
            }
        }

        // Increment available copy
        if (record.Book != null)
        {
            record.Book.AvailableCopies = Math.Min(record.Book.TotalCopies, record.Book.AvailableCopies + 1);
        }

        await _context.SaveChangesAsync();

        await _logService.LogAsync("BOOK_RETURNED", $"Book '{record.Book?.Title}' returned by '{record.User?.FullName}'. Fine: ${record.FineAmount:F2}.", record.UserId);

        return Ok(new BorrowRecordDto
        {
            Id = record.Id,
            BookId = record.BookId,
            BookTitle = record.Book?.Title ?? string.Empty,
            BookIsbn = record.Book?.ISBN ?? string.Empty,
            BookCoverUrl = record.Book?.CoverImageUrl,
            UserId = record.UserId,
            UserName = record.User?.FullName ?? string.Empty,
            UserEmail = record.User?.Email ?? string.Empty,
            MembershipCardNumber = record.User?.MembershipCardNumber ?? string.Empty,
            BorrowDate = record.BorrowDate,
            DueDate = record.DueDate,
            ReturnDate = record.ReturnDate,
            Status = record.Status,
            FineAmount = record.FineAmount,
            FinePaid = record.FinePaid,
            Notes = record.Notes
        });
    }

    [HttpPost("pay-fine")]
    [Authorize]
    public async Task<IActionResult> PayFine([FromBody] PayFineDto dto)
    {
        var record = await _context.BorrowRecords.FindAsync(dto.BorrowRecordId);
        if (record == null)
        {
            return NotFound(new { message = "Borrow record not found." });
        }

        if (record.FineAmount <= 0 || record.FinePaid)
        {
            return BadRequest(new { message = "There is no outstanding fine on this record." });
        }

        record.FinePaid = true;
        await _context.SaveChangesAsync();

        await _logService.LogAsync("FINE_PAID", $"Fine of ${record.FineAmount:F2} paid for Borrow Record #{record.Id}.", record.UserId);

        return Ok(new { message = "Fine paid successfully.", amountPaid = record.FineAmount });
    }
}
