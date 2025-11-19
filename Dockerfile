# Frontend Dockerfile - Angular
FROM node:18-slim

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias y Angular CLI globalmente
RUN npm install -g @angular/cli && npm install

# Copiar el resto del código
COPY . .

# Exponer puerto 4200
EXPOSE 4200

# Ejecutar Angular en modo desarrollo accesible desde cualquier IP
CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200"]
