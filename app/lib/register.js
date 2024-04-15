import os from 'node:os';

import {logError} from '@k03mad/simple-log';
import client from 'prom-client';

/**
 * @param {object} opts
 * @param {string} opts.appName
 * @param {string|number} opts.port
 * @param {object} opts.metrics
 * @param {string[]} [opts.metricsTurnOff]
 */
export const registerMetrics = ({appName, port, metrics, metricsTurnOff = []}) => {
    const filteredMetrics = Object.fromEntries(
        Object.entries(metrics).filter(
            ([key]) => !metricsTurnOff.includes(key),
        ),
    );

    const register = new client.Registry();

    client.collectDefaultMetrics({register});
    register.setDefaultLabels({app: appName, port, host: os.hostname});

    Object
        .values(filteredMetrics)
        .forEach(metric => {
            const {collect, name, ...rest} = metric;

            const gauge = new client.Gauge({
                name,
                ...rest,
                async collect() {
                    try {
                        await collect(this);
                    } catch (err) {
                        logError([`>> ${name}`, err]);
                    }
                },
            });

            register.registerMetric(gauge);
        });

    return register;
};
