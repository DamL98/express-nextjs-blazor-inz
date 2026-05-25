# instalacja paczkek
  - npm init -y
  - npm install express cors dotenv @prisma/client zod
  - npm install -D nodemon prisma

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

# paczki do OAuth / JWT
- jsonwebtoken
- cookie-parser
- googleapis