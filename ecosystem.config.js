// ============================================
// USMON SHASHLIK — PM2 Production Process Manager
// ============================================

module.exports = {
  apps: [
    {
      name: 'usmon-backend',
      cwd: './backend',
      script: 'src/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      watch: false,
      max_memory_restart: '500M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
    },
  ],
};
