import { OBJECT_TYPES, ROOT_KEY } from '../const';

// eslint-disable-next-line no-unused-vars
const formatConversionMap = {
    "uint64": "int",
    "int64": "int",
    "uint32": "int",
    "int32": "int",
    "uint16": "int",
    "int16": "int",
    "uint8": "int",
    "int8": "int",

    "float32": "float",
    "float64": "float",
    "float": "float",
    "double": "float",

    "byte": "byte",
    "string": "string",
    "bool": "bool"
};

export default class RosObjectProvider {
    constructor(openmct, rosConnection, namespace, flattenArraysToSize) {
        this.openmct = openmct;
        this.rosConnection = rosConnection;
        this.namespace = namespace;
        this.rootObject = null;
        this.dictionary = {};
        this.fetchRosTopicsPromise = null;
        this.flattenArraysToSize = flattenArraysToSize;

        this.#initialize();
    }

    #initialize() {
        this.rootObject = this.#createRootObject();
    }

    async getRosTopics(ros) {
        const result = await new Promise((resolve, reject) => {
            ros.getTopics((topics) => {
                console.debug('🥕 Result for topics', topics);
                resolve(topics);
            }, (error) => {
                reject(error);
            });
        });

        return result;
    }

    async #fetchFromRos() {
        const ros = await this.rosConnection.getConnection();
        const {topics, types} = await this.getRosTopics(ros);
        // eslint-disable-next-line require-await
        await Promise.all(topics.map(async (topic, index) => {
            console.debug('🥕 Attempting to add topic', topic);
            const messageType = types[index];
            const messageDetails = await this.#getMessageDetails(ros, messageType);
            const name = topic.replace(/\//g, '.').slice(1);
            console.debug(`🥕 Fetched details for topic ${topic}`, messageDetails);
            this.#addRosTelemetry({
                name,
                type: OBJECT_TYPES.ROS_TOPIC_TYPE,
                messageDetails,
                rosType: messageType,
                rosTopic: name,
                parent: this.rootObject
            });
            console.debug('🥕 Added topic', topic);
        }
        ));
        console.debug('🥕 Dictionary loaded', this.dictionary);
    }

    #getMessageDetails(ros, messageType) {
        return new Promise ((resolve, reject) => {
            console.debug('🥕 Asking for details for', messageType);
            ros.getMessageDetails(messageType, (details) => {
                console.debug(`🥕 Received details for ${messageType}`, details);
                const decodeMessageDetails = ros.decodeTypeDefs(details);
                console.debug('🥕 Decoded message for', decodeMessageDetails);
                resolve(decodeMessageDetails);
            }, (error) => {
                console.error('🥕 Error fetching message details', error);
                reject(error);
            });
        });
    }

    #loadRosDictionary() {
        if (!this.fetchRosTopicsPromise) {
            this.fetchRosTopicsPromise = this.#fetchFromRos();
        }

        return this.fetchRosTopicsPromise;
    }

    #createRootObject() {
        const rootObject = {
            identifier: {
                key: ROOT_KEY,
                namespace: this.namespace
            },
            name: 'ROS Topics',
            type: 'folder',
            location: 'ROOT',
            composition: []
        };
        this.#addObject(rootObject);

        return rootObject;
    }

    async get(identifier) {
        const { key } = identifier;
        await this.#loadRosDictionary();
        const object = this.dictionary[key];

        return object;
    }

    supportsSearchType(type) {
        // return type === this.openmct.objects.SEARCH_TYPES.OBJECTS;
        // TODO: support object search by querying ROS
        return false;
    }

    // eslint-disable-next-line require-await
    async search(query, options) {
        return [];
    }

    #addObject(object) {
        this.dictionary[object.identifier.key] = object;
    }

    #isAggregateMessage(type) {
        return type === OBJECT_TYPES.ROS_AGGREGATE_MESSAGE || type === OBJECT_TYPES.ROS_TOPIC_TYPE;
    }

    #addRosTelemetry({name, type, rosType, rosTopic, messageDetails, parent}) {
        const location = this.openmct.objects.makeKeyString({
            key: parent.identifier.key,
            namespace: parent.identifier.namespace
        });
        const subMessageKeys = typeof messageDetails === 'object' ? Object.keys(messageDetails) : [];

        let determinedType = type;
        // if type is null, determine if we're a lead or aggregate message
        if (!determinedType) {
            if (subMessageKeys.length > 0) {
                determinedType = OBJECT_TYPES.ROS_AGGREGATE_MESSAGE;
            } else {
                determinedType = OBJECT_TYPES.ROS_LEAF_MESSAGE;
            }
        }

        console.debug(`Creating telemetry for ${name} with type ${determinedType} and rosType ${rosType} and rosTopic ${rosTopic}`, messageDetails);

        let determinedName = name;
        if (determinedType !== OBJECT_TYPES.ROS_TOPIC_TYPE) {
            determinedName = `${parent.identifier.key}.${name}`;
        }

        const newMctObject = {
            identifier: {
                key: determinedName,
                namespace: this.namespace
            },
            type: determinedType,
            name: determinedName,
            rosType,
            rosTopic,
            location: location,
            configuration: {},
            telemetry: {
                values: [{
                    key: 'utc',
                    source: 'timestamp',
                    name: 'Timestamp',
                    format: 'iso',
                    hints: {
                        domain: 1
                    }
                }]
            }
        };

        if (this.#isAggregateMessage(determinedType)) {
            subMessageKeys.forEach((subMessageKey) => {
                let subMessageDetail = messageDetails[subMessageKey];
                if (Array.isArray(subMessageDetail)) {
                    // replace subMessageDetail with X elements equal to this.flattenArraysToSize
                    subMessageDetail = new Array(this.flattenArraysToSize).fill(subMessageDetail[0]);
                }

                const format = formatConversionMap[subMessageDetail];
                if (format) {
                    const telemetryValue = {
                        key: `${determinedName}.${subMessageKey}`,
                        source: subMessageKey,
                        name: subMessageKey,
                        format,
                        rosType: subMessageDetail,
                        hints: {
                            domain: 1
                        }
                    };
                    newMctObject.telemetry.values.push(telemetryValue);
                }

                this.#addRosTelemetry({
                    name: subMessageKey,
                    messageDetails: subMessageDetail,
                    rosType,
                    rosTopic,
                    parent: newMctObject
                });
            });
        } else {
            // leaf node
            const format = formatConversionMap[messageDetails];
            if (format) {
                const telemetryValue = {
                    key: 'value',
                    name: 'Value',
                    format,
                    rosType: messageDetails,
                    hints: {
                        range: 1
                    }
                };
                newMctObject.telemetry.values.push(telemetryValue);
            }
        }

        this.#addObject(newMctObject);

        if (!parent.composition) {
            parent.composition = [];
        }

        parent.composition.push(newMctObject.identifier);
    }
}
