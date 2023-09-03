# syntax=docker/dockerfile:1

FROM golang:1.20.7 AS build-stage

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY *.go ./

RUN CGO_ENABLED=0 GOOS=linux go build -o /powermad-server

# Deploy application binary into a lean image
FROM gcr.io/distroless/base-debian11 AS build-release-stage

WORKDIR /

COPY --from=build-stage /powermad-server /powermad-server

EXPOSE 8080

USER nonroot:nonroot

CMD ["/powermad-server"]

