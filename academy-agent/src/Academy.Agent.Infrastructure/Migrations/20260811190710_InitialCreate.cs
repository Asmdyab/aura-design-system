using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Academy.Agent.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AdminNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReservationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Delivered = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminNotifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Conversations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Channel = table.Column<int>(type: "int", nullable: false),
                    ExternalUserId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    State = table.Column<int>(type: "int", nullable: false),
                    RegistrationDraftJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Conversations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Programs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Period = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Features = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Programs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChatMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatMessages_Conversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "Conversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reservations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    WhatsappPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ProgramId = table.Column<int>(type: "int", nullable: true),
                    PreferredSchedule = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PayNow = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ReferenceNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reservations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reservations_Programs_ProgramId",
                        column: x => x.ProgramId,
                        principalTable: "Programs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PaymentProofs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReservationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Method = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    ProofUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    TxnRef = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentProofs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentProofs_Reservations_ReservationId",
                        column: x => x.ReservationId,
                        principalTable: "Reservations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Programs",
                columns: new[] { "Id", "Category", "Description", "Features", "IsActive", "Name", "Notes", "Period", "Price" },
                values: new object[,]
                {
                    { 1, "باقات الحصص", null, "[\"\\u062D\\u0635\\u062A\\u0627\\u0646 \\u0623\\u0633\\u0628\\u0648\\u0639\\u064A\\u0627\\u064B\",\"\\u0645\\u062A\\u0627\\u0628\\u0639\\u0629 \\u0648\\u062A\\u0642\\u064A\\u064A\\u0645 \\u0645\\u0633\\u062A\\u0645\\u0631\"]", true, "باقة حصتين", "مصر", "شهرياً", 350m },
                    { 2, "باقات الحصص", null, "[\"3 \\u062D\\u0635\\u0635 \\u0623\\u0633\\u0628\\u0648\\u0639\\u064A\\u0627\\u064B\",\"\\u0645\\u062A\\u0627\\u0628\\u0639\\u0629 \\u0648\\u062A\\u0642\\u064A\\u064A\\u0645 \\u0645\\u0633\\u062A\\u0645\\u0631\"]", true, "باقة 3 حصص", "مصر", "شهرياً", 600m },
                    { 3, "باقات الحصص", null, "[\"4 \\u062D\\u0635\\u0635 \\u0623\\u0633\\u0628\\u0648\\u0639\\u064A\\u0627\\u064B\",\"\\u0645\\u062A\\u0627\\u0628\\u0639\\u0629 \\u0648\\u062A\\u0642\\u064A\\u064A\\u0645 \\u0645\\u0633\\u062A\\u0645\\u0631\"]", true, "باقة 4 حصص", "مصر", "شهرياً", 800m },
                    { 4, "باقة العائلة", null, "[\"3 \\u0623\\u0641\\u0631\\u0627\\u062F \\u0641\\u064A \\u0627\\u0644\\u0628\\u0627\\u0642\\u0629\"]", true, "3 أفراد", "بلانر العائلة", "شهرياً", 1100m },
                    { 5, "باقة العائلة", null, "[\"4 \\u0623\\u0641\\u0631\\u0627\\u062F \\u0641\\u064A \\u0627\\u0644\\u0628\\u0627\\u0642\\u0629\"]", true, "4 أفراد", "بلانر العائلة", "شهرياً", 1350m },
                    { 6, "باقة العائلة", null, "[\"5 \\u0623\\u0641\\u0631\\u0627\\u062F \\u0641\\u064A \\u0627\\u0644\\u0628\\u0627\\u0642\\u0629\"]", true, "5 أفراد", "بلانر العائلة", "شهرياً", 1700m },
                    { 7, "مرحلة التصحيح", null, "[\"\\u062D\\u0635\\u062A\\u0627\\u0646 \\u0641\\u064A \\u0627\\u0644\\u0623\\u0633\\u0628\\u0648\\u0639\"]", true, "تصحيح حصتين أسبوعياً", null, "شهرياً", 500m },
                    { 8, "مرحلة التصحيح", null, "[\"3 \\u062D\\u0635\\u0635 \\u0641\\u064A \\u0627\\u0644\\u0623\\u0633\\u0628\\u0648\\u0639\"]", true, "تصحيح 3 حصص أسبوعياً", null, "شهرياً", 1000m },
                    { 9, "مرحلة ما قبل الإجازة", null, "[\"\\u062D\\u0635\\u062A\\u0627\\u0646 \\u0641\\u064A \\u0627\\u0644\\u0623\\u0633\\u0628\\u0648\\u0639\",\"\\u0645\\u062F\\u0629 \\u0627\\u0644\\u062D\\u0635\\u0629 \\u0633\\u0627\\u0639\\u0629\"]", true, "ما قبل الإجازة", null, "شهرياً", 800m },
                    { 10, "مرحلة الإجازة", null, "[\"\\u062D\\u0641\\u0638 \\u0648\\u0625\\u062C\\u0627\\u0632\\u0629 \\u0627\\u0644\\u0642\\u0631\\u0622\\u0646\"]", true, "الإجازة", null, "شهرياً", 700m },
                    { 11, "مرحلة الإجازة", null, "[\"\\u0637\\u0628\\u0627\\u0639\\u0629 \\u0627\\u0644\\u0625\\u062C\\u0627\\u0632\\u0629\",\"\\u0627\\u0644\\u0634\\u062D\\u0646 \\u0634\\u0627\\u0645\\u0644\"]", true, "طباعة الإجازة", null, "مرة واحدة", 3000m },
                    { 12, "تعليم القراءة للصغار", null, "[\"\\u0645\\u062F\\u0629 \\u0627\\u0644\\u062D\\u0635\\u0629 40 \\u062F\\u0642\\u064A\\u0642\\u0629\"]", true, "حصتان", null, "شهرياً", 350m },
                    { 13, "تعليم القراءة للصغار", null, "[\"\\u0645\\u062F\\u0629 \\u0627\\u0644\\u062D\\u0635\\u0629 40 \\u062F\\u0642\\u064A\\u0642\\u0629\"]", true, "3 حصص", null, "شهرياً", 470m },
                    { 14, "شرح أحاديث وتربية وتقوية التخاطب وتعديل اللثغة", null, "[\"\\u064A\\u0648\\u0645\\u0627\\u0646 \\u0623\\u0633\\u0628\\u0648\\u0639\\u064A\\u0627\\u064B\",\"\\u0645\\u062F\\u0629 \\u0627\\u0644\\u062D\\u0635\\u0629 45 \\u062F\\u0642\\u064A\\u0642\\u0629\"]", true, "برنامج متكامل", null, "شهرياً", 880m }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ConversationId_CreatedAt",
                table: "ChatMessages",
                columns: new[] { "ConversationId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_Channel_ExternalUserId",
                table: "Conversations",
                columns: new[] { "Channel", "ExternalUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentProofs_ReservationId",
                table: "PaymentProofs",
                column: "ReservationId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_ProgramId",
                table: "Reservations",
                column: "ProgramId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_ReferenceNumber",
                table: "Reservations",
                column: "ReferenceNumber",
                unique: true,
                filter: "[ReferenceNumber] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdminNotifications");

            migrationBuilder.DropTable(
                name: "ChatMessages");

            migrationBuilder.DropTable(
                name: "PaymentProofs");

            migrationBuilder.DropTable(
                name: "Conversations");

            migrationBuilder.DropTable(
                name: "Reservations");

            migrationBuilder.DropTable(
                name: "Programs");
        }
    }
}
