export default {
  apps: [
    {
      name: "twitch-notifier",
      script: "dist/index.js",
      node_args: "--env_file .env"
    }
  ]
}
