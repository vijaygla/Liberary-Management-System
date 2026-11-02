using System.ComponentModel.DataAnnotations;

namespace LibraryManagementSystem.Api.DTOs;

public class BorrowRequestDto
{
    [Required]
    public int BookId { get; set; }

    [Required]
    public int UserId { get; set; }

    public int DueDays { get; set; } = 14;
    public string? Notes { get; set; }
}

public class ReturnRequestDto
{
    [Required]
    public int BorrowRecordId { get; set; }
    public string? Notes { get; set; }
}

public class PayFineDto
{
    [Required]
    public int BorrowRecordId { get; set; }
}

public class BorrowRecordDto
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public string BookTitle { get; set; } = string.Empty;
    public string BookIsbn { get; set; } = string.Empty;
    public string? BookCoverUrl { get; set; }
    
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string MembershipCardNumber { get; set; } = string.Empty;

    public DateTime BorrowDate { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? ReturnDate { get; set; }

    public string Status { get; set; } = string.Empty;
    public decimal FineAmount { get; set; }
    public bool FinePaid { get; set; }
    public string? Notes { get; set; }
}

public class CreateReservationDto
{
    [Required]
    public int BookId { get; set; }

    [Required]
    public int UserId { get; set; }

    public string? Notes { get; set; }
}

public class ReservationDto
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public string BookTitle { get; set; } = string.Empty;
    public string BookIsbn { get; set; } = string.Empty;
    public string? BookCoverUrl { get; set; }
    
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;

    public DateTime ReservationDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class CategoryCountDto
{
    public string CategoryName { get; set; } = string.Empty;
    public int BookCount { get; set; }
}

public class MonthlyBorrowDto
{
    public string Month { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class DashboardStatsDto
{
    public int TotalBooks { get; set; }
    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }
    public int BorrowedCopies { get; set; }
    public int ActiveLoansCount { get; set; }
    public int OverdueLoansCount { get; set; }
    public int ActiveMembersCount { get; set; }
    public int PendingReservationsCount { get; set; }
    public decimal TotalPendingFines { get; set; }
    public List<BorrowRecordDto> RecentBorrows { get; set; } = new();
    public List<CategoryCountDto> CategoryDistribution { get; set; } = new();
    public List<MonthlyBorrowDto> MonthlyBorrowTrends { get; set; } = new();
}
