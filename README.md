

Primsa ORM command to run to generate migrations:

docker exec -it <container_name> npx prisma migrate dev --name <migration name>

docker exec -it auth_service sh -lc "cd /app && npx prisma migrate dev --name <change_name>"

