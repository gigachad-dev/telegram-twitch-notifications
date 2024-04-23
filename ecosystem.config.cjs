const dotenv = require('dotenv')

module.exports = {
  apps: [
    {
      name: 'twitch-notifications',
      script: 'dist/index.js',
      env: dotenv.config().parsed
    }
  ]
}
