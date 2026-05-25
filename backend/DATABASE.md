# Encje
- User - dane userow logujacych sie przez google oauth
- Role - user / admin
- Reservation - lista rezerwacji sal
- Room - dane sal do rezerwacji
- CalendarIntegration - dane integracyjne usera od google calendar
- DiskIntegration - dane integracyjne usera od google disk

# Relacje w db
- Role 1:N User
- User 1:N Reservation
- Room 1:N Reservation
- User 1:1 CalendarIntegration
- User 1:1 DiskIntegration

- Jedna rola moze byc przypisana do wielu userow
- Jeden user moze miec wiele rezerwacji
- Jedna sala moze miec wiele rezerwacji
- Jeden user moze miec jedna integracje z google calendar
- Jeden user moze miec jedna integracje z google disk

# Tabele
## Roles
- id / UUID, PK
- name / String, Unique, Required
- created_at / DateTime, requiered, default now()
- updated_at / DateTime, default now()

## Users
- id
- google_id
- email
- full_name
- avatar_url
- role_id
- created_at
- updated_at

## Reservations
- id
- user_id
- room_id
- title
- status
- description
- start_time
- end_time
- created_at
- updated_at
- google_calendar_event_id

## Rooms
- id
- name
- location
- description
- capacity
- is_active
- created_at
- updated_at

## calendar_integrations
- id
- user_id
- provider
- calendar_email
- refresh_token_encrypted
- token_expires_at
- created_at
- updated_at

## disk_integrations
- id
- user_id
- provider
- disk_email