.PHONY: help install build build-web build-backend dev dev-web dev-backend test test-go test-release \
	e2e verify run clean package-release npm-pack release build-linux build-linux-arm64 build-macos \
	build-macos-arm64 build-windows build-all

.DEFAULT_GOAL := help

BINARY_NAME := axiom-preview
CMD_PATH := ./cmd/axiom-preview
OUTPUT_DIR := bin
LDFLAGS := -s -w
VERSION ?= 0.1.0

help:
	@printf "Axiom Preview commands:\n"
	@printf "  install              Install frontend dependencies\n"
	@printf "  dev                  Start Go backend and Vite frontend\n"
	@printf "  build                Build frontend and backend\n"
	@printf "  test                 Run Go tests\n"
	@printf "  verify               Run release verification\n"
	@printf "  build-all            Build Linux, macOS, and Windows binaries\n"
	@printf "  release              Build release archives and npm staging package\n"

install:
	cd site && pnpm install

build-web:
	cd site && pnpm build

build-backend:
	mkdir -p $(OUTPUT_DIR)
	CGO_ENABLED=0 go build -ldflags="$(LDFLAGS)" -o $(OUTPUT_DIR)/$(BINARY_NAME) $(CMD_PATH)

build: build-web build-backend

dev-web:
	cd site && pnpm dev

dev-backend:
	go run $(CMD_PATH)

dev:
	@trap 'kill $$(jobs -p) 2>/dev/null; exit 0' INT TERM; \
	go run $(CMD_PATH) & \
	sleep 1 && \
	cd site && pnpm dev

test: test-go test-release

test-go:
	go test ./...

test-release:
	node --test scripts/release-plan.test.mjs scripts/package-release.test.mjs npm/lib/platform.test.mjs

e2e: build
	@target=$$(node scripts/create-e2e-fixture.mjs); \
	./$(OUTPUT_DIR)/$(BINARY_NAME) --target=$$target --port=8893 & \
	pid=$$!; \
	trap 'kill $$pid 2>/dev/null; rm -rf $$target' EXIT INT TERM; \
	sleep 1; \
	cd site && AXIOM_PREVIEW_BASE_URL=http://127.0.0.1:8893 pnpm e2e

verify: build test e2e build-all

run:
	$(OUTPUT_DIR)/$(BINARY_NAME)

clean:
	rm -rf $(OUTPUT_DIR) dist site/dist/assets site/dist/index.html

package-release: build-all
	node scripts/package-release.mjs --version=$(VERSION)

npm-pack: package-release
	mkdir -p dist
	npm pack ./dist/npm --pack-destination dist

release: package-release

build-linux: build-web
	mkdir -p $(OUTPUT_DIR)
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="$(LDFLAGS)" -o $(OUTPUT_DIR)/$(BINARY_NAME)-linux-amd64 $(CMD_PATH)

build-linux-arm64: build-web
	mkdir -p $(OUTPUT_DIR)
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags="$(LDFLAGS)" -o $(OUTPUT_DIR)/$(BINARY_NAME)-linux-arm64 $(CMD_PATH)

build-macos: build-web
	mkdir -p $(OUTPUT_DIR)
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -ldflags="$(LDFLAGS)" -o $(OUTPUT_DIR)/$(BINARY_NAME)-darwin-amd64 $(CMD_PATH)

build-macos-arm64: build-web
	mkdir -p $(OUTPUT_DIR)
	CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -ldflags="$(LDFLAGS)" -o $(OUTPUT_DIR)/$(BINARY_NAME)-darwin-arm64 $(CMD_PATH)

build-windows: build-web
	mkdir -p $(OUTPUT_DIR)
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -ldflags="$(LDFLAGS)" -o $(OUTPUT_DIR)/$(BINARY_NAME)-windows-amd64.exe $(CMD_PATH)

build-all: build-web
	mkdir -p $(OUTPUT_DIR)
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="$(LDFLAGS)" -o $(OUTPUT_DIR)/$(BINARY_NAME)-linux-amd64 $(CMD_PATH)
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags="$(LDFLAGS)" -o $(OUTPUT_DIR)/$(BINARY_NAME)-linux-arm64 $(CMD_PATH)
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -ldflags="$(LDFLAGS)" -o $(OUTPUT_DIR)/$(BINARY_NAME)-darwin-amd64 $(CMD_PATH)
	CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -ldflags="$(LDFLAGS)" -o $(OUTPUT_DIR)/$(BINARY_NAME)-darwin-arm64 $(CMD_PATH)
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -ldflags="$(LDFLAGS)" -o $(OUTPUT_DIR)/$(BINARY_NAME)-windows-amd64.exe $(CMD_PATH)
