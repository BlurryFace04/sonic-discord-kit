# Use an official Node.js runtime with the specific version as a parent image
FROM node:20.10.0-alpine

# Set the working directory to the root directory
WORKDIR /

# Copy the package.json and package-lock.json files to the root  directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the root directory
COPY . .

# Accept multiple build arguments for environment variables
ARG DISCORD_APP_ID
ARG DISCORD_TOKEN
ARG DISCORD_CLIENT_SECRET
ARG PUBLIC_KEY
ARG PRIVY_SIGNING_KEY

# Set the environment variables
ENV DISCORD_APP_ID=${DISCORD_APP_ID}
ENV DISCORD_TOKEN=${DISCORD_TOKEN}
ENV DISCORD_CLIENT_SECRET=${DISCORD_CLIENT_SECRET}
ENV PUBLIC_KEY=${PUBLIC_KEY}
ENV PRIVY_SIGNING_KEY=${PRIVY_SIGNING_KEY}

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the app
CMD ["npm", "start"]
