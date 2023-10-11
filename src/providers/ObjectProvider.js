import { OBJECT_TYPES, NAMESPACE, ROOT_KEY } from '../const';

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

    "byte": "byte",
    "string": "string",
    "bool": "bool"
};

export default class RosObjectProvider {
    constructor(openmct, rosConnection) {
        this.openmct = openmct;
        this.rosConnection = rosConnection;
        this.namespace = NAMESPACE;
        this.rootObject = null;
        this.dictionary = {};
        this.fetchRosTopicsPromise = null;

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
            // FIXME: this is currently broken due to a bug in rosapi
            // const messageDetails = await this.#getMessageDetails(ros, messageType);
            const messageDetails = {};
            console.debug('🥕 Fetched details for topic', topic);
            this.#addRosTopic({
                topic,
                messageType,
                messageDetails,
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
                console.debug('🥕 Received details for', messageType);
                const decodeMessageDetails = ros.decodeTypeDefs(details);
                console.debug('🥕 Decoded message for', messageType);
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

    #addRosTopic({topic, messageType, messageDetails, parent}) {
        const santizedName = topic.replace(/\//g, '.').slice(1);
        const id = santizedName;
        const topicTitle = santizedName;

        const location = this.openmct.objects.makeKeyString({
            key: parent.identifier.key,
            namespace: parent.identifier.namespace
        });
        const obj = {
            identifier: {
                key: id,
                namespace: this.namespace
            },
            type: OBJECT_TYPES.ROS_TOPIC_TYPE,
            name: topicTitle,
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

        this.#addObject(obj);

        parent.composition.push(obj.identifier);
    }
}
