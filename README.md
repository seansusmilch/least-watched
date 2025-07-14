# Least Watched

A Next.js application for managing and tracking your least-watched media across Sonarr, Radarr, and Emby. This tool helps you identify content that hasn't been watched and provides intelligent deletion scoring to make informed decisions about what to keep or remove.

## Features

- **Multi-instance Support**: Connect to multiple Sonarr, Radarr, and Emby instances
- **Folder Space Monitoring**: Track disk usage and free space across your media folders
- **Smart Deletion Scoring**: Calculate deletion priority scores based on multiple configurable factors
- **Media Processing**: Automated media scanning and data aggregation
- **Advanced Filtering**: Filter media by genre, quality, source, folder, and more
- **Settings Management**: Centralized configuration for all your media services
- **Database Seeding**: Pre-populate your database with test data using configuration files
- **Database-driven**: SQLite database with Prisma ORM for reliable data storage
- **Modern UI**: Built with Next.js 15, React 19, Tailwind CSS, and Radix UI components

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
   bun run db:generate
   bun run db:push
   ```

5. **Optional: Seed the database with test data:**
   ```powershell
   # Copy and edit the seed configuration
   cp seed-config.example.json seed-config.json
   # Edit seed-config.json with your actual API keys and settings
   bun run db:seed
   ```

## Database Setup

The application uses SQLite with Prisma for data management. The database stores:

- **Settings**: Configuration for Sonarr, Radarr, and Emby instances
- **Media Items**: Comprehensive metadata for tracking watched/unwatched content
- **App Settings**: Deletion scoring parameters and general application preferences

### Database Commands

```powershell
# Generate Prisma client
bun run db:generate

# Push schema changes to database
bun run db:push

# Deploy migrations (production)
bun run db:migrate

# Reset database (development only)
bun run db:reset

# Seed database with test data
bun run db:seed

# View database in browser
bunx prisma studio
```

For detailed database information, see [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md).

## Configuration

### 1. Start the Development Server

```powershell
bun dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### 2. Configure Your Services

1. Navigate to the **Settings** page
2. Configure your media services in the **Media Services** tab:
   - **Sonarr/Radarr**: Add instances with name, URL, API key, and select folders
   - **Emby**: Add instances with name, URL, API key, and User ID
3. Configure **Deletion Scoring** in the second tab:
   - Adjust scoring weights for different factors
   - Set thresholds for days unwatched, file size, folder space, etc.

### 3. Process Media

1. On the main page, click **Process Media** to scan all configured services
2. The application will fetch media data and calculate deletion scores
3. Use the filters to find media that meets your criteria for removal

## Usage

### Main Dashboard

The main page displays:
- **Processing Progress**: Real-time updates during media scanning
- **Folder Space Widget**: Disk usage for all configured folders
- **Summary Cards**: Overview statistics of your media library
- **Media Table**: Sortable and filterable list of all media items

### Settings Management

#### Media Services Tab
- **Multiple Instances**: Add multiple instances of each service type
- **Folder Selection**: Choose which folders to monitor from each service
- **Enable/Disable**: Toggle instances on/off without deleting configuration
- **Connection Testing**: Verify your configurations work correctly

#### Deletion Scoring Tab
- **Configurable Weights**: Adjust importance of different scoring factors
- **Factor Controls**: Enable/disable specific scoring criteria
- **Real-time Preview**: See how changes affect scoring immediately

### Database Management

Use the CLI tool for database operations:

```powershell
# Check database status
bun run scripts/db-cli.ts status

# List all settings
bun run scripts/db-cli.ts list

# Add services interactively
bun run scripts/db-cli.ts add-sonarr
bun run scripts/db-cli.ts add-radarr
bun run scripts/db-cli.ts add-emby

# Test service connections
bun run scripts/db-cli.ts test sonarr <instance-id>
```

## Development

### Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── layout.tsx         # Root layout with theme provider
│   ├── page.tsx           # Main dashboard (Least Watched)
│   └── settings/          # Settings management page
├── components/            # React components
│   ├── folder-space/      # Folder space monitoring components
│   ├── media/             # Media table, filters, and processing
│   ├── settings/          # Settings configuration components
│   └── ui/               # Reusable UI components (Radix-based)
├── lib/                  # Core utilities and business logic
│   ├── actions/          # Server actions for database operations
│   ├── cache/            # Data caching layer
│   ├── services/         # External API integration services
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions and helpers
├── hooks/                # Custom React hooks
└── generated/            # Generated Prisma client
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

# Database operations
bun run db:generate     # Generate Prisma client
bun run db:push         # Push schema to database
bun run db:migrate      # Deploy migrations
bun run db:reset        # Reset database
bun run db:seed         # Seed with test data

# Database CLI tool
bun run scripts/db-cli.ts <command>
```

## API Integration

The application integrates with:

- **Sonarr API**: For TV show metadata and folder information
- **Radarr API**: For movie metadata and folder information
- **Emby API**: For watch status, user data, and playback progress

All API communications use server actions for type safety and performance. API keys are stored securely in the database and never exposed to the client.

## Deletion Scoring System

The application calculates deletion scores based on multiple configurable factors:

- **Days Unwatched**: Higher scores for content not watched recently
- **Never Watched**: Bonus points for completely unwatched content
- **File Size**: Larger files get higher scores to save more space
- **Age Since Added**: Older content gets higher scores
- **Folder Space**: Content in low-space folders gets priority

All scoring factors are configurable in the settings with adjustable weights and thresholds.

## Seeding Configuration

The application supports configuration-based database seeding for testing:

1. **Copy the example config**: `cp seed-config.example.json seed-config.json`
2. **Edit with your data**: Update API keys, URLs, and test data
3. **Run seeding**: `bun run db:seed`

The `seed-config.json` file is automatically ignored by git to protect your API keys.

For details, see [docs/SEED_CONFIG_README.md](docs/SEED_CONFIG_README.md).

## Security Notes

- **Read-Only**: The application only reads data from your services
- **No Modifications**: It will never modify, delete, or add content to Sonarr, Radarr, or Emby
- **Local Database**: All data is stored locally in SQLite
- **API Key Protection**: API keys are server-side only and never sent to the client
- **Server Actions**: All database operations use type-safe server actions

## Troubleshooting

### Database Issues

1. **Migration Errors**: Reset the database with `bun run db:reset`
2. **Connection Issues**: Verify your `DATABASE_URL` in `.env`
3. **Missing Tables**: Run `bun run db:push` to sync schema
4. **Prisma Client Issues**: Run `bun run db:generate` to regenerate client

### Service Connection Issues

1. **Invalid API Keys**: Verify your API keys in the service settings
2. **Network Issues**: Ensure the URLs are accessible from your server
3. **CORS Errors**: Check that your services allow requests from your Next.js app
4. **Folder Access**: Verify that selected folders exist and are accessible

### Performance Issues

1. **Large Libraries**: Use filters to narrow down results
2. **Slow Processing**: Media processing can take time with large libraries
3. **Database Performance**: SQLite is suitable for most use cases
4. **Memory Usage**: Consider increasing Node.js memory limits for very large datasets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with `bun dev`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the database documentation in [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md)
3. Check the seeding configuration guide in [docs/SEED_CONFIG_README.md](docs/SEED_CONFIG_README.md)
4. Create an issue in the repository with detailed information about your problem
