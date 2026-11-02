using LibraryManagementSystem.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagementSystem.Api.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(LibraryDbContext context)
    {
        // Apply migrations automatically if any are pending
        await context.Database.MigrateAsync();

        // Check if data already exists
        if (await context.Users.AnyAsync())
        {
            return; // DB has been seeded
        }

        // 1. Seed Categories
        var categories = new List<Category>
        {
            new() { Name = "Computer Science & Software", Description = "Programming, algorithms, system architecture, and DevOps." },
            new() { Name = "Artificial Intelligence & Data", Description = "Machine learning, neural networks, and data engineering." },
            new() { Name = "Literature & Fiction", Description = "Classic and contemporary world literature." },
            new() { Name = "Science & Mathematics", Description = "Theoretical physics, astronomy, and mathematics." },
            new() { Name = "Philosophy & Psychology", Description = "Cognitive psychology, ethics, and epistemology." },
            new() { Name = "Business & Leadership", Description = "Management, startups, and economic strategy." }
        };
        await context.Categories.AddRangeAsync(categories);
        await context.SaveChangesAsync();

        // 2. Seed Authors
        var authors = new List<Author>
        {
            new() { Name = "Robert C. Martin", Biography = "Uncle Bob is an American software engineer and author of Clean Code and Clean Architecture.", Nationality = "American" },
            new() { Name = "Martin Fowler", Biography = "British author and speaker on software development, specializing in object-oriented analysis and refactoring.", Nationality = "British" },
            new() { Name = "Andrew Ng", Biography = "AI pioneer, adjunct professor at Stanford, and founder of DeepLearning.AI.", Nationality = "American" },
            new() { Name = "Yuval Noah Harari", Biography = "Historian, philosopher, and bestselling author of Sapiens and Homo Deus.", Nationality = "Israeli" },
            new() { Name = "Eric Evans", Biography = "Domain-driven design pioneer and software designer.", Nationality = "American" },
            new() { Name = "Douglas Adams", Biography = "Author of The Hitchhiker's Guide to the Galaxy comedy science-fiction series.", Nationality = "British" }
        };
        await context.Authors.AddRangeAsync(authors);
        await context.SaveChangesAsync();

        // 3. Seed Publishers
        var publishers = new List<Publisher>
        {
            new() { Name = "O'Reilly Media", ContactEmail = "info@oreilly.com", Address = "Sebastopol, CA, USA" },
            new() { Name = "Addison-Wesley Professional", ContactEmail = "contact@pearson.com", Address = "Boston, MA, USA" },
            new() { Name = "MIT Press", ContactEmail = "books@mit.edu", Address = "Cambridge, MA, USA" },
            new() { Name = "Harper & Brothers", ContactEmail = "support@harpercollins.com", Address = "New York, NY, USA" }
        };
        await context.Publishers.AddRangeAsync(publishers);
        await context.SaveChangesAsync();

        // 4. Seed Users
        var adminPassword = BCrypt.Net.BCrypt.HashPassword("Admin@123");
        var librarianPassword = BCrypt.Net.BCrypt.HashPassword("Librarian@123");
        var memberPassword = BCrypt.Net.BCrypt.HashPassword("Member@123");

        var adminUser = new User
        {
            FullName = "Library Administrator",
            Email = "admin@library.com",
            PasswordHash = adminPassword,
            Role = "Admin",
            PhoneNumber = "+1 (555) 019-2831",
            Address = "100 Innovation Way, Suite 400",
            MembershipCardNumber = "LIB-ADMIN-001",
            MembershipDate = DateTime.UtcNow.AddMonths(-12),
            IsActive = true
        };

        var librarianUser = new User
        {
            FullName = "Sarah Jenkins",
            Email = "librarian@library.com",
            PasswordHash = librarianPassword,
            Role = "Librarian",
            PhoneNumber = "+1 (555) 018-7744",
            Address = "45 Reading Avenue",
            MembershipCardNumber = "LIB-STAFF-002",
            MembershipDate = DateTime.UtcNow.AddMonths(-8),
            IsActive = true
        };

        var memberUser = new User
        {
            FullName = "Alexander Wright",
            Email = "member@library.com",
            PasswordHash = memberPassword,
            Role = "Member",
            PhoneNumber = "+1 (555) 014-9922",
            Address = "742 Evergreen Terrace",
            MembershipCardNumber = "LIB-MEM-1001",
            MembershipDate = DateTime.UtcNow.AddMonths(-3),
            IsActive = true
        };

        var memberUser2 = new User
        {
            FullName = "Elena Rostova",
            Email = "elena@library.com",
            PasswordHash = memberPassword,
            Role = "Member",
            PhoneNumber = "+1 (555) 012-3344",
            Address = "12 Harbor View Road",
            MembershipCardNumber = "LIB-MEM-1002",
            MembershipDate = DateTime.UtcNow.AddMonths(-2),
            IsActive = true
        };

        await context.Users.AddRangeAsync(adminUser, librarianUser, memberUser, memberUser2);
        await context.SaveChangesAsync();

        // 5. Seed Books
        var csCategory = categories.First(c => c.Name.Contains("Computer Science"));
        var aiCategory = categories.First(c => c.Name.Contains("Artificial"));
        var litCategory = categories.First(c => c.Name.Contains("Literature"));
        var philCategory = categories.First(c => c.Name.Contains("Philosophy"));

        var uncleBob = authors.First(a => a.Name.Contains("Robert C. Martin"));
        var fowler = authors.First(a => a.Name.Contains("Martin Fowler"));
        var ng = authors.First(a => a.Name.Contains("Andrew Ng"));
        var harari = authors.First(a => a.Name.Contains("Yuval Noah"));
        var evans = authors.First(a => a.Name.Contains("Eric Evans"));
        var adams = authors.First(a => a.Name.Contains("Douglas Adams"));

        var oreilly = publishers.First(p => p.Name.Contains("O'Reilly"));
        var addison = publishers.First(p => p.Name.Contains("Addison"));
        var harper = publishers.First(p => p.Name.Contains("Harper"));

        var books = new List<Book>
        {
            new()
            {
                Title = "Clean Code: A Handbook of Agile Software Craftsmanship",
                ISBN = "978-0132350884",
                Description = "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Uncle Bob presents a revolutionary paradigm with best engineering practices.",
                AuthorId = uncleBob.Id,
                CategoryId = csCategory.Id,
                PublisherId = addison.Id,
                PublishedYear = 2008,
                Edition = "1st Edition",
                ShelfLocation = "Stack A-14, Tier 2",
                CoverImageUrl = "https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=500&auto=format&fit=crop&q=60",
                TotalCopies = 5,
                AvailableCopies = 4
            },
            new()
            {
                Title = "Clean Architecture: A Craftsman's Guide to Software Structure",
                ISBN = "978-0134494166",
                Description = "Building upon the principles of clean code, Uncle Bob Martin teaches how to design software architectures that withstand the test of time.",
                AuthorId = uncleBob.Id,
                CategoryId = csCategory.Id,
                PublisherId = addison.Id,
                PublishedYear = 2017,
                Edition = "1st Edition",
                ShelfLocation = "Stack A-14, Tier 3",
                CoverImageUrl = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60",
                TotalCopies = 4,
                AvailableCopies = 3
            },
            new()
            {
                Title = "Refactoring: Improving the Design of Existing Code",
                ISBN = "978-0134757599",
                Description = "Refactoring is a controlled technique for improving the design of an existing code base. Martin Fowler breaks down canonical refactorings with step-by-step guidance.",
                AuthorId = fowler.Id,
                CategoryId = csCategory.Id,
                PublisherId = addison.Id,
                PublishedYear = 2018,
                Edition = "2nd Edition",
                ShelfLocation = "Stack A-15, Tier 1",
                CoverImageUrl = "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=60",
                TotalCopies = 3,
                AvailableCopies = 3
            },
            new()
            {
                Title = "Domain-Driven Design: Tackling Complexity in the Heart of Software",
                ISBN = "978-0321125217",
                Description = "The seminal text establishing DDD principles, ubiquitous language, bounded contexts, aggregates, and strategic design.",
                AuthorId = evans.Id,
                CategoryId = csCategory.Id,
                PublisherId = addison.Id,
                PublishedYear = 2003,
                Edition = "1st Edition",
                ShelfLocation = "Stack A-16, Tier 4",
                CoverImageUrl = "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=60",
                TotalCopies = 4,
                AvailableCopies = 4
            },
            new()
            {
                Title = "Machine Learning Yearning: Strategies for AI Systems",
                ISBN = "978-0999738405",
                Description = "Practical AI engineering heuristics from Andrew Ng on diagnosing errors in ML systems, setting up dev/test sets, and prioritizing engineering effort.",
                AuthorId = ng.Id,
                CategoryId = aiCategory.Id,
                PublisherId = oreilly.Id,
                PublishedYear = 2019,
                Edition = "Draft Release",
                ShelfLocation = "Stack B-02, Tier 1",
                CoverImageUrl = "https://images.unsplash.com/photo-1507842229451-7f01be8ac825?w=500&auto=format&fit=crop&q=60",
                TotalCopies = 6,
                AvailableCopies = 5
            },
            new()
            {
                Title = "Sapiens: A Brief History of Humankind",
                ISBN = "978-0062316097",
                Description = "100,000 years ago, at least six human species inhabited the earth. Today there is just one: us. How did our species succeed in the battle for dominance?",
                AuthorId = harari.Id,
                CategoryId = philCategory.Id,
                PublisherId = harper.Id,
                PublishedYear = 2014,
                Edition = "Illustrated Edition",
                ShelfLocation = "Stack C-05, Tier 3",
                CoverImageUrl = "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500&auto=format&fit=crop&q=60",
                TotalCopies = 5,
                AvailableCopies = 4
            },
            new()
            {
                Title = "The Hitchhiker's Guide to the Galaxy",
                ISBN = "978-0345391803",
                Description = "Seconds before Earth is demolished to make way for a galactic freeway, Arthur Dent is plucked off the planet by his friend Ford Prefect.",
                AuthorId = adams.Id,
                CategoryId = litCategory.Id,
                PublisherId = harper.Id,
                PublishedYear = 1979,
                Edition = "Collector's Classic",
                ShelfLocation = "Stack D-01, Tier 2",
                CoverImageUrl = "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=500&auto=format&fit=crop&q=60",
                TotalCopies = 4,
                AvailableCopies = 4
            }
        };
        await context.Books.AddRangeAsync(books);
        await context.SaveChangesAsync();

        // 6. Seed Borrow Records
        var activeBorrow = new BorrowRecord
        {
            BookId = books[0].Id, // Clean Code
            UserId = memberUser.Id,
            BorrowDate = DateTime.UtcNow.AddDays(-5),
            DueDate = DateTime.UtcNow.AddDays(9),
            Status = "Active",
            FineAmount = 0.0m,
            FinePaid = true,
            Notes = "First checkout of semester."
        };

        var returnedBorrow = new BorrowRecord
        {
            BookId = books[1].Id, // Clean Architecture
            UserId = memberUser.Id,
            BorrowDate = DateTime.UtcNow.AddDays(-30),
            DueDate = DateTime.UtcNow.AddDays(-16),
            ReturnDate = DateTime.UtcNow.AddDays(-15),
            Status = "Returned",
            FineAmount = 0.0m,
            FinePaid = true,
            Notes = "Returned in mint condition."
        };

        var overdueBorrow = new BorrowRecord
        {
            BookId = books[4].Id, // Machine Learning Yearning
            UserId = memberUser2.Id,
            BorrowDate = DateTime.UtcNow.AddDays(-25),
            DueDate = DateTime.UtcNow.AddDays(-11),
            ReturnDate = null,
            Status = "Overdue",
            FineAmount = 11.0m, // $1.00 per overdue day
            FinePaid = false,
            Notes = "Late notice sent via email."
        };

        await context.BorrowRecords.AddRangeAsync(activeBorrow, returnedBorrow, overdueBorrow);

        // 7. Seed Reservation
        var reservation = new Reservation
        {
            BookId = books[1].Id,
            UserId = memberUser2.Id,
            ReservationDate = DateTime.UtcNow.AddDays(-1),
            Status = "Pending",
            Notes = "Member notified when available."
        };
        await context.Reservations.AddAsync(reservation);

        // 8. Seed Activity Log
        var logs = new List<ActivityLog>
        {
            new() { UserId = adminUser.Id, Action = "SYSTEM_INITIALIZED", Details = "Library database schema and seed catalog populated.", Timestamp = DateTime.UtcNow.AddDays(-30) },
            new() { UserId = memberUser.Id, Action = "BOOK_BORROWED", Details = $"Borrowed '{books[0].Title}'", Timestamp = DateTime.UtcNow.AddDays(-5) },
            new() { UserId = memberUser2.Id, Action = "BOOK_BORROWED", Details = $"Borrowed '{books[4].Title}'", Timestamp = DateTime.UtcNow.AddDays(-25) },
            new() { UserId = memberUser2.Id, Action = "BOOK_RESERVED", Details = $"Reserved '{books[1].Title}'", Timestamp = DateTime.UtcNow.AddDays(-1) }
        };
        await context.ActivityLogs.AddRangeAsync(logs);

        await context.SaveChangesAsync();
    }
}
