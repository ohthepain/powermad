
target := powermad-client

client:
	docker build -t ohthepain/${target}:dev . 

run:
	docker run -dp 3000:3000 --name powermad-client ohthepain/${target}:dev

shell:
	docker exec -it ${target} /bin/sh

push:
	# docker compose push
	# https://docs.aws.amazon.com/AmazonECR/latest/userguide/docker-push-ecr-image.html
	aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws/k0r5u8i7
	docker build -t ${target} .
	docker tag ${target}:latest public.ecr.aws/k0r5u8i7/${target}:latest
	docker push public.ecr.aws/k0r5u8i7/${target}:latest
