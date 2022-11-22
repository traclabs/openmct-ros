import { OBJECT_TYPES, NAMESPACE, ROOT_KEY } from '../const';

export default class RosObjectProvider {
    constructor(openmct, url) {
        this.openmct = openmct;
        this.url = url;
        this.namespace = NAMESPACE;
        this.rootObject = null;
        this.dictionary = {};
        this.fetchRosTopicsPromise = null;

        this.#initialize();
    }

    #initialize() {
        this.rootObject = this.#createRootObject();
    }

    async #doSomeWebSocketStuff() {
        console.debug(`👺 Should be Fetching ROS Topics from ${this.url}`);
        await new Promise(resolve => setTimeout(resolve, 100));

        return [];
    }

    async #fetchFromRos() {
        try {
            const topicsArray = await this.#doSomeWebSocketStuff();
            topicsArray.forEach(rosTopic => {
                this.#addRosTopic(rosTopic, this.rootObject);
            }
            );
        } catch (error) {
            console.error(`😱 Error loading ROS Topics - ${error.message}`, error);
        }
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

    // eslint-disable-next-line require-await
    async #addRosTopic(rosTopic, parent) {
        const id = 'TODO';
        const topicTitle = 'No Title';

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
