# syntax=docker/dockerfile:1

FROM golang:1.20.7 AS build-stage

# Set destination for COPY
WORKDIR /app

# Download Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy app source
COPY *.go ./

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o /powermad-server

# Deploy application binary into a lean image
FROM gcr.io/distroless/base-debian11 AS build-release-stage

WORKDIR /

COPY --from=build-stage /powermad-server /powermad-server

# Optional: Bind to TCP port
EXPOSE 8080

USER nonroot:nonroot

# Run
CMD ["/powermad-server"]
#ENTRYPOINT ["/powermad-server"]
#CMD ["go", "run", "."]

