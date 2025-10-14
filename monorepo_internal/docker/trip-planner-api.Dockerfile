# Stage 2: Runtime με Java 21 + OTP
FROM eclipse-temurin:21-jre-jammy AS runtime
ARG OTP_VERSION=2.7.0

# ---- Settings για cron-friendly run ----
ENV TZ=Europe/Athens \
    JAVA_TOOL_OPTIONS="-XX:+ExitOnOutOfMemoryError -XX:+UseContainerSupport" \
    OTP_JAVA_XMX=6G \
    PORT=8081 \
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

# Entry script: παράγει GTFS (Go), κατεβάζει OSM αν είναι νεότερο,
# γράφει build-config.json και χτίζει το graph
RUN printf '%s\n' '#!/usr/bin/env bash' \
'set -euo pipefail' \
'BASE=/data/routers/default' \
'echo "[OTP] probing $BASE..."' \
# '[ -d "$BASE/routers/default" ] || { echo "missing $BASE/routers/default"; exit 2; }' \
# '[ -s "$BASE/routers/default/graph.obj" ] || { echo "missing graph.obj"; exit 3; }' \
'cat > "$ROUTER_DIR/otp-config.json" <<JSON' \
'{' \
'  "otpFeatures": { "LegacyRestApi": true, "ActuatorAPI": true}' \
'}' \
'JSON' \
'echo "[OTP] load graph.obj..."; ' \
'exec java -Xmx"${OTP_JAVA_XMX}" -jar /opt/otp/otp-shaded.jar --load "$BASE" --port "$PORT"' \
> /usr/local/bin/run_all && chmod +x /usr/local/bin/run_all

WORKDIR /data

VOLUME ["/data"]

CMD ["/usr/local/bin/run_all"]