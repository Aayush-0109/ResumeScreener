module.exports = {
    apps: [
        {
            name: 'api',
            script: './dist/index.js',
            instances: process.env.NODE_ENV === 'production' ? 2 : 1,
            exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
            env: {
                NODE_ENV: process.env.NODE_ENV || 'development',
            },
            env_production: {
                NODE_ENV: 'production'
            },
            error_file: './logs/api-error.log',
            out_file: './logs/api-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            max_memory_restart: '500M',
            kill_timeout: 5000
        },
        {
            name: 'matching-worker',
            script: './dist/workers/matching.worker.js',
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: process.env.NODE_ENV || 'development'
            },
            env_production: {
                NODE_ENV: 'production'
            },
            error_file: './logs/matching-worker-error.log',
            out_file: './logs/matching-worker-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            restart_delay: 5000,
            max_restarts: 10,
            max_memory_restart: '800M',
            kill_timeout: 10000
        },
        {
            name: 'parsing-worker',
            script: './dist/workers/parsing.worker.js',
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: process.env.NODE_ENV || 'development'
            },
            env_production: {
                NODE_ENV: 'production'
            },
            error_file: './logs/parsing-worker-error.log',
            out_file: './logs/parsing-worker-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            restart_delay: 5000,
            max_restarts: 10,
            max_memory_restart: '800M',
            kill_timeout: 10000
        }
    ]
};

