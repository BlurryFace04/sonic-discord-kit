# Use an official Node.js runtime with the specific version as a parent image
FROM node:20.10.0-alpine

# Set the working directory to the root directory
WORKDIR /

# Copy the package.json and package-lock.json files to the root  directory
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application code to the root directory
COPY . .

# Accept multiple build arguments for environment variables
ARG NEXT_PUBLIC_DISCORD_APP_ID
ARG NEXT_PUBLIC_PRIVY_APP_ID
ARG PRIVY_APP_SECRET
ARG PRIVY_SIGNING_KEY
ARG HELIUS_API_KEY

# Set the environment variables
ENV NEXT_PUBLIC_DISCORD_APP_ID=${NEXT_PUBLIC_DISCORD_APP_ID}
ENV NEXT_PUBLIC_PRIVY_APP_ID=${NEXT_PUBLIC_PRIVY_APP_ID}
ENV PRIVY_APP_SECRET=${PRIVY_APP_SECRET}
ENV PRIVY_SIGNING_KEY=${PRIVY_SIGNING_KEY}
ENV HELIUS_API_KEY=${HELIUS_API_KEY}

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the app
CMD ["npm", "start"]
