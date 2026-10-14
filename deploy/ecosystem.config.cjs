// Konfiguracja pm2: jeden proces, automatyczny restart, logi w /home/ai/.pm2/logs
module.exports = {
  apps: [{
    name: "ai-demo",
    cwd: "/opt/ai-demo",
    script: "server/index.js",
    node_args: "--env-file-if-exists=.env",
    instances: 1,
    autorestart: true,
    max_memory_restart: "300M",
    env: { NODE_ENV: "production" }
  }]
};
