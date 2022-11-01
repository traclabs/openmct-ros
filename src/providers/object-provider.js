import { OBJECT_TYPES, NAMESPACE, ROOT_KEY } from '../const';

export default class RosObjectProvider {
    constructor(openmct, url) {
        this.openmct = openmct;
        this.url = url;
        this.namespace = NAMESPACE;
        this.rootObject = null;
        this.mctObjects = {};
        this.rosTopicsLoaded = false;
        this.fetchRosTopicsPromise = null;

        this.#initialize();
    }

    async #initialize() {
        this.rootObject = this.#createRootObject();
        await this.#loadTopics();
    }

    // eslint-disable-next-line require-await
    async #fetchFromRos(url) {
        throw new Error(`Not implemented to work ${url}`);
    }

    async #loadTopics() {
        if ((!this.rosTopicsLoaded && !this.fetchRosTopicsPromise)) {

            const rosBridgeUrl = this.url;
            if (!this.fetchRosTopicsPromise) {
                try {
                    this.fetchRosTopicsPromise = this.#fetchFromRos(rosBridgeUrl);
                    const topicsArray = await this.fetchRosTopicsPromise;
                    topicsArray.forEach(rosTopic => {
                        this.#addRosTopic(rosTopic, this.rootObject);
                    }
                    );
                    this.fetchRunningProcfetchRosTopicsPromiseeduresPromise = null;
                } catch (error) {
                    console.error(`😱 Error loading ROS Topics - ${error.message}`, error);
                }
            }
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
        // If we've created the object already, add it
        if (Object.hasOwn(this.mctObjects, key)) {
            return this.mctObjects[key];
        }

        // Otherwise, grab the from the list of ROS Topics
        await this.#loadTopics();

        return this.mctObjects[key];
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
        this.mctObjects[object.identifier.key] = object;
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
