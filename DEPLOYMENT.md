# Шаг-за-шагом: автоматический деплой Shpion-z0r 🚀

## 1. Что происходит автоматически

Push в ветку **master** → GitHub Actions «CI/CD Deploy»
1. Сборка Docker-образов `backend` и `frontend` (Buildx + QEMU).
2. Публикация образов в GitHub Container Registry (GHCR) под тегом `latest`.
3. SSH на ваш сервер и:
   • клонирование/обновление репозитория;
   • генерация `backend-prod.env` из переданных секретов;
   • `docker compose pull && up -d` — контейнеры перезапускаются.

## 2. Что нужно один раз на сервере

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
# Добавьте пользователя в группу docker (кастомизируйте)
sudo usermod -aG docker $USER
newgrp docker



# Создайте рабочую директорию
sudo mkdir -p /opt/shpion-z0r && sudo chown $USER /opt/shpion-z0r
```



Порты 3001 (backend) и 8080 (frontend) должны быть свободны **внутри** сервера.
Снаружи к ним обращаться не надо — всё пойдёт через Nginx Proxy Manager.

## 3. Настройка SSH-доступа из GitHub Actions (подробно)

> SSH-ключ нужен только для того, чтобы GitHub Actions мог зайти на
> сервер и выполнить команды. Ключи **никогда** не покидают ваш репозиторий —
> приватный ключ хранится шифрованным в Secrets.

1.  **Сгенерируйте пару ключей на _локальной машине_ (или прямо на сервере)**
    ```bash
    ssh-keygen -t ed25519 -C "shpion-ci" -f ~/.ssh/shpion_ci
    # -C — пометка, -f — имя файлов, получатся:
    #   ~/.ssh/shpion_ci      (приватный)
    #   ~/.ssh/shpion_ci.pub  (публичный)
    ```
2.  **Добавьте публичный ключ на сервер** (разрешение входа):
    ```bash
    cat ~/.ssh/shpion_ci.pub | ssh <user>@<SERVER_HOST> "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
    ```
    Убедитесь, что вход по ключу работает:
    ```bash
    ssh -i ~/.ssh/shpion_ci <user>@<SERVER_HOST> "echo ok"
    ```
3.  **Добавьте _приватный_ ключ в репозиторий: GitHub → Settings → Secrets → Actions**
    • нажмите **New repository secret** → имя `SERVER_SSH_KEY` → содержимое файла `~/.ssh/shpion_ci` (начинается с `-----BEGIN OPENSSH PRIVATE KEY-----`).

*Всё, GitHub сможет заходить на VPS, но никто кроме вас приватный ключ не увидит.*

---

## 4. Генерация обязательных секретов

| Переменная | Как получить |
|------------|--------------|
| `DATABASE_URL` | Создайте пароль для Postgres `openssl rand -base64 16`. В `docker-compose.prod.yml` сервис БД называется `db`, поэтому URL внутри сети: `postgresql://postgres:<PWD>@db:5432/shpion` |
| `JWT_SECRET` | Любая случайная строка длиной ≥32 символа. Можно сгенерировать: `openssl rand -base64 32` |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | В консоли LiveKit Cloud или self-host — раздел «API Keys». |
| `LIVEKIT_URL` | `wss://livekit.pr0d.ru` или `http://<ip>:7880` (если LiveKit в той же сети). |
| `CLIENT_URL` | `https://shpion.pr0d.ru` |
| `VITE_API_URL` | URL backend-прокси (`https://api.shpion.pr0d.ru`) |
| `VITE_LIVEKIT_URL` | Websocket-URL LiveKit (`wss://livekit.pr0d.ru`) |

Добавляйте эти значения как **Repository secrets** (аналогично `SERVER_SSH_KEY`).

> ⚠️ GitHub Actions автоматически подставит их в workflow и не покажет в логах.

---


## 5. Настройка GitHub Container Registry (если репозиторий приватный)

GHCR доступен «из коробки». Для приватного репозитория убедитесь, что:

1.  В **Settings → Packages → Container registry** у вас есть пункт
    `Read & write access` для `GITHUB_TOKEN` (обычно включено).  
2.  На сервере вход в регистри выполняет сам workflow командой
    ```bash
    docker login ghcr.io -u <github_actor> -p $GITHUB_TOKEN
    ```
    поэтому ничего вручную делать не надо.

