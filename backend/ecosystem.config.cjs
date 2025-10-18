module.exports = {
    apps: [
        {
            name: 'api',
            script: './dist/index.js',
            instances: 1,
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 5000
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 5000
            }
        },
        {
            name: 'matching-worker',
            script: './dist/workers/matching.worker.js',
            instances: 2, // Run 2 instances for parallel processing
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production'
            }
        },
        {
            name: 'parsing-worker',
            script: './dist/workers/parsing.worker.js',
            instances: 2,
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
};

