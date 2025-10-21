# SGP Database Schema (Supabase)

This document outlines the database schema for the Sistema de Gestión Publicitaria (SGP).

## Tables

### `users`

Stores basic user information, linked to Supabase Auth.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key, Foreign Key to `auth.users.id` | User's unique identifier. |
| `email` | `varchar` | Unique, Not Null | User's email address. |
| `full_name` | `varchar` | | User's full name. |
| `created_at` | `timestamptz` | Default `now()` | Timestamp of user creation. |

### `teams`

Represents a workspace for collaboration.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key, Default `gen_random_uuid()` | Team's unique identifier. |
| `name` | `varchar` | Not Null | Name of the team. |
| `owner_id` | `uuid` | Foreign Key to `users.id` | The user who owns the team. |
| `created_at` | `timestamptz` | Default `now()` | Timestamp of team creation. |

### `team_members`

Junction table for the many-to-many relationship between users and teams.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `team_id` | `uuid` | Foreign Key to `teams.id` | ID of the team. |
| `user_id` | `uuid` | Foreign Key to `users.id` | ID of the user. |
| `role` | `varchar` | | Role of the user in the team (e.g., 'admin', 'editor'). |

### `projects`

A project is a container for templates and assets.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key, Default `gen_random_uuid()` | Project's unique identifier. |
| `name` | `varchar` | Not Null | Name of the project. |
| `team_id` | `uuid` | Foreign Key to `teams.id` | The team this project belongs to. |
| `created_at` | `timestamptz` | Default `now()` | Timestamp of project creation. |

### `templates`

Stores the structure and properties of a design.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key, Default `gen_random_uuid()` | Template's unique identifier. |
| `name` | `varchar` | Not Null | Name of the template. |
| `project_id` | `uuid` | Foreign Key to `projects.id` | The project this template belongs to. |
| `data` | `jsonb` | Not Null | The Konva.js scene graph representing the template. |
| `created_at` | `timestamptz` | Default `now()` | Timestamp of template creation. |
| `updated_at` | `timestamptz` | Default `now()` | Timestamp of last template update. |

### `assets`

Stores uploaded media like images and videos.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key, Default `gen_random_uuid()` | Asset's unique identifier. |
| `project_id` | `uuid` | Foreign Key to `projects.id` | The project this asset belongs to. |
| `name` | `varchar` | Not Null | Name of the asset. |
| `url` | `varchar` | Not Null | URL to the file in Supabase Storage. |
| `type` | `varchar` | | Type of the asset (e.g., 'image', 'video'). |
| `created_at` | `timestamptz` | Default `now()` | Timestamp of asset creation. |

### `renders`

Stores information about video rendering jobs.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key, Default `gen_random_uuid()` | Render's unique identifier. |
| `template_id` | `uuid` | Foreign Key to `templates.id` | The template used for this render. |
| `status` | `varchar` | Default `'pending'` | Status of the render (e.g., 'pending', 'success', 'error'). |
| `output_url` | `varchar` | | URL to the rendered video file. |
| `resolution` | `varchar` | | The resolution of the rendered video (e.g., '1920x1080'). |
| `created_at` | `timestamptz` | Default `now()` | Timestamp of render creation. |
| `completed_at` | `timestamptz` | | Timestamp of render completion. |
