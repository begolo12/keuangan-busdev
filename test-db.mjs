import { neon } from '@neondatabase/serverless';

const connectionString = "postgresql://neondb_owner:npg_UvQA2qkdpo5K@ep-broad-tree-b3bl6iud-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function testConnection() {
  try {
    const sql = neon(connectionString);
    const result = await sql`SELECT NOW(), current_database(), current_user`;
    console.log("Neon DB Connected Successfully!", result);
  } catch (err) {
    console.error("Neon DB Connection Error:", err);
  }
}

testConnection();
