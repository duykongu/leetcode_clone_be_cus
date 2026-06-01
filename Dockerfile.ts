FROM node:18-alpine
RUN npm install -g typescript

# -> docker build -t ts-leetcode -f Dockerfile.ts