FROM node:20-alpine AS backend
WORKDIR /backend
COPY backend/package*.json ./
RUN npm install
COPY backend ./

FROM node:20-alpine AS frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /var/www
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev
COPY --from=backend /backend ./backend
COPY --from=frontend /frontend/dist ./frontend/dist
COPY package.json ./
EXPOSE 8000
CMD ["npm", "start"]
