# ai-inventory-management-system
AI driven inventory management system

# Setup & Installation
1. Database Configuration
Import the provided SQL schema into your MySQL instance.

SQL

CREATE DATABASE ai_inventory_system;
-- Run the schema.sql found in the backend/ folder
2. Backend Setup
Bash

cd backend
npm install
Create a .env file in the backend/ directory:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=ai_inventory_system
JWT_SECRET=your_super_secret_key
PORT=3001
Run the server: npm start

3. Client Setup
Bash

cd client
npm install
Create a .env.local file in the client/ directory:

Code snippet

NEXT_PUBLIC_API_URL=http://localhost:3001/api
Run the dashboard: npm run dev
