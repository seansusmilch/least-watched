# Database Seeding Configuration

This project uses a configuration-based approach for database seeding, allowing you to customize seed data without committing sensitive information like API keys.

## Quick Start

1. **Copy the example configuration:**
   ```bash
   cp seed-config.example.json seed-config.json
   ```

2. **Edit your configuration:**
   ```bash
   # Edit seed-config.json with your actual data
   # This file is automatically ignored by git
   ```

3. **Run the seeding:**
   ```bash
   bun run db:seed
   ```

## How It Works

- **`seed-config.example.json`** - Template file (committed to git)
- **`seed-config.json`** - Your actual config (ignored by git)
- **`scripts/seed-database.ts`** - The seeding script

If no `seed-config.json` exists, the script will use default data from the template.

## Configuration Structure

The configuration file contains 5 main sections:

### 1. Sonarr Settings
```json
{
  "sonarrSettings": [
    {
      "name": "Main Sonarr",
      "url": "http://localhost:8989",
      "apiKey": "your-actual-api-key-here",
      "enabled": true,
      "selectedFolders": ["/tv", "/media/tv"]
    }
  ]
}
```

### 2. Radarr Settings
```json
{
  "radarrSettings": [
    {
      "name": "Main Radarr",
      "url": "http://localhost:7878",
      "apiKey": "your-actual-api-key-here",
      "enabled": true,
      "selectedFolders": ["/movies", "/media/movies"]
    }
  ]
}
```

### 3. Emby Settings
```json
{
  "embySettings": [
    {
      "name": "Main Emby",
      "url": "http://localhost:8096",
      "apiKey": "your-actual-api-key-here",
      "userId": "your-user-id",
      "enabled": true,
      "selectedFolders": ["/movies", "/tv"]
    }
  ]
}
```

### 4. App Settings
```json
{
  "appSettings": [
    {
      "key": "deletion_score_threshold",
      "value": "75",
      "description": "Minimum score required for deletion consideration"
    }
  ]
}
```

### 5. Media Items
```json
{
  "mediaItems": [
    {
      "title": "The Matrix",
      "type": "movie",
      "tmdbId": 603,
      "imdbId": "tt0133093",
      "year": 1999,
      "lastWatched": "2024-01-15",
      "watchCount": 5,
      "radarrId": 1,
      "embyId": "emby-matrix-id",
      "mediaPath": "/movies/The Matrix (1999)",
      "parentFolder": "/movies",
      "sizeOnDisk": 2147483648,
      "dateAdded": "2023-06-01",
      "source": "Main Radarr",
      "quality": "Bluray-1080p",
      "qualityScore": 19,
      "monitored": true,
      "imdbRating": 8.7,
      "tmdbRating": 8.2,
      "playProgress": 100,
      "fullyWatched": true,
      "runtime": 136,
      "sizePerHour": 0.94,
      "genres": ["Action", "Sci-Fi"],
      "overview": "Movie description here..."
    }
  ]
}
```

## Data Types & Formats

- **Dates**: Use ISO string format: `"2024-01-15"`
- **File Sizes**: Use bytes as numbers: `2147483648` (for 2GB)
- **Arrays**: Use JSON arrays: `["Action", "Sci-Fi"]`
- **Booleans**: Use `true`/`false`
- **API Keys**: Use your actual API keys (they won't be committed)

## Tips

1. **Start Small**: Begin with just a few items in each section
2. **Real API Keys**: Use actual API keys for realistic testing
3. **Test Data**: Include edge cases like low-quality items for deletion testing
4. **Backup**: Keep a backup of your config file elsewhere

## Security

- ✅ `seed-config.json` is automatically ignored by git
- ✅ Only the example template is committed
- ✅ Your actual API keys stay local
- ⚠️ Don't commit `seed-config.json` to any repository

## Commands

```bash
# Seed the database
bun run db:seed

# Reset and seed (nuclear option)
bun run db:reset
bun run db:seed

# View current seed config status
cat seed-config.json   # if it exists
```

## Troubleshooting

**Error: "No seed-config.json found"**
- This is normal - copy the example file and customize it

**Error: "Invalid JSON"**
- Check your JSON syntax with a validator
- Common issues: trailing commas, unquoted strings

**Error: "Prisma validation failed"**
- Check that your data types match the database schema
- Verify required fields are present

## Advanced Usage

You can create multiple config files for different environments:
```bash
cp seed-config.json seed-config.dev.json
cp seed-config.json seed-config.testing.json
```

Then manually copy them as needed:
```bash
cp seed-config.dev.json seed-config.json
bun run db:seed
``` 