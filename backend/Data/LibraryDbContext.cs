using LibraryManagementSystem.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagementSystem.Api.Data;

public class LibraryDbContext : DbContext
{
    public LibraryDbContext(DbContextOptions<LibraryDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Author> Authors => Set<Author>();
    public DbSet<Publisher> Publishers => Set<Publisher>();
    public DbSet<Book> Books => Set<Book>();
    public DbSet<BorrowRecord> BorrowRecords => Set<BorrowRecord>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User Configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.MembershipCardNumber).IsUnique();
            entity.Property(u => u.FullName).HasMaxLength(150).IsRequired();
            entity.Property(u => u.Email).HasMaxLength(150).IsRequired();
            entity.Property(u => u.Role).HasMaxLength(50).HasDefaultValue("Member");
            entity.Property(u => u.MembershipCardNumber).HasMaxLength(50).IsRequired();
        });

        // Book Configuration
        modelBuilder.Entity<Book>(entity =>
        {
            entity.HasIndex(b => b.ISBN).IsUnique();
            entity.Property(b => b.Title).HasMaxLength(250).IsRequired();
            entity.Property(b => b.ISBN).HasMaxLength(50).IsRequired();
            entity.Property(b => b.ShelfLocation).HasMaxLength(100).HasDefaultValue("General Stacks");

            entity.HasOne(b => b.Author)
                  .WithMany(a => a.Books)
                  .HasForeignKey(b => b.AuthorId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(b => b.Category)
                  .WithMany(c => c.Books)
                  .HasForeignKey(b => b.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(b => b.Publisher)
                  .WithMany(p => p.Books)
                  .HasForeignKey(b => b.PublisherId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // BorrowRecord Configuration
        modelBuilder.Entity<BorrowRecord>(entity =>
        {
            entity.Property(r => r.FineAmount).HasColumnType("decimal(18,2)");
            entity.Property(r => r.Status).HasMaxLength(50).HasDefaultValue("Active");

            entity.HasOne(r => r.Book)
                  .WithMany(b => b.BorrowRecords)
                  .HasForeignKey(r => r.BookId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.User)
                  .WithMany(u => u.BorrowRecords)
                  .HasForeignKey(r => r.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Reservation Configuration
        modelBuilder.Entity<Reservation>(entity =>
        {
            entity.Property(res => res.Status).HasMaxLength(50).HasDefaultValue("Pending");

            entity.HasOne(res => res.Book)
                  .WithMany(b => b.Reservations)
                  .HasForeignKey(res => res.BookId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(res => res.User)
                  .WithMany(u => u.Reservations)
                  .HasForeignKey(res => res.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Category Configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasIndex(c => c.Name).IsUnique();
            entity.Property(c => c.Name).HasMaxLength(100).IsRequired();
        });

        // Author Configuration
        modelBuilder.Entity<Author>(entity =>
        {
            entity.Property(a => a.Name).HasMaxLength(150).IsRequired();
        });

        // Publisher Configuration
        modelBuilder.Entity<Publisher>(entity =>
        {
            entity.Property(p => p.Name).HasMaxLength(150).IsRequired();
        });

        // ActivityLog Configuration
        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.Property(a => a.Action).HasMaxLength(100).IsRequired();
            entity.Property(a => a.Details).HasMaxLength(500);
        });
    }
}
