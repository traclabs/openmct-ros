import { OBJECT_TYPES } from '../const';
import ROSLIB from 'roslib';

export default class RealtimeTelemetryProvider {
    constructor(openmct, rosConnection) {
        this.openmct = openmct;
        this.rosConnection = rosConnection;
        this.subscriptionsById = {};
    }
    // eslint-disable-next-line require-await
    async request(domainObject) {
        console.debug(`📡 Requesting latest for ${domainObject.identifier.key}`);
        const subscriberID = domainObject.identifier.key;
        const latestValue = this.subscriptionsById[subscriberID]?.latestValue;
        const datum = {
            id: domainObject.identifier,
            timestamp: Date.now(),
            value: latestValue
        };

        return datum;
    }
    async #buildSubscription(domainObject, callback) {
        console.debug(`📡 Building subscription for ${domainObject.identifier.key}`);
        const id = domainObject.identifier.key;
        const rosTopicName = domainObject.rosTopic.replace(/\./g, '/');
        const ros = await this.rosConnection.getConnection();
        const topic = new ROSLIB.Topic({
            ros,
            name: `/${rosTopicName}`,
            messageType: domainObject.rosType
        });

        return {
            topic,
            id,
            topicName: rosTopicName,
            callback,
            latestValue: null
        };
    }

    supportsSubscribe(domainObject) {
        return Object.values(OBJECT_TYPES).includes(domainObject.type);
    }

    supportsRequest(domainObject) {
        return Object.values(OBJECT_TYPES).includes(domainObject.type);
    }

    subscribe(domainObject, callback) {
        const subscriberID = domainObject.identifier.key;
        this.#buildSubscription(domainObject, callback).then(subscriptionDetails => {
            subscriptionDetails.topic.subscribe((data) => {
                // value is the addressed value in the message
                // e.g., for a message like {x: 5, y: 2, z: 4}
                // and an id of someTopic.color._x, the value is just 5
                const splitId = subscriberID.split('.');
                const lastKey = splitId[splitId.length - 1];
                const lastKeyWithoutUnderscore = lastKey.replace('_', '');
                const value = data[lastKeyWithoutUnderscore];
                const datum = {
                    id: domainObject.identifier,
                    timestamp: Date.now(),
                    value
                };
                subscriptionDetails.latestValue = value;
                callback(datum);
            });
            this.subscriptionsById[subscriberID] = subscriptionDetails;
        });

        return () => {
            console.debug(`📡 Unnsubscribing to ${subscriberID}`);
            this.subscriptionsById[subscriberID].topic.unsubscribe();
            delete this.subscriptionsById[subscriberID];
        };
    }
}
