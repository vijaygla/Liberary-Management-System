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
public class ReservationsController : ControllerBase
{
    private readonly LibraryDbContext _context;
    private readonly IActivityLogService _logService;

    public ReservationsController(LibraryDbContext context, IActivityLogService logService)
    {
        _context = context;
        _logService = logService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Librarian")]
    public async Task<ActionResult<IEnumerable<ReservationDto>>> GetAllReservations()
    {
        var reservations = await _context.Reservations
            .Include(r => r.Book)
            .Include(r => r.User)
            .AsNoTracking()
            .OrderByDescending(r => r.ReservationDate)
            .Select(r => new ReservationDto
            {
                Id = r.Id,
                BookId = r.BookId,
                BookTitle = r.Book != null ? r.Book.Title : string.Empty,
                BookIsbn = r.Book != null ? r.Book.ISBN : string.Empty,
                BookCoverUrl = r.Book != null ? r.Book.CoverImageUrl : null,
                UserId = r.UserId,
                UserName = r.User != null ? r.User.FullName : string.Empty,
                UserEmail = r.User != null ? r.User.Email : string.Empty,
                ReservationDate = r.ReservationDate,
                Status = r.Status,
                Notes = r.Notes
            })
            .ToListAsync();

        return Ok(reservations);
    }

    [HttpGet("my-reservations")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<ReservationDto>>> GetMyReservations()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var reservations = await _context.Reservations
            .Include(r => r.Book)
            .Include(r => r.User)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.ReservationDate)
            .Select(r => new ReservationDto
            {
                Id = r.Id,
                BookId = r.BookId,
                BookTitle = r.Book != null ? r.Book.Title : string.Empty,
                BookIsbn = r.Book != null ? r.Book.ISBN : string.Empty,
                BookCoverUrl = r.Book != null ? r.Book.CoverImageUrl : null,
                UserId = r.UserId,
                UserName = r.User != null ? r.User.FullName : string.Empty,
                UserEmail = r.User != null ? r.User.Email : string.Empty,
                ReservationDate = r.ReservationDate,
                Status = r.Status,
                Notes = r.Notes
            })
            .ToListAsync();

        return Ok(reservations);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ReservationDto>> CreateReservation([FromBody] CreateReservationDto dto)
    {
        var book = await _context.Books.FindAsync(dto.BookId);
        if (book == null)
        {
            return NotFound(new { message = "Book not found." });
        }

        var user = await _context.Users.FindAsync(dto.UserId);
        if (user == null || !user.IsActive)
        {
            return BadRequest(new { message = "User is invalid or inactive." });
        }

        var existingPending = await _context.Reservations
            .AnyAsync(r => r.BookId == dto.BookId && r.UserId == dto.UserId && r.Status == "Pending");
        if (existingPending)
        {
            return BadRequest(new { message = "You already have a pending reservation for this book." });
        }

        var reservation = new Reservation
        {
            BookId = dto.BookId,
            UserId = dto.UserId,
            ReservationDate = DateTime.UtcNow,
            Status = "Pending",
            Notes = dto.Notes
        };

        await _context.Reservations.AddAsync(reservation);
        await _context.SaveChangesAsync();

        await _logService.LogAsync("BOOK_RESERVED", $"User '{user.FullName}' reserved '{book.Title}'.", user.Id);

        return Ok(new ReservationDto
        {
            Id = reservation.Id,
            BookId = book.Id,
            BookTitle = book.Title,
            BookIsbn = book.ISBN,
            BookCoverUrl = book.CoverImageUrl,
            UserId = user.Id,
            UserName = user.FullName,
            UserEmail = user.Email,
            ReservationDate = reservation.ReservationDate,
            Status = reservation.Status,
            Notes = reservation.Notes
        });
    }

    [HttpPut("{id}/cancel")]
    [Authorize]
    public async Task<IActionResult> CancelReservation(int id)
    {
        var reservation = await _context.Reservations.FindAsync(id);
        if (reservation == null)
        {
            return NotFound(new { message = "Reservation not found." });
        }

        reservation.Status = "Cancelled";
        await _context.SaveChangesAsync();

        await _logService.LogAsync("RESERVATION_CANCELLED", $"Reservation #{id} cancelled.", reservation.UserId);

        return Ok(new { message = "Reservation cancelled." });
    }

    [HttpPut("{id}/fulfill")]
    [Authorize(Roles = "Admin,Librarian")]
    public async Task<IActionResult> FulfillReservation(int id)
    {
        var reservation = await _context.Reservations.FindAsync(id);
        if (reservation == null)
        {
            return NotFound(new { message = "Reservation not found." });
        }

        reservation.Status = "Fulfilled";
        await _context.SaveChangesAsync();

        await _logService.LogAsync("RESERVATION_FULFILLED", $"Reservation #{id} fulfilled.", reservation.UserId);

        return Ok(new { message = "Reservation fulfilled." });
    }
}
