# CMD ING Guwahati - Web Application

A high-security, production-ready web application for the Province of Mary Help of Christians ING – Guwahati.

## Tech Stack

- **Frontend**: React (Vite), TypeScript, React Router
- **Backend**: PHP 8+ (REST API)
- **Database**: MySQL/MariaDB
- **Hosting**: cPanel shared hosting compatible

## Features

- Content Management System (CMS)
- News Management
- Gallery Management
- Circulars & NewsLine Management
- Provincial Information
- Council & Commissions
- Birthday Wishes
- Banner Management
- Hero Slider
- Admin Dashboard with Role-Based Access Control
- Secure Authentication & Authorization
- Image Upload Functionality
- Responsive Design

## Project Structure

```
ing26/
├── frontend/          # React frontend application
├── public_html/       # PHP API and production build
├── database/          # SQL schema files
└── README.md          # This file
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PHP 8.0 or higher
- MySQL/MariaDB
- XAMPP (for local development)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ing26
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure database**
   - Update `public_html/api/config/database.php` with your database credentials
   - Import the database schema from `database/complete_schema.sql`

4. **Start development servers**
   ```bash
   # Terminal 1: PHP API server
   cd public_html
   php -S 127.0.0.1:8000 -t api api/router.php
   
   # Terminal 2: React development server
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - API: http://localhost:8000

## Deployment

See `CPANEL_DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

## Security Features

- OWASP Top 10 protection
- SQL Injection prevention (PDO prepared statements)
- XSS protection
- CSRF tokens
- Secure session handling
- Password hashing (bcrypt)
- Input validation & sanitization
- Rate limiting
- Secure HTTP headers

## License

Copyright © 2014-2025 donboscoingguwahati.org. All rights reserved.
