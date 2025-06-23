## 🚀 Implementation Plan for Scan Page

### **Phase 1: Type Definitions & API Setup**
1. **Create scan-related types** (`/src/types/scan.ts`):
   ```typescript
   interface ScanProgress {
     total_items: number;
     processed_items: number;
     percent_complete: number;
     current_item: string;
     unwatched_found: number;
   }
   
   interface ScanStatus {
     scan_in_progress: boolean;
     scan_complete: boolean;
     progress: ScanProgress;
     results?: {
       total_count: number;
       total_size: number;
     };
   }
   
   interface ScanSettings {
     days_threshold: number;
     ignore_newer_than_days: number;
     concurrent_limit: number;
     batch_size: number;
   }
   ```

2. **Extend API functions** in `api.ts`:
   - `startScan(settings: ScanSettings)`
   - `getScanProgress()` 
   - Query keys for scan operations

### **Phase 2: Context Setup**
3. **Create ScanContext** (`/src/context/ScanContext.tsx`):
   - Manage scan state globally
   - Provide scan actions (start, stop, reset)
   - Handle real-time progress polling
   - Use TanStack Query for data fetching

### **Phase 3: Component Architecture**
4. **ScanSettingsForm** component:
   - Form with scan parameters (days threshold, concurrent limit, etc.)
   - Load current config as default values
   - Validation and submission handling

5. **ScanProgressDisplay** component:
   - Live progress bar
   - Current file being scanned
   - Items processed counter
   - Unwatched items found counter

6. **ScanResults** component:
   - Summary of scan results
   - Total items and size found
   - "View Results" button to navigate to media page

7. **ScanControls** component:
   - Start/Stop scan button
   - Reset scan state
   - Handle different scan states (idle, running, complete)

### **Phase 4: Real-time Updates**
8. **Polling Strategy**:
   - Use TanStack Query's `refetchInterval` for progress polling
   - Poll every 1 second during active scan
   - Stop polling when scan completes
   - Handle connection errors gracefully

### **Phase 5: Integration**
9. **Update scan.tsx**:
   - Wrap in ScanContext provider
   - Compose all components
   - Handle routing and navigation
   - Error boundaries for robustness
