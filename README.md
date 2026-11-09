# IBooking

A hotel booking web app with a React frontend and an Express + MongoDB REST API for hotels, rooms and users.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens)

## Overview

IBooking is a learning project modelled on hotel booking sites. Users search for stays by destination, dates and number of guests, browse the results, open a hotel's detail page and reserve rooms. The backend is a REST API built on Express and Mongoose with JWT-based authentication and admin-only routes for managing hotels and rooms.

## Features

- **Search**: pick a destination, a date range (`react-date-range`) and the number of adults, children and rooms. The search state is shared through a React context.
- **Home page sections**: property counts by city, property counts by type (hotel, apartment, resort, villa, cabin), featured properties and a mailing-list banner.
- **Results list**: filter hotels by city and min/max price.
- **Hotel detail page**: photos, description, cheapest price and a reservation modal that lists rooms and room numbers.
- **Room availability**: reserved dates are written to each room number's `unavailableDates`.
- **Authentication**: register and log in with bcrypt-hashed passwords. Login returns a JWT that the frontend keeps in an auth context backed by `localStorage`.
- **Role-based access**: admins can create, update and delete hotels and rooms and list all users. Users can read, update or delete only their own account.

## Tech stack

| Layer    | Technology                                                                           |
| -------- | ------------------------------------------------------------------------------------ |
| Frontend | React 18, React Router 6, Context API + `useReducer`, Font Awesome, react-date-range, date-fns, axios |
| Backend  | Node.js, Express 4, Mongoose 8, bcrypt, jsonwebtoken, cors                           |
| Database | MongoDB                                                                              |

## Project structure

```
IBooking/
├── backend/
│   ├── api/            # auth, users, hotels, rooms routers
│   ├── middleware/     # verifyToken / verifyUser / verifyAdmin
│   ├── models/         # Hotel, Room, User (Mongoose schemas)
│   ├── db.js           # MongoDB connection
│   └── index.js        # Express entry point (port 5000)
├── public/
└── src/
    ├── components/     # navbar, header (search), featured, propertyList, reserve, ...
    ├── context/        # AuthContext, SearchContext
    ├── hooks/useFetch.js
    └── pages/          # Home, List, Hotel, Login
```

## Getting started

### Prerequisites

- Node.js 16 or later and npm
- MongoDB running locally on `mongodb://localhost:27017`

### Install

```bash
git clone https://github.com/VamsiKrishnaThota03/IBooking.git
cd IBooking
npm install                 # frontend dependencies
cd backend && npm install   # backend dependencies
```

### Configuration

The current code has its configuration hard-coded. Move these values into environment variables before you deploy anywhere.

| Setting      | Where it is set                                            | Example placeholder                    |
| ------------ | ---------------------------------------------------------- | -------------------------------------- |
| `MONGO_URI`  | `backend/db.js`                                            | `mongodb://localhost:27017/IBookingdb` |
| `JWT_SECRET` | `backend/api/auth.js`, `backend/middleware/verifyToken.js` | `<your-jwt-secret>`                    |
| API port     | `backend/index.js`                                         | `5000`                                 |

### Run

```bash
# backend (from the backend/ folder)
node index.js

# frontend (from the project root), http://localhost:3000
npm start

# or run both together (needs nodemon installed globally: npm i -g nodemon)
npm run both
```

Other scripts: `npm run build` creates a production build, and `npm test` runs the CRA test runner.

## API

The base URL is `http://localhost:5000`. Protected routes expect the JWT in an `auth-token` header.

| Method | Path                                 | Access | Purpose                                                        |
| ------ | ------------------------------------ | ------ | -------------------------------------------------------------- |
| POST   | `/api/auth/register`                 | Public | Register a user                                                |
| POST   | `/api/auth/login`                    | Public | Log in and receive a JWT (`authtoken`)                         |
| GET    | `/api/users`                         | Admin  | List all users                                                 |
| GET    | `/api/users/:id`                     | User   | Get a user                                                     |
| PUT    | `/api/users/:id`                     | User   | Update a user                                                  |
| DELETE | `/api/users/:id`                     | User   | Delete a user                                                  |
| POST   | `/api/hotels`                        | Admin  | Create a hotel                                                 |
| PUT    | `/api/hotels/:id`                    | Admin  | Update a hotel                                                 |
| DELETE | `/api/hotels/:id`                    | Admin  | Delete a hotel                                                 |
| GET    | `/api/hotels/find/:id`               | Public | Get a hotel by id                                              |
| GET    | `/api/hotels`                        | Public | List hotels (query: `city`, `featured`, `min`, `max`, `limit`) |
| GET    | `/api/hotels/countByCity?cities=a,b` | Public | Count hotels for each city                                     |
| GET    | `/api/hotels/countByType`            | Public | Count properties by type                                       |
| GET    | `/api/hotels/room/:id`               | Public | List the rooms of a hotel                                      |
| POST   | `/api/rooms/:hotelid`                | Admin  | Create a room and attach it to a hotel                         |
| PUT    | `/api/rooms/:id`                     | Admin  | Add unavailable dates to a room number                         |
| PUT    | `/api/rooms/availability/:id`        | Public | Update a room                                                  |
| DELETE | `/api/rooms/:id/:hotelid`            | Admin  | Delete a room and detach it from its hotel                     |
| GET    | `/api/rooms/:id`                     | Public | Get a room                                                     |
| GET    | `/api/rooms`                         | Public | List all rooms                                                 |

## Known issues

This is a work in progress:

- Most frontend components call `http://localhost:5000/hotels/...` without the `/api` prefix that the backend uses, and `package.json` sets a dev proxy to port `8800`. Align these before running end to end.
- The login route references `next`/`createError` without defining them, so failed logins don't return a clean error yet.
