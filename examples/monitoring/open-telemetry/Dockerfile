# syntax=docker/dockerfile:1.6

FROM naylence/agent-sdk-node:0.3.3

USER root

# Install OpenTelemetry packages globally and expose them via root-level node_modules
RUN npm install --global --omit=dev \
    @opentelemetry/api@^1.9.0 \
    @opentelemetry/exporter-trace-otlp-http@^0.205.0 \
    @opentelemetry/resources@^2.1.0 \
    @opentelemetry/sdk-trace-base@^2.1.0 \
    @opentelemetry/sdk-trace-node@^2.1.0 \
  && mkdir -p /node_modules \
  && ln -s /usr/local/lib/node_modules/@opentelemetry /node_modules/@opentelemetry

USER agent

WORKDIR /app

EXPOSE 4318
EXPOSE 4317
