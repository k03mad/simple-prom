import os from 'node:os';

import client from 'prom-client';

/**
 * @param {object} opts
 * @param {string} opts.appName
 * @param {string|number} opts.port
 * @param {object} [opts.metrics]
 * @param {string[]} [opts.metricsTurnOff]
 */
export const registerMetrics = ({appName, port, metrics, metricsTurnOff = []}) => {
    const filteredMetrics = metrics
        ? Object.fromEntries(
            Object.entries(metrics).filter(
                ([key]) => !metricsTurnOff.includes(key),
            ),
        )
        : {};

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
                        console.error(`>> ${name}`);
                        console.error(err);
                    }
                },
            });

            register.registerMetric(gauge);
        });

    return register;
};
