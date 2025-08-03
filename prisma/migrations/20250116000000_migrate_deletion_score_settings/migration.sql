-- Migration: Migrate deletion score settings from JSON to flattened format
-- This migration converts the old 'deletionScoreSettings' JSON blob into individual key-value pairs
-- Step 1: Extract and insert flattened settings from existing JSON
-- We'll use JSON functions to parse the existing settings and create new rows
-- First, let's create the flattened settings from the existing JSON
INSERT
    OR REPLACE INTO app_settings (
        id,
        key,
        value,
        description,
        createdAt,
        updatedAt
    )
SELECT 'migrated_' || substr(hex(randomblob(16)), 1, 24) as id,
    'deletion_score.enabled' as key,
    CASE
        WHEN json_extract(value, '$.enabled') IS NOT NULL THEN json_extract(value, '$.enabled')
        ELSE 'true'
    END as value,
    'Enable deletion scoring' as description,
    datetime('now') as createdAt,
    datetime('now') as updatedAt
FROM app_settings
WHERE key = 'deletionScoreSettings'
    AND value IS NOT NULL;
-- Days unwatched settings
INSERT
    OR REPLACE INTO app_settings (
        id,
        key,
        value,
        description,
        createdAt,
        updatedAt
    )
SELECT 'migrated_' || substr(hex(randomblob(16)), 1, 24) as id,
    'deletion_score.days_unwatched.enabled' as key,
    CASE
        WHEN json_extract(value, '$.daysUnwatchedEnabled') IS NOT NULL THEN json_extract(value, '$.daysUnwatchedEnabled')
        ELSE 'true'
    END as value,
    'Enable days unwatched factor' as description,
    datetime('now') as createdAt,
    datetime('now') as updatedAt
FROM app_settings
WHERE key = 'deletionScoreSettings'
    AND value IS NOT NULL;
INSERT
    OR REPLACE INTO app_settings (
        id,
        key,
        value,
        description,
        createdAt,
        updatedAt
    )
SELECT 'migrated_' || substr(hex(randomblob(16)), 1, 24) as id,
    'deletion_score.days_unwatched.max_points' as key,
    CASE
        WHEN json_extract(value, '$.daysUnwatchedMaxPoints') IS NOT NULL THEN json_extract(value, '$.daysUnwatchedMaxPoints')
        ELSE '30'
    END as value,
    'Days unwatched max points' as description,
    datetime('now') as createdAt,
    datetime('now') as updatedAt
FROM app_settings
WHERE key = 'deletionScoreSettings'
    AND value IS NOT NULL;
INSERT
    OR REPLACE INTO app_settings (
        id,
        key,
        value,
        description,
        createdAt,
        updatedAt
    )
SELECT 'migrated_' || substr(hex(randomblob(16)), 1, 24) as id,
    'deletion_score.days_unwatched.breakpoints' as key,
    CASE
        WHEN json_extract(value, '$.daysUnwatchedBreakpoints') IS NOT NULL THEN json_extract(value, '$.daysUnwatchedBreakpoints')
        ELSE '[{"value":30,"percent":0},{"value":90,"percent":17},{"value":180,"percent":50},{"value":365,"percent":73},{"value":366,"percent":100}]'
    END as value,
    'Days unwatched breakpoints' as description,
    datetime('now') as createdAt,
    datetime('now') as updatedAt
FROM app_settings
WHERE key = 'deletionScoreSettings'
    AND value IS NOT NULL;
-- Never watched settings
INSERT
    OR REPLACE INTO app_settings (
        id,
        key,
        value,
        description,
        createdAt,
        updatedAt
    )
SELECT 'migrated_' || substr(hex(randomblob(16)), 1, 24) as id,
    'deletion_score.never_watched.enabled' as key,
    CASE
        WHEN json_extract(value, '$.neverWatchedEnabled') IS NOT NULL THEN json_extract(value, '$.neverWatchedEnabled')
        ELSE 'true'
    END as value,
    'Enable never watched bonus' as description,
    datetime('now') as createdAt,
    datetime('now') as updatedAt
