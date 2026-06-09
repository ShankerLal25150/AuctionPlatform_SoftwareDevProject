# Auction Platform

Full-stack auction application with a NestJS backend and an Angular frontend. The project supports user authentication, auction item management, bidding, and real-time updates.

## Tech Stack

- Backend: NestJS, TypeORM, PostgreSQL, JWT, Socket.IO
- Frontend: Angular 19, Angular Material, NgRx, Chart.js, Socket.IO client

## Features

- User registration and login
- JWT-protected routes and authenticated profiles
- Create, browse, update, and delete auction items
- Place bids on active auctions
- Real-time bidding updates
- Auction status tracking and item history views

## Project Structure

- `backend/` - NestJS REST API and WebSocket server
- `frontend/` - Angular client application

## Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL 12 or newer

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd auction-platform-main
```

### 2. Configure the backend

Create a `backend/.env` file with your local database and JWT settings:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_NAME=auction_platform
JWT_SECRET=change-this-secret
JWT_EXPIRATION=1d
```

### 3. Install dependencies

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

## Running the Application

### Backend

```bash
cd backend
npm run start:dev
```

The API typically runs on `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm start
```

The Angular app typically runs on `http://localhost:4200`.

## Build and Test

### Backend

```bash
cd backend
npm run build
npm test
npm run test:e2e
```

### Frontend

```bash
cd frontend
npm run build
npm test
```

## API Overview

Common backend routes include:

- `POST /users/register` - Register a new user
- `POST /users/login` - Log in and receive a JWT
- `GET /users/profile` - Get the authenticated user profile
- `GET /items` - List auction items
- `POST /items` - Create an auction item
- `GET /items/:id` - Get item details
- `PUT /items/:id` - Update an item
- `DELETE /items/:id` - Delete an item
- `POST /bids` - Place a bid
- `GET /bids/:itemId` - List bids for an item

## Notes

- Update the frontend API base URL if your backend does not run on the default local address.
- Keep secrets such as `JWT_SECRET` and database credentials out of version control.

## License

This project is provided without a declared license.