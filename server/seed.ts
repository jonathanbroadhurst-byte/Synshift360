import { db } from "./db";
import { users, organizations } from "@shared/schema";
import bcrypt from "bcrypt"; // ✅ FIXED: Changed from bcryptjs to native bcrypt

async function seedDatabase() {
  console.log("Executing pristine database context seeding...");
  
  try {
    // 1. Clear out any sticky historical record conflicts safely
    await db.delete(users);
    await db.delete(organizations);
    console.log("Database cleared successfully.");

    // 2. Seed default corporate tenant profile
    const [organization] = await db.insert(organizations).values({
      name: "Demo Organization",
      domain: "demo.com",
      isActive: true,
      quantumCredits: 5,
    }).returning();

    console.log("Created organization:", organization.name);

    // 3. Seed Master Platform Owner profile
    const [adminUser] = await db.insert(users).values({
      email: "admin@demo.com",
      username: "admin@demo.com",
      password: await bcrypt.hash("admin123", 10),
      role: "owner",
      organizationId: organization.id,
      firstName: "Platform",
      lastName: "Owner"
    }).returning();

    console.log("Created owner admin user:", adminUser.email);

    // 4. Seed Corporate Assessment Target Leader profile
    const leaderPassword = await bcrypt.hash("leader123", 10);
    const [leader] = await db.insert(users).values({
      email: "leader@demo.com",
      username: "leader@demo.com",
      password: leaderPassword,
      role: "leader",
      organizationId: organization.id,
      firstName: "Jane",
      lastName: "Leader"
    }).returning();

    console.log("Created leader user:", leader.email);
    console.log("🎉 Database seeding routine executed successfully!");
    
  } catch (error) {
    console.error("❌ Critical exception during seeder execution:", error);
    throw error;
  }
}

// Fire the initialization engine
seedDatabase().catch((err) => {
  console.error("Seeder subsystem process failure:", err);
  process.exit(1);
});
