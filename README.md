# Least-Watched

A Python tool to identify unwatched or least-watched media from your Emby server, with integration to Sonarr and Radarr.

## Features

- Identifies media that hasn't been watched for a configurable period
- Ignores recently added content
- Integrates with Emby, Sonarr, and Radarr
- Configurable batch processing and concurrency limits

## Requirements

- Python 3.12+
- Poetry (dependency management)
- Emby server
- Sonarr and Radarr

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/least-watched.git
   cd least-watched
   ```

2. Install Poetry if you don't have it already:
   ```bash
   # Windows (PowerShell)
   (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -

   # macOS/Linux
   curl -sSL https://install.python-poetry.org | python3 -
   ```

3. Install dependencies using Poetry:
   ```bash
   poetry install
   ```

## Configuration

Create a `.env` file in the root directory with the following variables:

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

## Usage

Run the application using Poetry:

```bash
poetry run python -m src.main
```

## Development

This project uses Poetry for dependency management with virtual environments. The configuration in `poetry.toml` ensures that the virtual environment is created within the project directory.

To activate the virtual environment:

```bash
poetry shell
```

To add new dependencies:

```bash
poetry add package-name
```

## License

[MIT License](LICENSE)
