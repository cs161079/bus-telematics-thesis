FROM golang:1.23 AS builder

# Set Go environment variables
# Set environment variables
ENV GO111MODULE=on \
    CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64 \
    GOPROXY=direct

# Set the working directory
WORKDIR /app

# Create necessary directories
RUN mkdir common \ 
    cronjob \
    cronjob/config \
    cronjob/dao \
    cronjob/utils

# Make necessary copy file
COPY common/ common/
COPY cronjob/config cronjob/config 
COPY cronjob/dao cronjob/dao
COPY cronjob/utils cronjob/utils

COPY go.mod go.mod
COPY cronjob/main.go .
COPY cronjob/.env .

RUN go mod download
RUN go mod tidy

# Build Go Application
RUN echo "Build go application..."
RUN go build -o executable_go


# Stage 2: Runtime με Java 21 + OTP
FROM eclipse-temurin:21-jre-jammy AS runtime
ARG OTP_VERSION=2.7.0

# Copy binary from builder stage
COPY --from=builder /app/executable_go /usr/local/bin/executable_go
COPY --from=builder /app/.env /usr/local/bin/.env

# ---- Settings για cron-friendly run ----
ENV TZ=Europe/Athens \
    JAVA_TOOL_OPTIONS="-XX:+ExitOnOutOfMemoryError -XX:+UseContainerSupport" \
    OTP_JAVA_XMX=6G \
    OSM_URL=https://download.geofabrik.de/europe/greece-latest.osm.pbf \
    OSM_FILE=greece-latest.osm.pbf \
    GTFS_FILE=gtfs_feed.zip \
    ROUTER_DIR=/data/routers/default

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      curl ca-certificates bash tzdata && rm -rf /var/lib/apt/lists/*

# OTP jar + σταθερό alias
RUN mkdir -p /opt/otp ${ROUTER_DIR}
RUN curl -fsSL -o /opt/otp/otp-shaded-${OTP_VERSION}.jar \
      "https://repo1.maven.org/maven2/org/opentripplanner/otp/${OTP_VERSION}/otp-${OTP_VERSION}-shaded.jar" \
  || curl -fsSL -o /opt/otp/otp-shaded-${OTP_VERSION}.jar \
      "https://github.com/opentripplanner/OpenTripPlanner/releases/download/v${OTP_VERSION}/otp-shaded-${OTP_VERSION}.jar"
RUN ln -s /opt/otp/otp-shaded-${OTP_VERSION}.jar /opt/otp/otp-shaded.jar

# Install kubectl (latest stable)
RUN curl -LO "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
RUN install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
RUN rm kubectl

# Entry script: generates GTFS (Go), downloads OSM if newer,
# writes build-config.json and builds the graph
RUN printf '%s\n' '#!/usr/bin/env bash' \
'set -euo pipefail' \
'log(){ echo "[$(date -Iseconds)] $*"; }' \
'' \
'ROUTER_DIR="${ROUTER_DIR:-/data/routers/default}"' \
'OSM_URL="${OSM_URL:-}"' \
'OSM_FILE="${OSM_FILE:-greece-latest.osm.pbf}"' \
'GTFS_FILE="${GTFS_FILE:-gtfs_feed.zip}"' \
'mkdir -p "$ROUTER_DIR"' \
'' \
'log "[Go] generating GTFS → $ROUTER_DIR/$GTFS_FILE"' \
' /usr/local/bin/executable_go ' \
'if [ ! -s "$ROUTER_DIR/$GTFS_FILE" ]; then' \
'  echo "ERROR: expected GTFS at $ROUTER_DIR/$GTFS_FILE but not found." >&2; exit 2' \
'fi' \
'' \
'if [ -n "$OSM_URL" ]; then' \
'  log "Fetching OSM if newer → $ROUTER_DIR/$OSM_FILE"' \
'  curl -fsSL --retry 3 -z "$ROUTER_DIR/$OSM_FILE" -o "$ROUTER_DIR/$OSM_FILE" "$OSM_URL"' \
'fi' \
'[ -s "$ROUTER_DIR/$OSM_FILE" ] || { echo "ERROR: OSM file missing at $ROUTER_DIR/$OSM_FILE" >&2; exit 3; }' \
'' \
'log "Writing build-config.json"' \
'cat > "$ROUTER_DIR/build-config.json" <<JSON' \
'{' \
'  "osm": [ { "source": "'"$OSM_FILE"'", "timeZone": "'"${TZ:-UTC}"'" } ],' \
'  "transitFeeds": [ { "type": "gtfs", "source": "'"$GTFS_FILE"'" } ]' \
'}' \
'JSON' \
'' \
'log "[OTP] building graph.obj..."' \
'java -Xmx"${OTP_JAVA_XMX}" -jar /opt/otp/otp-shaded.jar --build --save "$ROUTER_DIR"' \
'log "Done."' \
'kubectl rollout restart deployment otp-deployment -n oasa-telemat' \
> /usr/local/bin/run_all && chmod +x /usr/local/bin/run_all

WORKDIR /usr/local/bin

VOLUME ["/data"]

CMD ["/usr/local/bin/run_all"]


