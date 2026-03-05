FROM node:20-alpine

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of source
COPY . .

EXPOSE 3000

# Run Vite dev server (accessible outside container)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
