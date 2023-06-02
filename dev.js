#!/usr/bin/env node
import ngrok from 'ngrok'
import nodemon from 'nodemon'

ngrok
  .connect({
    proto: 'http',
    addr: process.env.SERVER_PORT
  })
  .then((url) => {
    console.log(`ngrok tunnel opened at: ${url}`)

    nodemon({
      watch: ['src', '.env'],
      ignore: ['db/**'],
      exec: `cross-env TS_NODE_TRANSPILE_ONLY=true NGROK_URL=${url} NODE_ENV=development DEBUG=grammy* node --no-warnings --loader ts-node/esm --enable-source-maps --trace-warnings --inspect=0.0.0.0:9234 --nolazy src/index.ts`,
      ext: 'ts'
    })
      .on('start', () => {
        console.log('The application has started')
      })
      .on('restart', (files) => {
        console.group('Application restarted due to:')
        files.forEach((file) => console.log(file))
        console.groupEnd()
      })
      .on('quit', () => {
        console.log('The application has quit, closing ngrok tunnel')
        ngrok.kill().then(() => process.exit(0))
      })
  })
  .catch((error) => {
    console.error('Error opening ngrok tunnel: ', error)
    process.exitCode(1)
  })
