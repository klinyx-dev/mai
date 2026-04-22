FROM rust:bookworm

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    build-essential \
    clang \
    lldb \
    git \
    curl \
    gnupg \
    ca-certificates \
    bash \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
        | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
        > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN rustup component add rustfmt clippy
RUN rustup target add wasm32-unknown-unknown
RUN cargo install wasm-pack
RUN corepack enable && corepack prepare pnpm@10 --activate

ENV CARGO_HOME=/usr/local/cargo
ENV CARGO_TARGET_DIR=/workspace/target
ENV PNPM_HOME=/pnpm
ENV PNPM_STORE_DIR=/pnpm/store
ENV PATH="${PNPM_HOME}:${PATH}"

WORKDIR /workspace
