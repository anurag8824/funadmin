module.exports = {
  apps: [
    {
      name: "funtapp-admin",
      cwd: "/var/www/funadmin/frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 5001",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 5001,
      },
    },
  ],
};
