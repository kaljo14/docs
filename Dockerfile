FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

FROM dependencies AS builder
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in \
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/ \
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3001
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 3001
CMD ["node", "server.js"]
