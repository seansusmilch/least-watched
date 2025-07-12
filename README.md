# Least Watched

A Next.js application for managing and tracking your least-watched media across Sonarr, Radarr, and Emby. This tool helps you identify content that hasn't been watched so you can make informed decisions about what to keep or remove.

## Features

- **Multi-instance Support**: Connect to multiple Sonarr, Radarr, and Emby instances
- **Media Tracking**: Track watched/unwatched status and play progress
- **Smart Scoring**: Calculate deletion priority scores based on various factors
- **Settings Management**: Centralized configuration for all your media services
- **Database-driven**: SQLite database with Prisma ORM for reliable data storage
- **Modern UI**: Built with Next.js, Tailwind CSS, and Radix UI components

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Bun](https://bun.sh/) (latest version)
- Access to Sonarr, Radarr, and/or Emby instances with API access

## Installation

1. **Clone the repository:**
   ```powershell
   git clone <repository-url>
   cd least-watched
   ```

2. **Install dependencies:**
   ```powershell
   bun install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```bash
   DATABASE_URL="file:./dev.db"
   ```

4. **Initialize the database:**
   ```powershell
   bunx prisma migrate dev --name init
   bunx prisma generate
   ```

## Database Setup

The application uses SQLite with Prisma for data management. The database stores:

- **Settings**: Configuration for Sonarr, Radarr, and Emby instances
- **Media Items**: Metadata for tracking watched/unwatched content
- **App Settings**: General application preferences

### Database Commands

```powershell
# Generate Prisma client
bunx prisma generate

# Create new migration
bunx prisma migrate dev --name migration_name

# Reset database (development only)
bunx prisma migrate reset

# View database in browser
bunx prisma studio
```

For detailed database information, see [DATABASE_SETUP.md](DATABASE_SETUP.md).

## Configuration

### 1. Start the Development Server

```powershell
bun dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### 2. Configure Your Services

1. Navigate to the **Settings** page
2. Add your Sonarr, Radarr, and Emby instances:
   - **Name**: A descriptive name for the instance
   - **URL**: The base URL of your service (e.g., `http://localhost:8989`)
   - **API Key**: Your service's API key
   - **User ID**: (Emby only) Your Emby user ID

### 3. Test Connections

Use the built-in connection testing to verify your configurations work correctly.

## Usage

### Scanning Media

1. Go to the **Scan** page
2. Select which services to scan
3. The application will fetch media data and calculate watch statistics
4. Review the results on the **Least Watched** page

### Managing Settings

- **Multiple Instances**: Add multiple instances of each service
- **Enable/Disable**: Toggle instances on/off without deleting them
- **Batch Operations**: Configure multiple services at once

## Development

### Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── least-watched/     # Main media view
│   ├── scan/             # Media scanning page
│   └── settings/         # Settings management
├── components/           # React components
│   ├── settings/         # Settings-specific components
│   └── ui/              # Reusable UI components
├── lib/                 # Core utilities
│   ├── actions/         # Server actions
│   ├── database.ts      # Database services
│   ├── media-processor.ts # Media processing logic
│   └── api.ts          # API client
└── hooks/              # Custom React hooks
```

### Available Scripts

```powershell
# Development server with Turbopack
bun dev

# Production build
bun run build

# Start production server
bun start

# Run linter
bun run lint

# Database CLI tool
bun run scripts/db-cli.ts
```

### Testing Database

Test your database setup:

```powershell
bun run --bun src/lib/test-database.ts
```

This will verify database connectivity and run basic CRUD operations.

## API Integration

The application integrates with:

- **Sonarr API**: For TV show management
- **Radarr API**: For movie management  
- **Emby API**: For watch status and user data

All API keys are stored securely in the database and never exposed to the client.

## Security Notes

- **Read-Only**: The application only reads data from your services
- **No Modifications**: It will never modify, delete, or add content to Sonarr, Radarr, or Emby
- **Local Database**: All data is stored locally in SQLite
- **API Key Protection**: API keys are server-side only

## Troubleshooting

### Database Issues

1. **Migration Errors**: Reset the database with `bunx prisma migrate reset`
2. **Connection Issues**: Verify your `DATABASE_URL` in `.env`
3. **Missing Tables**: Run `bunx prisma migrate dev`

### Service Connection Issues

1. **Invalid API Keys**: Verify your API keys in the service settings
2. **Network Issues**: Ensure the URLs are accessible from your server
3. **CORS Errors**: Make sure your services allow requests from your Next.js app

### Performance Issues

1. **Large Libraries**: Consider implementing pagination for large media libraries
2. **Slow Scans**: Media scanning can take time with large libraries
3. **Database Performance**: SQLite is suitable for most use cases, but consider PostgreSQL for very large datasets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the [DATABASE_SETUP.md](DATABASE_SETUP.md) for database-specific issues
3. Create an issue in the repository
