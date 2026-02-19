import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import {nameText, numText} from '../helpers/colors.js';

import {registerMetrics} from './register.js';

/**
 * @param {object} opts
 * @param {string} opts.appName
 * @param {string|number} opts.port
 * @param {object} opts.metrics
 * @param {string[]} opts.metricsTurnOff
 * @param {boolean} opts.debug
 * @param {string} opts.static
 */
export const startMetricsServer = ({
    appName,
    port,
    metrics,
    metricsTurnOff,
    debug,
    static: staticOpts,
}) => {
    const register = registerMetrics({appName, port, metrics, metricsTurnOff});

    const app = express();

    if (debug) {
        app.use(morgan('combined'));
    }

    app.use(compression());

    if (staticOpts?.folder) {
        if (staticOpts.beforeHelmet) {
            app.use(express.static(staticOpts.folder));
            app.use(helmet());
        } else {
            app.use(helmet());
            app.use(express.static(staticOpts.folder));
        }
    } else {
        app.use(helmet());
    }

    app.get('/metrics', async (req, res) => {
        const data = await register.metrics();
        res.send(data);
    });

    app.listen(port, () =>
        console.log(
            [
                `[${String(new Date())}]\n${nameText(appName)}`,
                'started on port',
                numText(port),
            ].join(' '),
        ),
    );
};
