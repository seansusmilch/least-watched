# Event System Requirements

This document describes the requirements for the application's event logging system, which provides visibility into application activities including media processing, user actions, and API interactions.

---

## 1. Event Data Model

### 1.1 Event Structure
Each event must contain the following attributes:
- **ID**: Unique identifier (CUID format)
- **Timestamp**: Date and time when the event occurred (auto-generated on creation)
- **Level**: Severity level of the event
- **Component**: Source/origin of the event within the application
- **Message**: Human-readable description of the event

### 1.2 Event Levels
The system must support three severity levels:
- **Info**: General informational messages about normal operations
- **Warning**: Notable situations that may require attention but are not errors
- **Error**: Failures or exceptional conditions that prevented an operation

### 1.3 Event Components
Events must be categorized by their source component. Predefined components include:
- `media-processor`: Events from the media processing system
- `user-action`: Events triggered by user interactions (e.g., deletions)
- `sonarr-api`: Events related to Sonarr API interactions
- `radarr-api`: Events related to Radarr API interactions
- `emby-api`: Events related to Emby API interactions
- `system`: General system events

Custom component names may also be used when logging events.

---

## 2. Event Storage and Retention

### 2.1 Database Storage
- Events must be persisted in the database with indexes on `timestamp`, `component`, and `level` fields for performant queries.

### 2.2 Automatic Pruning
- The system must enforce a maximum event count limit (configurable, default: 10,000 events).
- When the limit is exceeded, the oldest events must be automatically deleted to maintain the limit.
- Pruning occurs asynchronously after each new event is logged to avoid blocking.

### 2.3 Manual Clearing
- Users must be able to manually clear all events from the system.
- A confirmation dialog must be displayed before clearing to prevent accidental data loss.

---

## 3. Event Logging

### 3.1 Logging Interface
The system must provide convenience methods for logging events at each severity level:
- `logInfo(component, message)`: Log an informational event
- `logWarning(component, message)`: Log a warning event
- `logError(component, message)`: Log an error event
- `logEvent(level, component, message)`: Log an event with explicit level

### 3.2 Integrated Logging Points
Events must be automatically logged for the following application activities:

#### Media Processing
- When media processing starts
- When media processing completes (including statistics: items processed, time taken, arr matches, playback data found)
- When no enabled Emby instance is found (warning)
- When an error occurs processing an individual media item

#### User Delete Actions
- When a Radarr movie is successfully deleted
- When a Radarr movie deletion fails
- When a Sonarr series is successfully deleted
- When a Sonarr series deletion fails
- When a bulk delete operation completes (summary with counts)
- When a bulk delete operation fails entirely

---

## 4. Events Page

### 4.1 Navigation
- The Events page must be accessible from the main navigation sidebar.
- The navigation item must display a "ScrollText" icon and be positioned between "Least Watched" and "Settings".

### 4.2 Page Header
- Display the page title "Events Log" with an icon.
- Show the total event count as a badge when events exist.

### 4.3 Filtering and Search

#### Search
- Provide a search input field for filtering events by message text or component name.
- Search must be debounced (300ms delay) to avoid excessive queries while typing.
- Search must match against both the `message` and `component` fields.
- Changing search criteria must reset pagination to page 1.

#### Component Filter
- Provide a dropdown to filter events by component.
- The dropdown must dynamically populate with all unique component values from existing events.
- Include an "All Components" option to show events from all components.
- Changing the filter must reset pagination to page 1.

#### Level Filter
- Provide a dropdown to filter events by severity level.
- Options: "All Levels", "Info", "Warning", "Error".
- Changing the filter must reset pagination to page 1.

#### Filter Combinations
- All filters (search, component, level) must work in combination (AND logic).

### 4.4 Event Table

#### Columns
The table must display the following columns:
1. **Timestamp**: Displayed as relative time (e.g., "5 minutes ago") with full datetime shown on hover.
2. **Level**: Displayed as a color-coded badge with icon:
   - Info: Default/primary color with info icon
   - Warning: Secondary color with warning triangle icon
   - Error: Destructive/red color with X-circle icon
3. **Component**: Displayed as an outlined badge with monospace font.
4. **Message**: Displayed with text truncation; full message shown on hover.

#### Sorting
- Events must be displayed in reverse chronological order (newest first).

#### Empty States
- When no events exist: Display "No events logged yet".
- When filters return no results: Display "No events match your filters".

#### Loading State
- Display a spinning loader while events are being fetched.

### 4.5 Pagination

#### Configuration
- Page size must be configurable (default: 100 events per page).
- Page size is defined in the application constants file.

#### Controls
- Display "Previous" and "Next" buttons for navigation.
- Display current page number and total pages (e.g., "Page 1 of 5").
- Previous button must be disabled on the first page.
- Next button must be disabled on the last page.
- Both buttons must be disabled while data is being fetched.
- Pagination controls must only be visible when there are multiple pages.

### 4.6 Actions

#### Refresh
- Provide a refresh button to manually reload the events list.
- The button must show a spinning animation while data is being fetched.
- Refresh must also update the component filter dropdown values.

#### Clear All
- Provide a "Clear All" button to delete all events.
- The button must be disabled when no events exist.
- Clicking must open a confirmation dialog showing the total count of events to be deleted.
- After successful clearing, display a success toast with the count of deleted events.
- After clearing, reset to page 1 and refresh the events list and component dropdown.

### 4.7 Data Caching
- Event data must be cached with a stale time of 30 seconds.
- Component list must be cached with a stale time of 60 seconds.

---

## 5. Configuration

### 5.1 Configurable Constants
The following values must be configurable via the constants file:
- **EVENTS_PAGE_SIZE**: Number of events displayed per page (default: 100)
- **EVENTS_MAX_COUNT**: Maximum number of events to retain before auto-pruning (default: 10,000)

---

## 6. Error Handling

### 6.1 Graceful Degradation
- If fetching events fails, return an empty result set rather than throwing an error.
- If fetching component list fails, return an empty array.
- If clearing events fails, display an error toast to the user.
- Event logging failures must not block or crash the calling operation; errors are logged to the console.

### 6.2 Pruning Failures
- If automatic pruning fails, the error must be logged to the console but not affect the event that triggered the pruning.

---

## 7. Performance Requirements

### 7.1 Database Indexes
- Indexes must exist on `timestamp`, `component`, and `level` fields to ensure performant filtering and sorting.

### 7.2 Search Performance
- Search must use database-level filtering (not client-side) to handle large event counts efficiently.
- Debounced search input prevents excessive database queries.

### 7.3 Pagination
- Server-side pagination ensures only the requested page of events is transferred and rendered.
