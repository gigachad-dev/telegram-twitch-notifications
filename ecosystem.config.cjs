const dotenv = require('dotenv')
const env = dotenv.config()
if (env.error) throw env.error

module.exports = {
  apps: [
    {
      name: 'twitch-notifications',
      script: 'dist/index.js',
      env: env.parsed
    }
  ]
}
