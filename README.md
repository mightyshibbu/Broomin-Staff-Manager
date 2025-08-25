# Broomin - Staff Management System

A comprehensive staff management system with attendance tracking, built with React, TypeScript, Node.js, and MySQL.

## Features

- Employee management (CRUD operations)
- Attendance tracking
- Staff information management
- Salary calculations
- Responsive design

## Prerequisites

- Docker and Docker Compose
- Node.js (v16 or later)
- npm or yarn

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/mightyshibbu/Broomin-Staff-Manager.git
   cd Broomin-Staff-Manager
   ```

2. **Start the application**
   - On Windows:
     ```powershell
     .\start.ps1
     ```
   - On Linux/Mac:
     ```bash
     chmod +x start.sh
     ./start.sh
     ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Adminer (Database UI): http://localhost:8080
     - System: MySQL
     - Server: db
     - Username: broomin_user
     - Password: broomin_password
     - Database: broomin_db

## Project Structure

- `/src` - Frontend React application
- `/server` - Backend Node.js/Express server
  - `/config` - Database configuration
  - `/routes` - API routes
- `docker-compose.yml` - Docker configuration for MySQL and Adminer

## Development

### Start development servers

1. Start the backend server:
   ```bash
   cd server
   npm install
   npm start
   ```

2. Start the frontend development server (in a new terminal):
   ```bash
   npm install
   npm run dev
   ```

### Database Management

- The database schema is automatically created when the MySQL container starts
- Initial data is loaded from `server/init-db.sql`
- Use Adminer (http://localhost:8080) to manage the database

## Environment Variables

Create a `.env` file in the `/server` directory with the following variables:

```
# Database Configuration
DB_HOST=db
DB_PORT=3306
DB_USER=broomin_user
DB_PASSWORD=broomin_password
DB_NAME=broomin_db

# Server Configuration
PORT=5000
NODE_ENV=development
```

## License

This project is licensed under the MIT License.
