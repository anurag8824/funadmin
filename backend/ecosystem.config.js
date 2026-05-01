module.exports = {
  apps: [
    {
      name: "funtapp-api",
      script: "index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "funtapp-reels-worker",
      script: "workers/reelsProcessor.worker.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

