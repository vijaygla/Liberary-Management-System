using System.Globalization;
using LibraryManagementSystem.Api.Data;
using LibraryManagementSystem.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagementSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly LibraryDbContext _context;

    public DashboardController(LibraryDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        var totalBooks = await _context.Books.CountAsync();
        var totalCopies = await _context.Books.SumAsync(b => b.TotalCopies);
        var availableCopies = await _context.Books.SumAsync(b => b.AvailableCopies);
        var borrowedCopies = totalCopies - availableCopies;

        var activeLoans = await _context.BorrowRecords.CountAsync(r => r.Status == "Active");
        var overdueLoans = await _context.BorrowRecords.CountAsync(r => r.Status == "Overdue" || (r.Status == "Active" && r.DueDate < DateTime.UtcNow));
        var activeMembers = await _context.Users.CountAsync(u => u.IsActive && u.Role == "Member");
        var pendingReservations = await _context.Reservations.CountAsync(r => r.Status == "Pending");
        
        var totalPendingFines = await _context.BorrowRecords
            .Where(r => !r.FinePaid && r.FineAmount > 0)
            .SumAsync(r => r.FineAmount);

        var recentBorrows = await _context.BorrowRecords
            .Include(r => r.Book)
            .Include(r => r.User)
            .OrderByDescending(r => r.BorrowDate)
            .Take(8)
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

        var categoryDistribution = await _context.Categories
            .Include(c => c.Books)
            .Select(c => new CategoryCountDto
            {
                CategoryName = c.Name,
                BookCount = c.Books.Count
            })
            .OrderByDescending(c => c.BookCount)
            .ToListAsync();

        // Monthly borrow trends (last 6 months)
        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-5);
        var monthlyData = await _context.BorrowRecords
            .Where(r => r.BorrowDate >= sixMonthsAgo)
            .GroupBy(r => new { r.BorrowDate.Year, r.BorrowDate.Month })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                Count = g.Count()
            })
            .ToListAsync();

        var trends = new List<MonthlyBorrowDto>();
        for (int i = 5; i >= 0; i--)
        {
            var date = DateTime.UtcNow.AddMonths(-i);
            var match = monthlyData.FirstOrDefault(m => m.Year == date.Year && m.Month == date.Month);
            trends.Add(new MonthlyBorrowDto
            {
                Month = date.ToString("MMM yyyy", CultureInfo.InvariantCulture),
                Count = match?.Count ?? 0
            });
        }

        return Ok(new DashboardStatsDto
        {
            TotalBooks = totalBooks,
            TotalCopies = totalCopies,
            AvailableCopies = availableCopies,
            BorrowedCopies = borrowedCopies,
            ActiveLoansCount = activeLoans,
            OverdueLoansCount = overdueLoans,
            ActiveMembersCount = activeMembers,
            PendingReservationsCount = pendingReservations,
            TotalPendingFines = totalPendingFines,
            RecentBorrows = recentBorrows,
            CategoryDistribution = categoryDistribution,
            MonthlyBorrowTrends = trends
        });
    }
}
