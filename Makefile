.PHONY: install dev build start lint test clean

# Install dependencies
install:
	npm install

# Run dev server with hot reload
dev:
	npm run dev

# Build production bundle
build:
	npm run build

# Start production server
start:
	npm start

# Run linter
lint:
	npm run lint

# Run test suite
test:
	npm test

# Remove build artifacts and node_modules
clean:
	rm -rf node_modules dist
