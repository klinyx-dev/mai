FROM rust:bookworm

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    build-essential \
    clang \
    lldb \
    git \
    curl \
    nodejs \
    npm \
    ca-certificates \
    bash \
    && rm -rf /var/lib/apt/lists/*

RUN rustup component add rustfmt clippy
RUN rustup target add wasm32-unknown-unknown
RUN cargo install wasm-pack

ENV CARGO_HOME=/usr/local/cargo
ENV CARGO_TARGET_DIR=/workspace/target

WORKDIR /workspace
