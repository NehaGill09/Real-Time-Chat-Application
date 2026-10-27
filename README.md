# Real-Time Chat Application

A full-stack real-time messaging app built with React, Node.js, Express, MongoDB, and Socket.IO.

## Features
- JWT-based registration and login with bcrypt password hashing
- Real-time direct messaging via Socket.IO
- Persistent message history in MongoDB
- Online presence and typing indicators
- Responsive chat interface
- Input validation, protected REST endpoints, and environment-based configuration
- GitHub Actions CI for backend and frontend builds

## Requirements
- Node.js 20+
- MongoDB local instance or MongoDB Atlas connection string

## Setup

1. Clone the repository.
2. Configure the backend:
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run dev
   ```
3. Configure the frontend in another terminal:
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```
4. Open the Vite URL shown in the terminal (normally http://localhost:5173).

Set `MONGODB_URI` and a long random `JWT_SECRET` in `backend/.env`. Never commit `.env` files or production secrets.

## Environment variables
Backend: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`. Frontend: `VITE_API_URL`, `VITE_SOCKET_URL`.

## Scripts
- Backend: `npm run dev`, `npm start`
- Frontend: `npm run dev`, `npm run build`, `npm run preview`

## Security notes
Use HTTPS in production, set a strong unique JWT secret, restrict `CLIENT_URL` to your deployed frontend, and configure MongoDB network access securely. This is a starter project; review rate limiting and operational monitoring before public production use.

## License
MIT
