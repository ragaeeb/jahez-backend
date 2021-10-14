import util from 'util';
import winston from 'winston';

const { createLogger, format, transports } = winston;

const EnvToLevel = {
    development: 'debug',
    test: 'warn',
};

export const logger = createLogger({
    level: EnvToLevel[process.env.NODE_ENV] || 'info',
    format: format.combine(
        format.timestamp(),
        format.printf((info) => {
            const timestamp = info.timestamp.trim();
            const { level } = info;
            const message = (info.message || '').trim();
            const args = info[Symbol.for('splat')];
            const strArgs = (args || [])
                .map((arg) =>
                    util.inspect(arg, {
                        colors: true,
                    }),
                )
                .join(' ');
            return `[${timestamp}] ${level} ${message} ${strArgs}`;
        }),
    ),
    transports: [new transports.Console()],
});

export default logger;
