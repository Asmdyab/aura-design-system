using System.Text.Json;
using Academy.Agent.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Academy.Agent.Infrastructure.Persistence;

public sealed class AcademyDbContext : DbContext
{
    public DbSet<AcademyProgram> Programs => Set<AcademyProgram>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<PaymentProof> PaymentProofs => Set<PaymentProof>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<AdminNotification> AdminNotifications => Set<AdminNotification>();

    public AcademyDbContext(DbContextOptions<AcademyDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var featuresConverter = new ValueConverter<List<string>, string>(
            v => JsonSerializer.Serialize(v, JsonOptions),
            v => JsonSerializer.Deserialize<List<string>>(v, JsonOptions) ?? new List<string>());

        modelBuilder.Entity<AcademyProgram>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Name).HasMaxLength(200).IsRequired();
            e.Property(p => p.Category).HasMaxLength(150).IsRequired();
            e.Property(p => p.Notes).HasMaxLength(300);
            e.Property(p => p.Price).HasPrecision(18, 2);
            e.Property(p => p.Period).HasMaxLength(50).IsRequired();
            e.Property(p => p.Features).HasConversion(featuresConverter).HasColumnType("nvarchar(max)");
            e.Property(p => p.Description).HasColumnType("nvarchar(max)");

            e.HasData(SeedPrograms());
        });

        modelBuilder.Entity<Reservation>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.FullName).HasMaxLength(200).IsRequired();
            e.Property(r => r.WhatsappPhone).HasMaxLength(20).IsRequired();
            e.Property(r => r.ReferenceNumber).HasMaxLength(20);
            e.Property(r => r.PreferredSchedule).HasMaxLength(300);
            e.Property(r => r.Notes).HasColumnType("nvarchar(max)");
            e.HasIndex(r => r.ReferenceNumber).IsUnique().HasFilter("[ReferenceNumber] IS NOT NULL");

            e.HasOne(r => r.Program).WithMany().HasForeignKey(r => r.ProgramId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(r => r.PaymentProofs).WithOne(p => p.Reservation).HasForeignKey(p => p.ReservationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PaymentProof>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Method).HasConversion<int>();
            e.Property(p => p.Amount).HasPrecision(18, 2);
            e.Property(p => p.ProofUrl).HasMaxLength(1000);
            e.Property(p => p.TxnRef).HasMaxLength(200);
            e.Property(p => p.Status).HasConversion<int>();
        });

        modelBuilder.Entity<Conversation>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.ExternalUserId).HasMaxLength(100).IsRequired();
            e.Property(c => c.Channel).HasConversion<int>();
            e.Property(c => c.State).HasConversion<int>();
            e.Property(c => c.RegistrationDraftJson).HasColumnType("nvarchar(max)");
            e.HasIndex(c => new { c.Channel, c.ExternalUserId }).IsUnique();

            e.HasMany(c => c.Messages).WithOne(m => m.Conversation).HasForeignKey(m => m.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChatMessage>(e =>
        {
            e.HasKey(m => m.Id);
            e.Property(m => m.Role).HasMaxLength(20).IsRequired();
            e.Property(m => m.Content).HasColumnType("nvarchar(max)");
            e.HasIndex(m => new { m.ConversationId, m.CreatedAt });
        });

        modelBuilder.Entity<AdminNotification>(e =>
        {
            e.HasKey(n => n.Id);
            e.Property(n => n.Type).HasMaxLength(50).IsRequired();
            e.Property(n => n.Message).HasColumnType("nvarchar(max)");
        });
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private static AcademyProgram[] SeedPrograms()
    {
        var id = 0;
        AcademyProgram P(string category, string name, decimal price, string period, string[] features, string? notes = null) => new()
        {
            Id = ++id,
            Category = category,
            Name = name,
            Price = price,
            Period = period,
            Features = features.ToList(),
            Notes = notes,
            IsActive = true,
        };

        return new[]
        {
            P("باقات الحصص", "باقة حصتين", 350, "شهرياً", new[] { "حصتان أسبوعياً", "متابعة وتقييم مستمر" }, "مصر"),
            P("باقات الحصص", "باقة 3 حصص", 600, "شهرياً", new[] { "3 حصص أسبوعياً", "متابعة وتقييم مستمر" }, "مصر"),
            P("باقات الحصص", "باقة 4 حصص", 800, "شهرياً", new[] { "4 حصص أسبوعياً", "متابعة وتقييم مستمر" }, "مصر"),
            P("باقة العائلة", "3 أفراد", 1100, "شهرياً", new[] { "3 أفراد في الباقة" }, "بلانر العائلة"),
            P("باقة العائلة", "4 أفراد", 1350, "شهرياً", new[] { "4 أفراد في الباقة" }, "بلانر العائلة"),
            P("باقة العائلة", "5 أفراد", 1700, "شهرياً", new[] { "5 أفراد في الباقة" }, "بلانر العائلة"),
            P("مرحلة التصحيح", "تصحيح حصتين أسبوعياً", 500, "شهرياً", new[] { "حصتان في الأسبوع" }),
            P("مرحلة التصحيح", "تصحيح 3 حصص أسبوعياً", 1000, "شهرياً", new[] { "3 حصص في الأسبوع" }),
            P("مرحلة ما قبل الإجازة", "ما قبل الإجازة", 800, "شهرياً", new[] { "حصتان في الأسبوع", "مدة الحصة ساعة" }),
            P("مرحلة الإجازة", "الإجازة", 700, "شهرياً", new[] { "حفظ وإجازة القرآن" }),
            P("مرحلة الإجازة", "طباعة الإجازة", 3000, "مرة واحدة", new[] { "طباعة الإجازة", "الشحن شامل" }),
            P("تعليم القراءة للصغار", "حصتان", 350, "شهرياً", new[] { "مدة الحصة 40 دقيقة" }),
            P("تعليم القراءة للصغار", "3 حصص", 470, "شهرياً", new[] { "مدة الحصة 40 دقيقة" }),
            P("شرح أحاديث وتربية وتقوية التخاطب وتعديل اللثغة", "برنامج متكامل", 880, "شهرياً", new[] { "يومان أسبوعياً", "مدة الحصة 45 دقيقة" }),
        };
    }
}
