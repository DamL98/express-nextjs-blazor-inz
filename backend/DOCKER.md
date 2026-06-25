start kontenera: docker-compose up -d
stop: docker-compose down
stop + usuniecie bazy: docker compose down -v
logi: docker logs nazwa_kontenera
wejscie do kontenera: docker exec -it nazwa_kontenera psql -U inzynierka_user -d inzynierka_db