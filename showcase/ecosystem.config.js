module.exports = {
  apps: [
    {
      name: "funtapp-showcase",
      cwd: "/var/www/funadmin/showcase",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 5002",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 5002,
      },
    },
  ],
};
