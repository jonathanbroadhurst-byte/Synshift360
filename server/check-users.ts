import { db } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcrypt";

async function checkUsers() {
  console.log("Checking users in database...");
  
  try {
    const allUsers = await db.select().from(users);
    console.log("Users found:", allUsers.length);
    
    for (const user of allUsers) {
      console.log(`- Email: ${user.email}, Role: ${user.role}, Username: ${user.username}`);
    }

    // Test password verification for admin user
    const adminUser = allUsers.find(u => u.email === 'admin@demo.com');
    if (adminUser) {
      const isValidPassword = await bcrypt.compare('admin123', adminUser.password);
      console.log(`Admin password verification: ${isValidPassword ? 'VALID' : 'INVALID'}`);
    }
    
  } catch (error) {
    console.error("Error checking users:", error);
  }
}

checkUsers().then(() => {
  console.log("Check completed");
  process.exit(0);
}).catch((error) => {
  console.error("Check failed:", error);
  process.exit(1);
});