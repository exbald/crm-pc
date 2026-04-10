import bcrypt from "bcryptjs";
import { db } from "./lib/db";
import {
  users,
  contacts,
  projects,
  milestones,
  tasks,
  issues,
} from "./lib/db/schema";

async function seed() {
  console.log("Seeding database...");

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  const [alice, bob, carol, dan, eve] = await db
    .insert(users)
    .values([
      { name: "Alice Johnson", email: "alice@ridgeline.com", password: hash("password123"), role: "admin" },
      { name: "Bob Smith", email: "bob@ridgeline.com", password: hash("password123"), role: "project_manager" },
      { name: "Carol Lee", email: "carol@ridgeline.com", password: hash("password123"), role: "team_member" },
      { name: "Dan Wilson", email: "dan@ridgeline.com", password: hash("password123"), role: "team_member" },
      { name: "Eve Chen", email: "eve@ridgeline.com", password: hash("password123"), role: "team_member" },
    ])
    .returning();

  const [contact1, contact2, contact3] = await db
    .insert(contacts)
    .values([
      { firstName: "Jane", lastName: "Doe", email: "jane@acme.com", role: "PM", team: "Product" },
      { firstName: "John", lastName: "Smith", email: "john@acme.com", role: "Developer", team: "Engineering" },
      { firstName: "Alice", lastName: "Lee", email: "alice@acme.com", role: "Designer", team: "Design" },
    ])
    .returning();

  const [project1, project2, project3] = await db
    .insert(projects)
    .values([
      { name: "Ridgeline Website", description: "Company website rebuild with modern stack", status: "active", ownerId: bob.id, startDate: "2026-03-01", targetDate: "2026-06-30" },
      { name: "Mobile App v2", description: "Native mobile app for iOS and Android", status: "on_hold", ownerId: alice.id, startDate: "2026-04-01", targetDate: "2026-09-30" },
      { name: "Client Portal", description: "Self-service portal for clients", status: "active", ownerId: bob.id, startDate: "2026-04-15", targetDate: "2026-08-31" },
    ])
    .returning();

  const [ms1, ms2, ms3, ms4] = await db
    .insert(milestones)
    .values([
      { projectId: project1.id, name: "Beta Launch", targetDate: new Date("2026-05-20"), status: "in_progress" },
      { projectId: project1.id, name: "Design Review", targetDate: new Date("2026-06-01"), status: "not_started" },
      { projectId: project2.id, name: "Sprint 1 Complete", targetDate: new Date("2026-05-01"), status: "in_progress" },
      { projectId: project3.id, name: "Kickoff", targetDate: new Date("2026-04-20"), status: "completed" },
    ])
    .returning();

  await db.insert(tasks).values([
    { projectId: project1.id, milestoneId: ms1.id, title: "Set up CI/CD pipeline", description: "Configure GitHub Actions for automated testing and deployment", status: "done", priority: "high", assigneeId: carol.id, dueDate: new Date("2026-04-05"), completedAt: new Date("2026-04-04") },
    { projectId: project1.id, milestoneId: ms1.id, title: "Design landing page", description: "Create mockups and implement responsive landing page", status: "done", priority: "medium", assigneeId: eve.id, dueDate: new Date("2026-04-10"), completedAt: new Date("2026-04-09") },
    { projectId: project1.id, milestoneId: ms1.id, title: "Implement user auth flow", description: "Login, register, password reset pages", status: "in_progress", priority: "critical", assigneeId: carol.id, dueDate: new Date("2026-04-15") },
    { projectId: project1.id, milestoneId: ms1.id, title: "Build contact management", description: "CRUD for contacts with search and filter", status: "in_progress", priority: "high", assigneeId: dan.id, dueDate: new Date("2026-04-18") },
    { projectId: project1.id, milestoneId: ms1.id, title: "Dashboard widgets", description: "My tasks, my issues, project summary cards", status: "to_do", priority: "medium", assigneeId: eve.id, dueDate: new Date("2026-04-25") },
    { projectId: project1.id, milestoneId: ms2.id, title: "API documentation", description: "Generate OpenAPI docs for all endpoints", status: "to_do", priority: "low", assigneeId: carol.id, dueDate: new Date("2026-05-20") },
    { projectId: project2.id, milestoneId: ms3.id, title: "Setup React Native project", status: "done", priority: "high", assigneeId: carol.id, dueDate: new Date("2026-04-10"), completedAt: new Date("2026-04-08") },
    { projectId: project2.id, milestoneId: ms3.id, title: "Navigation structure", status: "in_progress", priority: "high", assigneeId: dan.id, dueDate: new Date("2026-04-20") },
    { projectId: project2.id, milestoneId: ms3.id, title: "API integration layer", status: "to_do", priority: "medium", assigneeId: eve.id, dueDate: new Date("2026-04-25") },
    { projectId: project3.id, milestoneId: ms4.id, title: "Project scaffolding", status: "done", priority: "high", assigneeId: carol.id, dueDate: new Date("2026-04-16"), completedAt: new Date("2026-04-15") },
    { projectId: project3.id, milestoneId: ms4.id, title: "Auth integration", status: "to_do", priority: "high", assigneeId: dan.id, dueDate: new Date("2026-04-30") },
    { projectId: project3.id, milestoneId: ms4.id, title: "Dashboard UI", status: "blocked", priority: "medium", assigneeId: eve.id, dueDate: new Date("2026-05-15") },
    { projectId: project1.id, title: "Fix login redirect bug", status: "in_review", priority: "critical", assigneeId: carol.id, dueDate: new Date("2026-04-12") },
    { projectId: project1.id, title: "Add loading skeletons", status: "done", priority: "low", assigneeId: eve.id, completedAt: new Date("2026-04-11") },
    { projectId: project2.id, title: "Dark mode support", status: "to_do", priority: "low", assigneeId: dan.id, dueDate: new Date("2026-05-30") },
    { projectId: project2.id, title: "Push notifications", status: "to_do", priority: "medium", assigneeId: carol.id, dueDate: new Date("2026-06-15") },
    { projectId: project3.id, title: "Client onboarding flow", status: "to_do", priority: "high", assigneeId: alice.id, dueDate: new Date("2026-05-20") },
    { projectId: project1.id, title: "Performance audit", status: "to_do", priority: "medium", assigneeId: carol.id, dueDate: new Date("2026-05-10") },
  ]);

  await db.insert(issues).values([
    { projectId: project1.id, title: "Login page crashes on Safari", description: "After entering credentials, the page goes blank on Safari 17.x", category: "bug", status: "open", priority: "critical", reporterId: bob.id, assigneeId: carol.id },
    { projectId: project1.id, title: "Can't export contacts to CSV", description: "Export button does nothing when clicked", category: "bug", status: "in_progress", priority: "high", reporterId: alice.id, assigneeId: dan.id },
    { projectId: project2.id, title: "Add biometric auth option", description: "Users want Face ID / Touch ID login", category: "request", status: "open", priority: "medium", reporterId: eve.id },
    { projectId: project1.id, title: "API timeout on large datasets", description: "Dashboard takes 15+ seconds with 1000+ tasks", category: "error", status: "resolved", priority: "high", reporterId: carol.id, assigneeId: carol.id, resolvedAt: new Date("2026-04-10") },
    { projectId: project3.id, title: "Dark mode for client portal", description: "Clients have requested dark mode support", category: "enhancement", status: "open", priority: "low", reporterId: alice.id },
    { projectId: project2.id, title: "Memory leak in chat module", description: "App memory usage grows linearly during active chat", category: "bug", status: "open", priority: "critical", reporterId: dan.id, assigneeId: carol.id },
  ]);

  console.log("Seed complete!");
  console.log("Test accounts:");
  console.log("  Admin:   alice@ridgeline.com / password123");
  console.log("  PM:      bob@ridgeline.com / password123");
  console.log("  Member:  carol@ridgeline.com / password123");
  console.log("  Member:  dan@ridgeline.com / password123");
  console.log("  Member:  eve@ridgeline.com / password123");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
