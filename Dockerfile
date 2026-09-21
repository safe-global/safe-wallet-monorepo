FROM node:24-alpine
RUN apk add --no-cache libc6-compat git python3 py3-pip make g++ libusb-dev eudev-dev linux-headers

# Set working directory
WORKDIR /app

# Copy root
COPY . .

# Set working directory to the web app
WORKDIR apps/web

# Enable corepack and configure yarn
RUN corepack enable
RUN yarn config set httpTimeout 300000

# Run any custom post-install scripts
RUN yarn install --immutable
RUN yarn after-install

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

# Expose the port
EXPOSE 3000

# Command to start the application
CMD ["yarn", "static-serve"]