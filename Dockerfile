FROM node:22.19-alpine3.22@sha256:d2166de198f26e17e5a442f537754dd616ab069c47cc57b889310a717e0abbf9 AS builder
WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:22.19-alpine3.22@sha256:d2166de198f26e17e5a442f537754dd616ab069c47cc57b889310a717e0abbf9 AS final
WORKDIR /app

# Copy package files and install production dependencies
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application and docs
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/README.md ./README.md

USER node

EXPOSE 3000

CMD ["node", "dist/app.js"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 \
    CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>r.ok?r.json():Promise.reject()).then(j=>{if(j&&j.status==='OK'){process.exit(0)}else{process.exit(1)}}).catch(()=>process.exit(1))"