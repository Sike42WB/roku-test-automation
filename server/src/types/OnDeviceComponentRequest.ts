import * as express from 'express';

export namespace ODC {
	export enum RequestEnum {
		callFunc,
		deleteNodeReferences,
		deleteRegistrySections,
		getFocusedNode,
		getNodeReferences,
		getServerHost,
		getValueAtKeyPath,
		getValuesAtKeyPaths,
		handshake,
		hasFocus,
		isInFocusChain,
		observeField,
		readRegistry,
		setValueAtKeyPath,
		storeNodeReferences,
		writeRegistry,
	}
	export type RequestTypes = keyof typeof RequestEnum;

	export enum BaseEnum {
		global,
		scene,
		nodeRef
	}
	export type BaseTypes = keyof typeof BaseEnum;

	export declare type LogLevels = 'off' | 'error' | 'warn' | 'info' | 'debug' | 'verbose';

	export interface BaseArgs {
		/** Specifies what the entry point is for this key path. Defaults to 'global' if not specified */
		base?: BaseTypes;

		/** If base is 'nodeRef' this is the key that we used to store the node references on. If one isn't provided we use the automatically generated one */
		key?: string;
	}

	export interface BaseKeyPath extends BaseArgs, MaxChildDepth {
		/** Holds the hierarchy value with each level separated by dot for ex: videoNode.title to what you are interested in getting the value from or written to. */
		keyPath: string;

		/** We have to convert nodes before converting to json. If this isn't needed then it causes a fairly significant overhead */
		convertResponseToJsonCompatible?: boolean;
	}

	interface MaxChildDepth {
		/** Controls how deep we'll recurse into node's tree structure. Defaults to 0 */
		responseMaxChildDepth?: number;
	}

	export interface CallFuncArgs extends BaseKeyPath {
		/** Name of the function that needs to be called. */
		funcName: string;

		/** List of input arguments that need to be passed to the function. */
		funcParams?: any[];

		/** Specifies whether it should be allowed to call the function interface without any arguments  */
		allowWithoutArgs?: boolean;
	}

	export interface GetFocusedNodeArgs extends MaxChildDepth {}

	export interface GetValueAtKeyPathArgs extends BaseKeyPath {}

	export interface GetValuesAtKeyPathsArgs {
		/** Retrieve multiple values with a single request. A list of the individual getValueAtKeyPath args */
		requests: {
			[key: string]: GetValueAtKeyPathArgs;
		};
	}

	export interface HasFocusArgs extends BaseKeyPath {}

	export interface IsInFocusChainArgs extends BaseKeyPath {}

	export interface StoreNodeReferences {
		/** Key that we will store the node references on. If one isn't provided we use the automatically generated one */
		key?: string;
	}

	export interface GetNodeReferences {
		/** Key that the references were stored on. If one isn't provided we use the automatically generated one */
		key?: string;

		/** indexes in the array of which nodes we want to retrieve */
		indexes: number[]
	}

	export interface DeleteNodeReferences {
		/** Key that the references were stored on */
		key?: string;
	}

	// TODO build out to support more complicated types
	export type ObserveFieldMatchValueTypes = string | number | boolean;

	interface MatchObject extends BaseKeyPath {
		/** If the match value is passed in then the observer will be fired when the field value equals to the value in match */
		value: ObserveFieldMatchValueTypes;
	}

	export interface ObserveFieldArgs extends BaseKeyPath {
		/** If the `keyPath` does not exist yet, this specifies how often to recheck to see if it now exists in milliseconds */
		retryInterval?: number;

		/** If the `keyPath` does not exist yet, this specifies how long to wait before erroring out in milliseconds */
		retryTimeout?: number;

		/** If provided will only return when this matches (including if it already equals that value) */
		match?: MatchObject | ObserveFieldMatchValueTypes;
	}

	export interface SetValueAtKeyPathArgs extends BaseKeyPath {
		/** Value that needs to be set to the field. Field path is defined by key path. */
		value: any;
	}

	export interface ReadRegistryArgs {
		/** List of Section keys of which we need data to be read, if empty then it will return entire contents of the registry */
		values?: {
			[section: string]: string[] | string
		};
	}

	export interface WriteRegistryArgs {
		/** Contains data that will be written to registry. If null is passed for a sectionItemKey that key will be deleted. If null is passed for a section that entire section will be deleted. */
		values: {
			[section: string]: {[sectionItemKey: string]: string | null}
		};
	}

	export interface DeleteRegistrySectionsArgs {
		/** Contains list of section keys that needs to be deleted. */
		sections: string[] | string;

		/** If true deletes the entry registry. */
		allowEntireRegistryDelete?: boolean;
	}

	// tslint:disable-next-line: no-empty-interface
	export interface DeleteEntireRegistrySectionsArgs {}

	// tslint:disable-next-line: no-empty-interface
	export interface GetServerHostArgs {}

	export type RequestArgs = CallFuncArgs | GetFocusedNodeArgs | GetValueAtKeyPathArgs | GetValuesAtKeyPathsArgs | HasFocusArgs | IsInFocusChainArgs | ObserveFieldArgs | SetValueAtKeyPathArgs | ReadRegistryArgs | WriteRegistryArgs | DeleteRegistrySectionsArgs | DeleteEntireRegistrySectionsArgs;

	export interface RequestOptions {
		/** How long to wait (in milliseconds) until the request is considered a failure. If not provided OnDeviceComponent.defaultTimeout is used  */
		timeout?: number;
	}

	export interface Request {
		id: string;
		callbackPort: number;
		args: RequestArgs;
		type: RequestTypes;
		settings: {
			logLevel: LogLevels
		};
		callback?: (req: express.Request) => void;
		version: string;
	}

	export interface NodeRepresentation {
		// Allow other fields
		[key: string]: any;
		change: {
			Index1: number
			Index2: number
			Operation: string
		};
		childRenderOrder?: 'renderFirst' | 'renderLast';
		children: NodeRepresentation[];
		clippingRect?: [number, number, number, number];
		enableRenderTracking?: boolean;
		focusedChild: NodeRepresentation;
		focusable: boolean;
		id: string;
		inheritParentOpacity?: boolean;
		inheritParentTransform?: boolean;
		muteAudioGuide?: boolean;
		opacity?: number;
		renderPass?: number;
		renderTracking?: 'none' | 'partial' | 'full';
		rotation?: number;
		scale?: [number, number];
		scaleRotateCenter?: [number, number];
		subtype: string;
		translation?: [number, number];
		visible?: boolean;
	}

	export interface NodeTree {
		id: string;

		/** What type of node this as returned by node.subtype() */
		subtype: string;

		/** This is the reference to the index it was stored at that we can use in later calls. If -1 we don't have one. */
		ref: number;

		/** Same as ref but for the parent  */
		parentRef: number;

		children: NodeTree[];

		/** Let's us distinguish global node as it's own separate node from the Scene */
		global: boolean;
	}

	export interface ReturnTimeTaken {
		/** How this request took to run on the device */
		timeTaken: number;
	}
}
