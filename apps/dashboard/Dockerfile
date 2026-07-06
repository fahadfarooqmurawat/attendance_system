FROM node:24-alpine

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/dashboard/package.json apps/dashboard/package.json
COPY packages/attendance-core/package.json packages/attendance-core/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/db/prisma packages/db/prisma
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @attendance/db generate
RUN pnpm --filter @attendance/dashboard build

EXPOSE 3000
CMD ["pnpm", "--filter", "@attendance/dashboard", "start"]
