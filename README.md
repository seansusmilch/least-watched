# Least-Watched

A modern application to identify unwatched or least-watched media from your Emby server, with integration to Sonarr and Radarr.

## Project Structure

This is a monorepo containing both the backend and frontend applications:

- `packages/backend`: Python FastAPI backend that communicates with Emby, Sonarr, and Radarr
- `packages/frontend`: Next.js frontend with a modern dark UI

## Features

- Identifies media that hasn't been watched for a configurable period
- Ignores recently added content
- Integrates with Emby, Sonarr, and Radarr
- Modern, responsive dark UI
- Configurable batch processing and concurrency limits

## Requirements

- Python 3.12+
- Poetry (dependency management)
- Node.js 18+ and npm
- Emby server
- Sonarr and Radarr (optional)

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/least-watched.git
   cd least-watched
   ```

2. Install dependencies:
   ```bash
   npm run install:all
   ```

   This will install:
   - Root npm dependencies
   - Backend Python dependencies using Poetry
   - Frontend npm dependencies

## Configuration

Create a `.env` file in the `packages/backend` directory with the following variables:

```
# Emby configuration
EMBY_URL=http://your-emby-server:8096
EMBY_TOKEN=your-emby-api-token

# Sonarr configuration
SONARR_URL=http://your-sonarr-server:8989
SONARR_API_KEY=your-sonarr-api-key

# Radarr configuration
RADARR_URL=http://your-radarr-server:7878
RADARR_API_KEY=your-radarr-api-key

# Application settings
UNWATCHED_DAYS_THRESHOLD=365  # Consider media unwatched if not watched in this many days
IGNORE_NEWER_THAN_DAYS=270    # Ignore media added within this many days
CONCURRENT_LIMIT=5            # Number of concurrent API requests
BATCH_SIZE=40                 # Number of items to process in each batch
```

### How to get API tokens:

- **Emby**: Go to Dashboard > API Keys > Create new API key
- **Sonarr**: Go to Settings > General > API Key
- **Radarr**: Go to Settings > General > API Key

## Running the Application

You can run both the backend and frontend with a single command:

```bash
npm start
```

Or run them separately:

```bash
# Run just the backend
npm run start:backend

# Run just the frontend
npm run start:frontend
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Development

### Backend

The backend is a Python FastAPI application that uses Poetry for dependency management.

To activate the Poetry virtual environment:

```bash
cd packages/backend
poetry shell
```

### Frontend

The frontend is a Next.js application with TypeScript and Tailwind CSS.

To run the frontend in development mode:

```bash
cd packages/frontend
npm run dev
```

## Building for Production

To build the frontend for production:

```bash
npm run build:frontend
```

The backend can be deployed using various methods such as Gunicorn, Docker, or a WSGI server.

## License

MIT
