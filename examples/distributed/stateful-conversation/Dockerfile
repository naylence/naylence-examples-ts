# syntax=docker/dockerfile:1.6

FROM naylence/agent-sdk-node:0.3.5

USER root

# Install OpenAI globally and expose it via a root-level node_modules directory for ESM resolution.
RUN npm install --global --omit=dev openai \
	&& mkdir -p /node_modules \
	&& ln -s /usr/local/lib/node_modules/openai /node_modules/openai

USER agent

WORKDIR /app
