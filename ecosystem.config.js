module.exports = {
  apps: [
    {
      name: 'server',
      script: 'server.js',
      env: {
        PORT: 3000,
        ADMIN_USER: 'admin',
        ADMIN_PASS: 'NewStrongPass123',
        SESSION_SECRET: 'change-me',
      }
    }
  ],
  deploy: {
    production: {
      user: 'inverseiq',
      host: '146.190.233.46',
      ref: 'origin/main',
      repo: 'git@github.com:bjan212/inverse-iq.git',
      path: '/opt/trading-data-collection-service',
      'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js --env production'
    }
  }
};