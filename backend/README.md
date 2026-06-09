# Auction Platform API

A NestJS-based REST API for an auction platform with real-time bidding functionality.

## Features

- User authentication with JWT
- CRUD operations for auction items
- Real-time bidding with WebSocket support
- Role-based access control
- PostgreSQL database integration

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd auction-platform
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=kkmm26
DB_NAME=auction_platform
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=1d
```

4. Create the database:
```bash
createdb auction_platform
```

## Running the Application

Development mode:
```bash
npm run start:dev
```

Production mode:
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Authentication
- `POST /users/register` - Register a new user
- `POST /users/login` - Login and get JWT token
- `GET /users/profile` - Get authenticated user's profile (requires JWT)

### Items
- `POST /items` - Create a new item (requires JWT)
- `GET /items` - List all items
- `GET /items/:id` - Get item details
- `PUT /items/:id` - Update an item (requires JWT, seller only)
- `DELETE /items/:id` - Delete an item (requires JWT, seller only)

### Bids
- `POST /bids` - Place a bid (requires JWT)
- `GET /bids/:itemId` - Get all bids for an item

## WebSocket Events

The application uses WebSocket for real-time updates. Connect to the WebSocket server to receive updates:

```javascript
const socket = io('http://localhost:3000');

// Listen for new bids on a specific item
socket.on(`item-${itemId}`, (data) => {
  if (data.type === 'new_bid') {
    console.log('New bid:', data.bid);
  }
});
```

## Security

- All sensitive routes are protected with JWT authentication
- Passwords are hashed using bcrypt
- Input validation using class-validator
- Role-based access control for item management

## Error Handling

The API uses standard HTTP status codes and returns error messages in the following format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