FROM app_settings
WHERE key = 'deletionScoreSettings'
    AND value IS NOT NULL;
INSERT
    OR REPLACE INTO app_settings (
        id,
        key,
        value,
        description,
        createdAt,
        updatedAt
    )
SELECT 'migrated_' || substr(hex(randomblob(16)), 1, 24) as id,
    'deletion_score.never_watched.points' as key,
    CASE
        WHEN json_extract(value, '$.neverWatchedPoints') IS NOT NULL THEN json_extract(value, '$.neverWatchedPoints')
        ELSE '20'
    END as value,
    'Never watched bonus points' as description,
    datetime('now') as createdAt,
    datetime('now') as updatedAt
FROM app_settings
WHERE key = 'deletionScoreSettings'
    AND value IS NOT NULL;
-- Size on disk settings
INSERT
    OR REPLACE INTO app_settings (
        id,
        key,
        value,
        description,
        createdAt,
        updatedAt
    )
SELECT 'migrated_' || substr(hex(randomblob(16)), 1, 24) as id,
    'deletion_score.size_on_disk.enabled' as key,
    CASE
        WHEN json_extract(value, '$.sizeOnDiskEnabled') IS NOT NULL THEN json_extract(value, '$.sizeOnDiskEnabled')
        ELSE 'true'
    END as value,
    'Enable size on disk factor' as description,
    datetime('now') as createdAt,
    datetime('now') as updatedAt
FROM app_settings
WHERE key = 'deletionScoreSettings'
    AND value IS NOT NULL;
INSERT
    OR REPLACE INTO app_settings (
        id,
        key,
        value,
        description,
        createdAt,
        updatedAt
    )
SELECT 'migrated_' || substr(hex(randomblob(16)), 1, 24) as id,
    'deletion_score.size_on_disk.max_points' as key,
    CASE
        WHEN json_extract(value, '$.sizeOnDiskMaxPoints') IS NOT NULL THEN json_extract(value, '$.sizeOnDiskMaxPoints')
        ELSE '35'
    END as value,
    'Size on disk max points' as description,
    datetime('now') as createdAt,
    datetime('now') as updatedAt
FROM app_settings
WHERE key = 'deletionScoreSettings'
    AND value IS NOT NULL;
INSERT
    OR REPLACE INTO app_settings (
        id,
        key,
        value,
        description,
        createdAt,
        updatedAt
    )
SELECT 'migrated_' || substr(hex(randomblob(16)), 1, 24) as id,
    'deletion_score.size_on_disk.breakpoints' as key,
    CASE
        WHEN json_extract(value, '$.sizeOnDiskBreakpoints') IS NOT NULL THEN json_extract(value, '$.sizeOnDiskBreakpoints')
        ELSE '[{"value":1,"percent":0},{"value":5,"percent":0},{"value":10,"percent":29},{"value":20,"percent":43},{"value":50,"percent":71},{"value":51,"percent":100}]'
    END as value,
    'Size on disk breakpoints' as description,
    datetime('now') as createdAt,
    datetime('now') as updatedAt
FROM app_settings
WHERE key = 'deletionScoreSettings'
    AND value IS NOT NULL;
-- Age since added settings
INSERT
    OR REPLACE INTO app_settings (
        id,
        key,
        value,
        description,
        createdAt,
        updatedAt
    )
SELECT 'migrated_' || substr(hex(randomblob(16)), 1, 24) as id,
    'deletion_score.age_since_added.enabled' as key,
    CASE
        WHEN json_extract(value, '$.ageSinceAddedEnabled') IS NOT NULL THEN json_extract(value, '$.ageSinceAddedEnabled')
        ELSE 'true'
    END as value,
    'Enable age since added factor' as description,
    datetime('now') as createdAt,
    datetime('now') as updatedAt
FROM app_settings
WHERE key = 'deletionScoreSettings'
    AND value IS NOT NULL;
