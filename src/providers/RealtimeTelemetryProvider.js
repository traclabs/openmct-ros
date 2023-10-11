import { OBJECT_TYPES } from '../const';
import ROSLIB from 'roslib';

export default class RealtimeTelemetryProvider {
    constructor(openmct, rosConnection) {
        this.openmct = openmct;
        this.rosConnection = rosConnection;
        this.subscriptionsById = {};
    }
    async requestLatest(domainObject) {
        console.debug(`📡 Requesting latest for ${domainObject.identifier.key}`);

        return {
            id: domainObject.identifier,
            timestamp: Date.now(),
            value: 2
        };
    }
    async #buildSubscription(domainObject, callback) {
        const id = domainObject.identifier.key;
        const rosTopicName = id.replace(/\./g, '/');
        const ros = await this.rosConnection.getConnection();
        const topic = new ROSLIB.Topic({
            ros,
            name: `'/${rosTopicName}`
        });

        return {
            topic,
            id,
            topicName: rosTopicName,
            callback
        };
    }

    supportsSubscribe(domainObject) {
        return Object.values(OBJECT_TYPES).includes(domainObject.type);
    }

    subscribe(domainObject, callback) {
        this.#buildSubscription(domainObject, callback).then(subscriptionDetails => {
            subscriptionDetails.topic.subscribe(callback);
            this.subscriptionsById[subscriptionDetails.id] = subscriptionDetails;
        });

        return () => {
            console.debug(`☎️ Should be unsubscribing here`);
        };
    }
}
