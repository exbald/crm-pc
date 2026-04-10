import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log("Seeding database...");

  const adminId = randomUUID();
  const pmId = randomUUID();
  const dev1Id = randomUUID();
  const dev2Id = randomUUID();
  const designerId = randomUUID();

  const password = await bcrypt.hash("password123", 10);

  await sql`
    INSERT INTO "user" (id, name, email, password, role) VALUES
    (${adminId}, 'Alice Johnson', 'alice@ridgeline.com', ${password}, 'admin'),
    (${pmId}, 'Bob Smith', 'bob@ridgeline.com', ${password}, 'project_manager'),
    (${dev1Id}, 'Carol Williams', 'carol@ridgeline.com', ${password}, 'team_member'),
    (${dev2Id}, 'David Brown', 'david@ridgeline.com', ${password}, 'team_member'),
    (${designerId}, 'Eve Davis', 'eve@ridgeline.com', ${password}, 'team_member')
    ON CONFLICT (email) DO NOTHING
  `;

  const contact1Id = randomUUID();
  const contact2Id = randomUUID();
  const contact3Id = randomUUID();

  await sql`
    INSERT INTO "contact" (id, first_name, last_name, email, phone, role, team) VALUES
    (${contact1Id}, 'John', 'External', 'john@client.com', '555-0101', 'Client', 'External'),
    (${contact2Id}, 'Jane', 'Partner', 'jane@partner.com', '555-0102', 'Partner', 'Business'),
    (${contact3Id}, 'Mike', 'Vendor', 'mike@vendor.com', '555-0103', 'Vendor', 'Operations')
    ON CONFLICT DO NOTHING
  `;

  const proj1Id = randomUUID();
  const proj2Id = randomUUID();
  const proj3Id = randomUUID();

  await sql`
    INSERT INTO "project" (id, name, description, status, owner_id, start_date, target_date) VALUES
    (${proj1Id}, 'Ridgeline Website', 'Company website redesign and development', 'active', ${pmId}, '2026-04-01', '2026-06-30'),
    (${proj2Id}, 'Mobile App v2', 'Second version of the mobile application', 'active', ${pmId}, '2026-04-15', '2026-08-15'),
    (${proj3Id}, 'Client Portal', 'Customer-facing portal for deal tracking', 'active', ${adminId}, '2026-05-01', '2026-09-01')
    ON CONFLICT DO NOTHING
  `;

  const ms1Id = randomUUID();
  const ms2Id = randomUUID();
  const ms3Id = randomUUID();
  const ms4Id = randomUUID();

  await sql`
    INSERT INTO "milestone" (id, project_id, name, target_date, status) VALUES
    (${ms1Id}, ${proj1Id}, 'Design Complete', '2026-04-30', 'completed'),
    (${ms2Id}, ${proj1Id}, 'Beta Launch', '2026-05-31', 'in_progress'),
    (${ms3Id}, ${proj1Id}, 'Public Release', '2026-06-30', 'not_started'),
    (${ms4Id}, ${proj2Id}, 'Prototype', '2026-05-15', 'in_progress')
    ON CONFLICT DO NOTHING
  `;

  const tasks = [
    { id: randomUUID(), project_id: proj1Id, milestone_id: ms1Id, title: 'Set up design system', status: 'done', priority: 'high', assignee_id: designerId },
    { id: randomUUID(), project_id: proj1Id, milestone_id: ms1Id, title: 'Create wireframes', status: 'done', priority: 'high', assignee_id: designerId },
    { id: randomUUID(), project_id: proj1Id, milestone_id: ms1Id, title: 'Design homepage mockup', status: 'done', priority: 'high', assignee_id: designerId },
    { id: randomUUID(), project_id: proj1Id, milestone_id: ms2Id, title: 'Build navigation component', status: 'done', priority: 'medium', assignee_id: dev1Id },
    { id: randomUUID(), project_id: proj1Id, milestone_id: ms2Id, title: 'Build hero section', status: 'done', priority: 'high', assignee_id: dev1Id },
    { id: randomUUID(), project_id: proj1Id, milestone_id: ms2Id, title: 'Implement contact form', status: 'in_progress', priority: 'medium', assignee_id: dev1Id, due_date: '2026-04-15' },
    { id: randomUUID(), project_id: proj1Id, milestone_id: ms2Id, title: 'Build about page', status: 'in_progress', priority: 'medium', assignee_id: dev2Id, due_date: '2026-04-18' },
    { id: randomUUID(), project_id: proj1Id, milestone_id: ms2Id, title: 'Implement SEO meta tags', status: 'to_do', priority: 'low', assignee_id: dev2Id },
    { id: randomUUID(), project_id: proj1Id, milestone_id: ms2Id, title: 'Fix responsive layout issues', status: 'blocked', priority: 'critical', assignee_id: dev1Id, due_date: '2026-04-10' },
    { id: randomUUID(), project_id: proj1Id, milestone_id: ms3Id, title: 'Performance optimization', status: 'to_do', priority: 'high', assignee_id: dev1Id },
    { id: randomUUID(), project_id: proj1Id, milestone_id: ms3Id, title: 'Write integration tests', status: 'to_do', priority: 'medium', assignee_id: dev2Id },
    { id: randomUUID(), project_id: proj2Id, milestone_id: ms4Id, title: 'Set up React Native project', status: 'done', priority: 'critical', assignee_id: dev1Id },
    { id: randomUUID(), project_id: proj2Id, milestone_id: ms4Id, title: 'Design app screens', status: 'in_progress', priority: 'high', assignee_id: designerId, due_date: '2026-04-20' },
    { id: randomUUID(), project_id: proj2Id, milestone_id: ms4Id, title: 'Build authentication flow', status: 'in_progress', priority: 'high', assignee_id: dev2Id },
    { id: randomUUID(), project_id: proj2Id, milestone_id: ms4Id, title: 'Implement push notifications', status: 'to_do', priority: 'medium', assignee_id: dev1Id },
    { id: randomUUID(), project_id: proj3Id, milestone_id: null, title: 'Set up project scaffolding', status: 'to_do', priority: 'high', assignee_id: dev1Id },
    { id: randomUUID(), project_id: proj3Id, milestone_id: null, title: 'Design portal UI', status: 'to_do', priority: 'high', assignee_id: designerId },
    { id: randomUUID(), project_id: proj3Id, milestone_id: null, title: 'Build deal dashboard', status: 'to_do', priority: 'medium', assignee_id: dev2Id },
  ];

  for (const task of tasks) {
    const completedAt = task.status === 'done' ? '2026-04-05' : null;
    await sql`
      INSERT INTO "task" (id, project_id, milestone_id, title, status, priority, assignee_id, due_date, completed_at)
      VALUES (${task.id}, ${task.project_id}, ${task.milestone_id}, ${task.title}, ${task.status}, ${task.priority}, ${task.assignee_id}, ${task.due_date || null}, ${completedAt}::date)
      ON CONFLICT DO NOTHING
    `;
  }

  const issues = [
    { id: randomUUID(), project_id: proj1Id, title: 'Navigation menu overflows on mobile', category: 'bug', status: 'open', priority: 'high', reporter_id: designerId, assignee_id: dev1Id },
    { id: randomUUID(), project_id: proj1Id, title: 'Contact form does not validate email', category: 'bug', status: 'in_progress', priority: 'critical', reporter_id: pmId, assignee_id: dev1Id },
    { id: randomUUID(), project_id: proj1Id, title: 'Add dark mode support', category: 'enhancement', status: 'open', priority: 'medium', reporter_id: adminId },
    { id: randomUUID(), project_id: proj2Id, title: 'App crashes on login with special characters', category: 'error', status: 'open', priority: 'critical', reporter_id: dev2Id, assignee_id: dev1Id },
    { id: randomUUID(), project_id: proj2Id, title: 'Need offline support for forms', category: 'request', status: 'open', priority: 'medium', reporter_id: pmId },
    { id: randomUUID(), project_id: proj3Id, title: 'Dashboard charts need responsive sizing', category: 'bug', status: 'open', priority: 'low', reporter_id: designerId },
  ];

  for (const issue of issues) {
    await sql`
      INSERT INTO "issue" (id, project_id, title, category, status, priority, reporter_id, assignee_id)
      VALUES (${issue.id}, ${issue.project_id}, ${issue.title}, ${issue.category}, ${issue.status}, ${issue.priority}, ${issue.reporter_id}, ${issue.assignee_id || null})
      ON CONFLICT DO NOTHING
    `;
  }

  console.log("Seed complete!");
  console.log("\nTest accounts:");
  console.log("  Admin:    alice@ridgeline.com / password123");
  console.log("  PM:       bob@ridgeline.com / password123");
  console.log("  Member:   carol@ridgeline.com / password123");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