---

## 6. Первый деплой (подробно)

1. Склонируйте проект локально, отредактируйте при желании, commit/push.  
2. Перейдите во вкладку **Actions → CI/CD Deploy** и смотрите, как идут два джоба:  
   • *build-and-push* → собирает и публикует образы;  
   • *deploy* → подключается к серверу, пишет `backend-prod.env`, запускает compose.  
3. После зелёного статуса — проверьте контейнеры:
   ```bash
   ssh <user>@<SERVER_HOST> "docker compose -f /opt/shpion-z0r/docker-compose.prod.yml ps"
   ```

---

## 7. Установка и настройка Nginx Proxy Manager

```bash
# Docker Compose (в домашней директории, пример)
cat > docker-compose-npm.yml <<'YAML'
version: "3"
services:
  npm:
    image: jc21/nginx-proxy-manager:2
    restart: unless-stopped
    ports:
      - "80:80"
      - "81:81"   # админ-панель
      - "443:443"
    volumes:
      - npm_data:/data
      - npm_letsencrypt:/etc/letsencrypt
volumes:
  npm_data:
  npm_letsencrypt:
YAML

docker compose -f docker-compose-npm.yml up -d
```

Далее в браузере: `http://<SERVER_HOST>:81` → создайте пользователя и добавьте
Proxy Host'ы:

| Домены | Точка маршрута | Forward Host | Forward Port | Websockets | SSL |
|--------|----------------|--------------|--------------|------------|-----|
| shpion.pr0d.ru | / (root) | `127.0.0.1` | **8080** | ✓ | Let's Encrypt |
| shpion.pr0d.ru | /api (Regex Location) | `127.0.0.1` | **3001** | ✓ | – |
| shpion.pr0d.ru | /socket.io | `127.0.0.1` | **3001** | ✓ | – |
| shpion.pr0d.ru | /livekit | `127.0.0.1` | **7880** | ✓ | – |

Как настроить в NPM:
1. Создайте **один** Proxy Host `shpion.pr0d.ru` с **Forward Hostname = 127.0.0.1** и **Forward Port = 8080**. Вкладка **SSL** → Request a new certificate (Let's Encrypt), Force SSL + HTTP/2.
2. На вкладке **Advanced → Custom Locations** добавьте три Location:
   ```
   # /api → backend
   location ^~ /api {
     proxy_pass http://127.0.0.1:3001$request_uri;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";
   }
   
   # WebSocket endpoint, нужен Socket.IO (/api/socket.io)
   location ^~ /socket.io {
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "Upgrade";
     proxy_pass http://127.0.0.1:3001$request_uri;
   }
   
   # /livekit → LiveKit SFU (если используется дефолтный порт 7880)
   location ^~ /livekit {
     proxy_pass http://127.0.0.1:7880$request_uri;
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "Upgrade";
   }
   ```





Теперь:
- Frontend доступен на `https://shpion.pr0d.ru/`.
- Backend API — `https://shpion.pr0d.ru/api/*`.
- WebSocket Socket.IO — `https://shpion.pr0d.ru/socket.io` (приложение само обращается).
- LiveKit — `wss://shpion.pr0d.ru/livekit` (используется как `VITE_LIVEKIT_URL`).

## Обновите secrets

- `CLIENT_URL` → `https://shpion.pr0d.ru`
- `VITE_API_URL` → `https://shpion.pr0d.ru` (без /api, клиент добавляет автомат.)
- `VITE_LIVEKIT_URL` → `wss://shpion.pr0d.ru/livekit`
- `LIVEKIT_URL` (для backend) → `http://livekit:7880` **или** `http://127.0.0.1:7880` если LiveKit крутится локально.

## 8. Обновления, масштабирование, откат

* **Обновление** — любой push в `master`.
* **Ручной откат** — на сервере:
  ```bash
  cd /opt/shpion-z0r
  git checkout <commit_sha>
  docker compose -f docker-compose.prod.yml up -d
  ```
* **Масштаб контейнеров** (пример +2 worker frontend):
  ```bash
  docker compose -f docker-compose.prod.yml up -d --scale frontend=3
  ```

Теперь любой разработчик, прочитавший эту инструкцию, сможет развернуть проект
«с нуля» до production. Удачи! 🚀 
