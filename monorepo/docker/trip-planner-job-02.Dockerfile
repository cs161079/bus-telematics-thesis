# Stage 1: Build Go
FROM golang:1.23 AS go-build
ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
WORKDIR /app

RUN mkdir -p common trip-planner trip-planner/config trip-planner/utils trip-planner/gtfs

COPY common/ common/
COPY trip-planner/config trip-planner/config
COPY trip-planner/utils trip-planner/utils
COPY trip-planner/db/migrations/release/ db/migrations/
COPY go.mod go.mod
COPY trip-planner/main.go .

RUN go mod download && go mod tidy
RUN go build -o /out/executable_go

# Stage 2: Runtime με Java 21 + OTP
FROM eclipse-temurin:21-jre-jammy AS runtime
ARG OTP_VERSION=2.7.0

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

# Go binary
COPY --from=go-build /out/executable_go /usr/local/bin/executable_go

# Entry script: παράγει GTFS (Go), κατεβάζει OSM αν είναι νεότερο,
# γράφει build-config.json και χτίζει το graph
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
'/usr/local/bin/executable_go' \
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
> /usr/local/bin/run_all && chmod +x /usr/local/bin/run_all

WORKDIR /data
# (Προσοχή) ΜΗ βάζεις secrets baked στο image· αν θες .env, κάνε το mount ως secret/volume.
# COPY trip-planner/.env .

VOLUME ["/data"]

CMD ["/usr/local/bin/run_all"]