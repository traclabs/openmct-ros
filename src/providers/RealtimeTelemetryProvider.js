import { OBJECT_TYPES } from '../const';
import ROSLIB from 'roslib';
import { LRUCache } from 'lru-cache';

export default class RealtimeTelemetryProvider {
    constructor(openmct, rosConnection) {
        this.openmct = openmct;
        this.rosConnection = rosConnection;
        this.subscriptionsById = {};
    }
    // eslint-disable-next-line require-await
    async request(domainObject, options) {
        const startTelemetry = options.start;
        const endTelemetry = options.end;
        const subscriberID = domainObject.identifier.key;
        const cache = this.subscriptionsById[subscriberID]?.cache;
        // from the cache, extract all the values that are within the requested range
        let dataToBeReturned = [];
        const cacheIterator = cache ? cache.values() : null;

        if (cacheIterator) {
            let next = cacheIterator.next();
            while (!next.done) {
                if ((next.value) && (next.value.timestamp >= startTelemetry && next.value.timestamp <= endTelemetry)) {
                    const datum = {
                        id: domainObject.identifier,
                        value: next.value.value,
                        timestamp: next.value.timestamp
                    };
                    dataToBeReturned.push(datum);
                }

                next = cacheIterator.next();
            }
        }

        console.debug(`📡 Found data of size ${dataToBeReturned.length} `);

        return dataToBeReturned;
    }
    async #buildSubscription(domainObject, callback) {
        if (this.subscriptionsById[domainObject.identifier.key]) {
            return this.subscriptionsById[domainObject.identifier.key];
        }

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
            cache: new LRUCache({max: 100000})
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
                const timestamp = Date.now();
                const datum = {
                    id: domainObject.identifier,
                    timestamp,
                    value
                };
                subscriptionDetails.cache.set(timestamp, datum);
                callback(datum);
            });
            this.subscriptionsById[subscriberID] = subscriptionDetails;
        });

        return () => {
            // right now, we'll just accumulate data
            // this.subscriptionsById[subscriberID].topic.unsubscribe();
            // delete this.subscriptionsById[subscriberID];
        };
    }
}
