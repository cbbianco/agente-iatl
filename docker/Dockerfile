FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/iatl

COPY mongo/scripts/ /opt/iatl/iatl-knowledge/
COPY mongo/package.json /opt/iatl/iatl-knowledge/package.json
COPY agents/ /opt/iatl/agents/
COPY skills/ /opt/iatl/skills-src/

RUN cd /opt/iatl/iatl-knowledge && npm install --omit=dev

ENV IATL_IDE=docker
ENV IATL_MONGO_URI=mongodb://mongo:27017
ENV IATL_CHROMA_HOST=chroma
ENV IATL_CHROMA_PORT=8000

WORKDIR /opt/iatl/iatl-knowledge

CMD ["node", "query.js", "--chroma-health"]
