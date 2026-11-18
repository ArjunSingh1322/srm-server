import mysql from "mysql2/promise";
import "dotenv/config";

// Initial connection without database
const initialDb = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    ssl: {
        minVersion: "TLSv1.2"
    }
});

await initialDb.query("CREATE DATABASE IF NOT EXISTS SRM");
await initialDb.end();

export const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    ssl: {
        minVersion: "TLSv1.2"
    }
});

console.log("TiDB Connection Successfully Done!");

await db.query("USE SRM");

await db.execute(`
    CREATE TABLE IF NOT EXISTS student_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        age INT,
        course VARCHAR(50),
        mobile BIGINT UNIQUE,
        roll_no INT UNIQUE,
        photo VARCHAR(255)
    )
`);

await db.execute(`
    CREATE TABLE IF NOT EXISTS admins_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        mobile BIGINT UNIQUE,
        role VARCHAR(20) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`);

console.log("SRM Tables Created Successfully!");