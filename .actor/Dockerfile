FROM apify/actor-node:22

COPY --chown=myuser package*.json ./
RUN npm install --omit=dev --prefer-offline

COPY --chown=myuser . ./

CMD ["node", "src/main.js"]
