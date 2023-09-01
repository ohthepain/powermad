
run: build stop
	docker compose up -d

build:
	docker compose build

stop:
	-docker compose down

push:
	docker compose push

info:
	docker compose convert
	docker compose ps
	docker info
