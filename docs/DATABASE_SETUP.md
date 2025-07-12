# Database Setup with SQLite, Prisma, and Server Actions

This document outlines the database implementation for storing Sonarr, Radarr, and Emby configuration settings.

## ✅ What's Implemented

### 1. Database Schema (`prisma/schema.prisma`)
- **SonarrSettings**: Store multiple Sonarr instance configurations
- **RadarrSettings**: Store multiple Radarr instance configurations  
- **EmbySettings**: Store multiple Emby instance configurations
- **AppSettings**: Store general application settings as key-value pairs
- **MediaItem**: Store media metadata for tracking watched/unwatched items

### 2. Database Services (`src/lib/database.ts`)
- **Prisma Client**: Singleton pattern for database connections
- **Service Layer**: CRUD operations for each settings type
- **Helper Functions**: Database health checks and connection management

### 3. Server Actions (`src/lib/actions/settings.ts`)
- **Type-safe**: Full TypeScript support with proper typing
- **CRUD Operations**: Create, Read, Update, Delete for all settings
- **Connection Testing**: Test API connections for each service
- **Form Actions**: Ready-to-use form handlers for React components
- **Auto-revalidation**: Automatic cache revalidation after changes

### 4. Updated API Layer (`src/lib/api.ts`)
- **Multi-instance Support**: Support for multiple Sonarr/Radarr/Emby instances
- **Database Integration**: Loads configuration from database instead of hardcoded values
- **Singleton Pattern**: Efficient connection management

## 🎯 Key Benefits of Using Server Actions

Instead of API routes, we chose server actions for:

1. **Type Safety**: Direct TypeScript integration without manual type definitions
2. **Better Performance**: No HTTP overhead, direct function calls
3. **Simpler Code**: No need for separate route files and manual request/response handling
4. **Form Integration**: Can be called directly from forms and client components
5. **Better DX**: Easier to test and maintain

## 📁 File Structure

```
src/
├── lib/
│   ├── database.ts           # Database services & Prisma client
│   ├── api.ts               # Updated API layer with database integration
│   ├── actions/
│   │   └── settings.ts      # Server actions for all settings CRUD
│   └── test-database.ts     # Database test utilities
├── generated/
│   └── prisma/             # Generated Prisma client
└── prisma/
    ├── schema.prisma       # Database schema
    └── migrations/         # Database migrations
```

## 🚀 Usage Examples

### Using Server Actions in Components

```tsx
import { createSonarrSetting, getSonarrSettings } from '@/lib/actions/settings'

export default function SonarrSettingsForm() {
  const handleSubmit = async (formData: FormData) => {
    const result = await createSonarrSetting({
      name: formData.get('name') as string,
      url: formData.get('url') as string,
      apiKey: formData.get('apiKey') as string,
      enabled: true
    })
    
    if (result.success) {
      // Handle success
    } else {
      // Handle error
    }
  }
  
  return (
    <form action={handleSubmit}>
      <input name="name" placeholder="Configuration Name" required />
      <input name="url" placeholder="http://localhost:8989" required />
      <input name="apiKey" placeholder="API Key" required />
      <button type="submit">Add Sonarr Instance</button>
    </form>
  )
}
```

### Using with React Hook Form

```tsx
import { createSonarrSetting, type SonarrSettingsInput } from '@/lib/actions/settings'
import { useForm } from 'react-hook-form'

export default function SonarrForm() {
  const form = useForm<SonarrSettingsInput>()
  
  const onSubmit = async (data: SonarrSettingsInput) => {
    const result = await createSonarrSetting(data)
    // Handle result
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

### Testing Database Connection

```typescript
import { testDatabase } from '@/lib/test-database'

// Run the test
await testDatabase()
```

## 🔧 Environment Variables

Make sure you have the following in your `.env` file:

```bash
DATABASE_URL="file:./dev.db"
```

## 📊 Database Schema Features

- **CUID IDs**: Collision-resistant unique identifiers
- **Timestamps**: Automatic created/updated timestamps
- **Soft Constraints**: Unique names per service type
- **Flexible**: Support for multiple instances of each service
- **Extensible**: Easy to add new service types

## 🧪 Testing

Run the database test to verify everything is working:

```bash
bun run --bun src/lib/test-database.ts
```

This will:
- Test database connection
- Create sample settings for each service
- Verify CRUD operations
- Clean up test data
- Verify database health

## 🔄 Migration Commands

```bash
# Create new migration
bunx prisma migrate dev --name migration_name

# Generate Prisma client
bunx prisma generate

# Reset database (development only)
bunx prisma migrate reset

# View database in browser
bunx prisma studio
```

## 📈 Next Steps

1. **UI Components**: Create React components that use these server actions
2. **Validation**: Add form validation with libraries like Zod
3. **Error Handling**: Implement proper error handling UI
4. **Settings Import/Export**: Add backup/restore functionality
5. **Multiple Users**: Add user authentication and user-specific settings 