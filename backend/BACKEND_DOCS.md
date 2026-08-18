# info
- npm ci instaluje dokładnie wersje z package-lock.json
-
# instalacja paczkek
  - npm init -y
  - npm install express cors dotenv @prisma/client zod
  - npm install -D nodemon prisma
  - npm install pg @prisma/adapter-pg
  - npm install -D vitest supertest

# dodanie skrotow npm do package.json
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "node prisma/seed.js"

# struktura folderow w backend
  - src/
  - src/config/
  - src/middleware/
  - src/errors/
  - src/modules/
  - src/modules/rooms
  - src/modules/reservations
  - src/modules/auth
  - src/modules/google-calendar
  - src/utils/

# opis paczek npm
- express - framework backendowy js
- cors - obsluga zapytan z frontendu
- dotenv - zmienne srodowiskowe z .env
- zod - walidacja requestow wejsciowych
- morgan - logowanie zapytan http
- @prisma/client - klient bazy danych
- prisma - schema i migracje bazy danych
- nodemon - szybki restart serwera w fazie developmentu
- vitest - uruchamianie testów
- supertest - testowanie endpointow http bez recznego odpalania serwera

# paczki do OAuth / JWT
- jsonwebtoken
- cookie-parser
- googleapis

# struktura folderow backend
- app.js - konfiguracja express
- server.js - uruchamianie servera

# data flow
Routing -> Validation -> Controller -> Service -> Repository |


# lista błędów api
- 500..
  - 500 - INTERNAL_SERVER_ERROR
  - 502 - BAD_GATEWAY
- 400..
  - 400 - BAD_REQUEST
  - 401 - UNATHORIZED
  - 403 - FORBIDDEN
  - 404 - NOT_FOUND
  - 409 - CONFLICT
  - 422 - UNPROCESSABLE_ENTITY
  - 429 - TOO_MANY_REQUESTS