INSERT
    OR REPLACE INTO app_settings (
        id,
        key,
        value,
        description,
        createdAt,
        updatedAt
    )
SELECT 'migrated_' || substr(hex(randomblob(16)), 1, 24) as id,
    'deletion_score.age_since_added.max_points' as key,
    CASE
        WHEN json_extract(value, '$.ageSinceAddedMaxPoints') IS NOT NULL THEN json_extract(value, '$.ageSinceAddedMaxPoints')
        ELSE '15'
    END as value,
    'Age since added max points' as description,
    datetime('now') as createdAt,
    datetime('now') as updatedAt
FROM app_settings
WHERE key = 'deletionScoreSettings'
    AND value IS NOT NULL;
INSERT
    OR REPLACE INTO app_settings (
        id,
        key,
        value,
        description,
        createdAt,
        updatedAt
    )
SELECT 'migrated_' || substr(hex(randomblob(16)), 1, 24) as id,
    'deletion_score.age_since_added.breakpoints' as key,
    CASE
        WHEN json_extract(value, '$.ageSinceAddedBreakpoints') IS NOT NULL THEN json_extract(value, '$.ageSinceAddedBreakpoints')
        ELSE '[{"value":180,"percent":33},{"value":365,"percent":67},{"value":730,"percent":100}]'
    END as value,
    'Age since added breakpoints' as description,
    datetime('now') as createdAt,
    datetime('now') as updatedAt
FROM app_settings
WHERE key = 'deletionScoreSettings'
    AND value IS NOT NULL;
-- Folder space settings
INSERT
    OR REPLACE INTO app_settings (
        id,
        key,
        value,
        description,
        createdAt,
        updatedAt
    )
SELECT 'migrated_' || substr(hex(randomblob(16)), 1, 24) as id,
    'deletion_score.folder_space.enabled' as key,
    CASE
        WHEN json_extract(value, '$.folderSpaceEnabled') IS NOT NULL THEN json_extract(value, '$.folderSpaceEnabled')
        ELSE 'false'
    END as value,
    'Enable folder space factor' as description,
    datetime('now') as createdAt,
    datetime('now') as updatedAt
FROM app_settings
WHERE key = 'deletionScoreSettings'
    AND value IS NOT NULL;
INSERT
    OR REPLACE INTO app_settings (
        id,
        key,
        value,
        description,
        createdAt,
        updatedAt
    )
SELECT 'migrated_' || substr(hex(randomblob(16)), 1, 24) as id,
    'deletion_score.folder_space.max_points' as key,
    CASE
        WHEN json_extract(value, '$.folderSpaceMaxPoints') IS NOT NULL THEN json_extract(value, '$.folderSpaceMaxPoints')
        ELSE '10'
    END as value,
    'Folder space max points' as description,
    datetime('now') as createdAt,
    datetime('now') as updatedAt
FROM app_settings
WHERE key = 'deletionScoreSettings'
    AND value IS NOT NULL;
INSERT
    OR REPLACE INTO app_settings (
        id,
        key,
        value,
        description,
        createdAt,
        updatedAt
    )
SELECT 'migrated_' || substr(hex(randomblob(16)), 1, 24) as id,
    'deletion_score.folder_space.breakpoints' as key,
    CASE
        WHEN json_extract(value, '$.folderSpaceBreakpoints') IS NOT NULL THEN json_extract(value, '$.folderSpaceBreakpoints')
        ELSE '[{"value":10,"percent":100},{"value":20,"percent":80},{"value":30,"percent":60},{"value":50,"percent":30}]'
    END as value,
    'Folder space breakpoints' as description,
    datetime('now') as createdAt,
    datetime('now') as updatedAt
FROM app_settings
WHERE key = 'deletionScoreSettings'
    AND value IS NOT NULL;
-- Step 2: Create default settings if no existing settings were found
-- This ensures we always have the flattened format available
INSERT
    OR IGNORE INTO app_settings (
        id,
        key,
        value,
        description,
        createdAt,
        updatedAt
    )
