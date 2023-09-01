# stop:
# 	docker compose down

# run: stop
# 	docker compose up

target := powermad-server

build:
	docker build -t ${target} . 

run:
	docker run -dp 8080:8080 --name ${target} ${target}

stop:
	-docker stop ${target}
	docker rm ${target}

push:
	# docker compose push
	# https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html
	aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws/k0r5u8i7
	docker build -t ${target} .
	docker tag ${target}:latest public.ecr.aws/k0r5u8i7/powermad-server:latest
	docker push public.ecr.aws/k0r5u8i7/powermad-server:latest

info:
	docker compose convert
	docker compose ps
	docker info