VALUES (
        'default_' || substr(hex(randomblob(16)), 1, 24),
        'deletion_score.enabled',
        'true',
        'Enable deletion scoring',
        datetime('now'),
        datetime('now')
    ),
    (
        'default_' || substr(hex(randomblob(16)), 1, 24),
        'deletion_score.days_unwatched.enabled',
        'true',
        'Enable days unwatched factor',
        datetime('now'),
        datetime('now')
    ),
    (
        'default_' || substr(hex(randomblob(16)), 1, 24),
        'deletion_score.days_unwatched.max_points',
        '30',
        'Days unwatched max points',
        datetime('now'),
        datetime('now')
    ),
    (
        'default_' || substr(hex(randomblob(16)), 1, 24),
        'deletion_score.days_unwatched.breakpoints',
        '[{"value":30,"percent":0},{"value":90,"percent":17},{"value":180,"percent":50},{"value":365,"percent":73},{"value":366,"percent":100}]',
        'Days unwatched breakpoints',
        datetime('now'),
        datetime('now')
    ),
    (
        'default_' || substr(hex(randomblob(16)), 1, 24),
        'deletion_score.never_watched.enabled',
        'true',
        'Enable never watched bonus',
        datetime('now'),
        datetime('now')
    ),
    (
        'default_' || substr(hex(randomblob(16)), 1, 24),
        'deletion_score.never_watched.points',
        '20',
        'Never watched bonus points',
        datetime('now'),
        datetime('now')
    ),
    (
        'default_' || substr(hex(randomblob(16)), 1, 24),
        'deletion_score.size_on_disk.enabled',
        'true',
        'Enable size on disk factor',
        datetime('now'),
        datetime('now')
    ),
    (
        'default_' || substr(hex(randomblob(16)), 1, 24),
        'deletion_score.size_on_disk.max_points',
        '35',
        'Size on disk max points',
        datetime('now'),
        datetime('now')
    ),
    (
        'default_' || substr(hex(randomblob(16)), 1, 24),
        'deletion_score.size_on_disk.breakpoints',
        '[{"value":1,"percent":0},{"value":5,"percent":0},{"value":10,"percent":29},{"value":20,"percent":43},{"value":50,"percent":71},{"value":51,"percent":100}]',
        'Size on disk breakpoints',
        datetime('now'),
        datetime('now')
    ),
    (
        'default_' || substr(hex(randomblob(16)), 1, 24),
        'deletion_score.age_since_added.enabled',
        'true',
        'Enable age since added factor',
        datetime('now'),
        datetime('now')
    ),
    (
        'default_' || substr(hex(randomblob(16)), 1, 24),
        'deletion_score.age_since_added.max_points',
        '15',
        'Age since added max points',
        datetime('now'),
        datetime('now')
    ),
    (
        'default_' || substr(hex(randomblob(16)), 1, 24),
        'deletion_score.age_since_added.breakpoints',
        '[{"value":180,"percent":33},{"value":365,"percent":67},{"value":730,"percent":100}]',
        'Age since added breakpoints',
        datetime('now'),
        datetime('now')
    ),
    (
        'default_' || substr(hex(randomblob(16)), 1, 24),
        'deletion_score.folder_space.enabled',
        'false',
        'Enable folder space factor',
        datetime('now'),
        datetime('now')
    ),
    (
        'default_' || substr(hex(randomblob(16)), 1, 24),
        'deletion_score.folder_space.max_points',
        '10',
        'Folder space max points',
        datetime('now'),
        datetime('now')
    ),
    (
        'default_' || substr(hex(randomblob(16)), 1, 24),
        'deletion_score.folder_space.breakpoints',
        '[{"value":10,"percent":100},{"value":20,"percent":80},{"value":30,"percent":60},{"value":50,"percent":30}]',
        'Folder space breakpoints',
        datetime('now'),
        datetime('now')
    );