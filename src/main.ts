export type EqualityFn<T = unknown> = ( nodeData : T, comparehend : unknown ) => boolean; 

export interface Options<T = unknown> {
    equalityMatcher? : EqualityFn<T>;
    lessThanMatcher? : EqualityFn<T>;
    sorted? : boolean;
};

export const enum Compared {
    EQ = 0,
    GT = 1,
    LT = -1
};

export interface ClosestKeyDesc {
    desc : Compared;
    index : number;
};

export const enum OpStatus {
    FAILED = 'FAILED',
    SUCCESSFUL = 'SUCCESSFUL'
};

export const enum Status {
    NOOP = 'NOOP',
    REMOVED = 'REMOVED',
    UPDATED = 'UPDATED'
};

export interface TrieableNode<T = unknown> {
    data : T|null;
    children? : Array<TrieableNode<T>>;
    isBoundary? : boolean;
    parent? : TrieableNode<T>|null;
};

interface ChildNodeEntry<T = unknown> {
    bucketIndex : number;
    code : number;
    value: null|[ Node<T>, number ];
}

export type KeyType = string|number|symbol;

export interface TrieableNodeKeyMapping {
    data : KeyType;
    children : KeyType|Array<KeyType>;
    isBoundary : KeyType;
}

export const LT_TYPES_MSG = 'Default LessThan matcher can only be used with `null` values and `string`, `number`, `bigint`, `boolean` and `undefined` value types. For any other type, please provide a custom `isLessThanValue` function option.';

export const  LT_ARG_TYPES_MISMATCH_MSG = 'Default LessThan matcher requires both matched values to be of the same type and also accepts `undefined` and `null` values.';

const typeMapping = {
    string: undefined,
    number: undefined,
    bigint: undefined,
    boolean: undefined,
    undefined: undefined
};

export const getDescriptor : ( ( obj: any ) => string ) = (() => {
    const t = Object.prototype.toString;
    return obj => {
        const desc = t.call( obj );
        return desc.slice( desc.indexOf( ' ' ) + 1, -1 );
    };
})();

/** @throws { TypeError } */
export const lessThanValue : EqualityFn = ( a, b ) => {
    const typeA = typeof a;
    const typeB = typeof b;
    if( typeA === 'undefined' || a === null ) {
        return typeB !== 'undefined';
    }
    if( typeB === 'undefined' || b === null ) {
        return false;
    }
    if( !( typeA in typeMapping && typeB in typeMapping ) ) {
        throw new TypeError( LT_TYPES_MSG );
    }
    if( typeA !== typeB ) {
        throw new TypeError( LT_ARG_TYPES_MISMATCH_MSG );
    }
    return a < b;
};

/** Credit: curtesy of the lodash.eq() imnplementation */
export const sameValueZero : EqualityFn = ( a, b ) => a === b || ( a !== a && b !== b );

const TRIE_DESC = 'webKrafters.Trie';

const NODE_DESC = 'wbKrafters.Trie.Node';

export default class Trie<T = unknown> {
    private isLessThanValue : EqualityFn<T>;
    private isSameValue : EqualityFn<T>;
    private sorted : boolean;
    private root : Node<T>;
    /**
     * @param {NESTED_OBJECT} node 
     * @param {TrieableNodeKeyMapping} keyMap - keymap.children can be either an ordered array containing various names of individual properties to combine as children of a trieable node or a single value holding the name of property with either a single value or an iterable.  
     * @param {TrieableNode<T>?} parentNode 
     * @returns {TrieableNode<T>}
     * @template T = unknown
     * @template {{}} NESTED_OBJECT = {}
     */
    static makeTrieable<T = unknown, NESTED_OBJECT extends {} = {}>(
        node : NESTED_OBJECT,
        keyMap : TrieableNodeKeyMapping,
        parentNode : TrieableNode<T> = null
    ) {
        const t : TrieableNode<T> = {
            data: node[ keyMap.data ],
            parent: parentNode
        };
        try {
            if( keyMap.isBoundary in node && node[ keyMap.isBoundary ] === true ) {
                t.isBoundary = node[ keyMap.isBoundary ];
            }
        } catch( e ) {
            t.data = node as unknown as  T;
            return t;
        }
        if( Array.isArray( keyMap.children ) ) {
            const children = [];
            for( let cMap = keyMap.children, cLen = cMap.length, c = 0; c < cLen; c++ ) {
                if( !( cMap[ c ] in node ) ) {
                    children.push({ data: null, parent: t });
                    continue;
                }
                try {
                    keyMap.data in ( node[ cMap[ c ] ] ) &&
                        children.push( Trie.makeTrieable(
                            node[ cMap[ c ] ], keyMap, t
                        ) );
                } catch( e ) {
                    children.push({
                        data: node[ cMap[ c ] ],
                        parent: t
                    });
                }
            }
            if( children.length ) { t.children = children }
            return t;
        }
        if( !( keyMap.children in node ) ||
            typeof node[ keyMap.children ] === 'undefined' ||
            node[ keyMap.children ] === null
        ) {
            return t;
        }
        let children = node[ keyMap.children ];
        if( typeof children?.[ Symbol.iterator ] !== 'function' ) {
            children = [ children ];
        }
        t.children = [];
        for( let cLen = children.length, c = 0; c < cLen; c++ ) {
            t.children.push( Trie.makeTrieable(
                children[ c ], keyMap, t
            ) );
        }
        return t;
    }
    /**
     * @template {T = unknown}
     * @param {Array<Iterable<T>>?} data - Accepts an array of sequences of items to immediately create an initial tree at instantiation.
     * @param {Options?} opts - Options to modify certain default behaviors of this object. This instances use a sameValueZero comparison for equality check.
     * @example
     * ( 1 )
     * To create Trie instance with the following data:
     * [ 'Tennessee', 'MI', Nevada', 'Texas', 'Oregon', 'Michigan' ],
     * do the following:
     * new Trie<string>([ 'tennessee', 'mi', nevada', 'texas', 'oregon', 'michigan' ]) 
     * ( 2 )
     * A TrieableNode<T> mappping to a complete Trie<T> has this root node shape:
     * {
     *      data: null, <-- notice the `null` value for this property at the root level.
     *      children?: Array<TrieableNode<T>>,
     *      isBoundary?: boolean,
     *      parent?: any
     * }         
     */
    constructor( data? : Trie<T>, opts? : Options<T> );
    constructor( data? : TrieableNode<T>, opts? : Options<T> );
    constructor( data? : Array<TrieableNode<T>>, opts? : Options<T> );
    constructor( data? : Array<Iterable<T>>, opts? : Options<T> );
    constructor( data? : Array<Iterable<T>|TrieableNode<T>>, opts? : Options<T> );
    constructor( data, opts: Options<T> = {} ) {
        this.sorted = opts.sorted ?? false;
        this.isLessThanValue = opts.sorted === true
            ? opts.lessThanMatcher ?? lessThanValue
            : null;
        this.isSameValue = opts.equalityMatcher ?? sameValueZero;
        this.root = new Node<T>(
            null,
            this.isSameValue,
            this.isLessThanValue,
            typeof data === 'undefined' || Array.isArray( data )
                ? data
                : getDescriptor( data ) === TRIE_DESC
                    ? data.asTrieableNode().children
                    : data.data === null 
                        ? data.children // a single trieable node
                        : [ data ] // a single trieable node child
        );
    }
    get isEmpty() { return this.root.isEmpty }
    get size() { return this.root.size }
    /**
     * @template {T = unknown}
     * @param {Array<Iterable<T>>} data - Accepts a sequence of items to merge into the trie.
     */
    add( data : Iterable<T> ) { this.root.addChild([ ...data ]) }
    /**
     * @template {T = unknown}
     * @param {Array<Iterable<T>|TrieableNode<T>>} data - Accepts sequences of items and TrieableNodes or a combination thereof to merge into the trie.
     */
    addMany( data : Array<Iterable<T>> ) : void;
    addMany( data : Array<TrieableNode<T>> ) : void;
    addMany( data : Array<Iterable<T>|TrieableNode<T>> ) : void;
    addMany( data ) {
        for( let dLen = data.length, d = 0; d < dLen; d++ ) {
            isIterable( data[ d ]  )
                ? this.add( data[ d ] )
                : this.merge( data[ d ] );
        }
    }
    asArray( completeSequencesOnly = true ) : Array<Iterable<T>> {
        const array = this.root.asArray( completeSequencesOnly );
        for( let i = array.length; i--; ) {
            if( array[ i ].length ) {
                return array;
            }
        }
        return [];
    }
    asTrieableNode() { return this.root.asTrieableNode() }
    clear() { this.root.empty() }
    clone() {
        return new Trie<T>(
            this.asTrieableNode().children, {
                equalityMatcher: this.isSameValue,
                lessThanMatcher: this.isLessThanValue,
                sorted: this.sorted
            }
        );
    }
    getAllStartingWith(
        prefix : Iterable<T> = [],
        completeSequencesOnly : boolean = true
    ) {
        return this._getAllStartingWith([ ...prefix ], completeSequencesOnly );
    }
    getFarthestIn( sequence : Iterable<T> = [] ) : Iterable<T> {
        const _sequence = toArray( sequence );
        return _sequence.slice( 0, this.root.getDeepestNodeIn( _sequence ).index + 1 );
    }
    has( sequence : Iterable<T> ) {
        return !!this.root.getChildPrefixEnd( toArray( sequence ) )?.isSequenceBoundary;
    }
    isSame( trie : Trie<T> ) { return this === trie }
    matches( graph : Array<Iterable<T>> ) : boolean;
    matches( graph : Array<TrieableNode<T>> ) : boolean;
    matches( graph : TrieableNode<T> ) : boolean;
    matches( graph : Trie<T> ) : boolean;
    matches( graph ) {
        if( this.isSame( graph ) ) { return true }
        let g = graph;
        if( getDescriptor( graph ) === TRIE_DESC ) { g = g.root }
        else if( Array.isArray( g ) ) {
            if( isIterable( g[ 0 ] ) ) {
                const _g = new Array( g.length );
                for( let i = _g.length; i--; ) {
                    _g[ i ] = toArray( g[ i ] );
                }
                g = _g;
            } else {
                g = {
                    children: g,
                    data: null,
                    isBoundary: false,
                    parent: null
                };
            }
        }
        return this.root.isEqual( g );
    }
    /**
     * @template {T = unknown}
     * @param {Trie<T>|TrieableNode<T>} data - Accepts a data tree to merge into this trie.
     */
    merge( data : Trie<T> ) : void;
    merge( data : TrieableNode<T> ) : void;
    merge( data ) {
        if( getDescriptor( data ) === TRIE_DESC ) {
            for( let children = ( data as Trie<T> ).root.childNodes.list(), cLen = children.length, c = 0; c < cLen; c++ ) {
                this.root.merge( children[ c ] );
            }
            return;
        }
        if( data.data !== null ) {
            return this.root.mergeTrieableNode( data );
        }
        for( let children = data.children, cLen = children.length, c = 0; c < cLen; c++ ) {
            this.root.mergeTrieableNode( children[ c ] );
        }
    }
    /**
     * @template {T = unknown}
     * @param {Array<Iterable<T>>} data - Accepts sequences of items to remove from the trie.
     * @returns {boolean} - true is successfully removed; false otherwise
     */
    remove( data : Iterable<T> ) { return this.root.removeChild( toArray( data ) ) }  
    removeAllStartingWith( prefix : Iterable<T> = [] )  {
        const suffixStartNode = this.root.getChildPrefixEnd( toArray( prefix ) );
        suffixStartNode?.parentNode.childNodes.remove( suffixStartNode );
    }
    /**
     * @template {T = unknown}
     * @param {Array<Iterable<T>>} data - Accepts sequences of items to remove from the trie.
     * @returns {Array<"FAILED"|"SUCCESSFUL">} - A list of outcomes for each outcome removed.
     */
    removeMany( data : Array<Iterable<T>> ) {
        const results : Array<OpStatus> = [];
        for( let dLen = data.length, d = 0; d < dLen; d++ ) {
            results.push(
                this.remove( data[ d ] )
                    ? OpStatus.SUCCESSFUL
                    : OpStatus.FAILED
            );
        }
        return results;
    }
    protected _getNodeAtPrefixEnd( prefix : Iterable<T> ) {
        const pSequence = toArray( prefix );
        return pSequence.length
            ? this.root.getChildPrefixEnd( pSequence )
            : this.root;
    }
    private _getAllStartingWith( prefix : Array<T>, completeSequencesOnly ) {
        const suffixStartNode = this._getNodeAtPrefixEnd( prefix );
        if( !suffixStartNode || this.root === suffixStartNode ) { return [] }
        const sequences = suffixStartNode.asArray( completeSequencesOnly );
        for( let s = sequences.length; s--; ) {
            sequences[ s ] = prefix.concat( sequences[ s ] );
        }
        return sequences as Array<Iterable<T>>;
    }
}

Trie.prototype[ Symbol.toStringTag ] = TRIE_DESC;

export class Node<T = unknown> {
    private _cNodes : ChildNodes<T>;
    private _data : T|null;
    private _isEqualValue : EqualityFn<T>;
    private _isLessThanValue : EqualityFn<T>;
    private _isSequenceBoundary : boolean;
    private _pNode : Node<T>|null;
    constructor(
        data : T|null,
        isEqualValue : EqualityFn<T> = sameValueZero,
        isLessThanValue : EqualityFn<T> = null,
        successorData : Array<Iterable<T>|TrieableNode<T>> = [],
        pNode : Node<T> = null,
        isSequenceBoundary : boolean = false
    ) {
        this._data = data;
        this._pNode = pNode;
        this._isEqualValue = isEqualValue;
        this._isLessThanValue = isLessThanValue;
        this._cNodes = isLessThanValue !== null
            ? new SortedChildNodes( this._isEqualValue, this._isLessThanValue )
            : new ChronoChildNodes( this._isEqualValue );
        this._isSequenceBoundary = isSequenceBoundary;
        for( let dLen = successorData.length, d = 0; d < dLen; d++ ) {
            isIterable( successorData[ d ] )
                ? this.addChild([ ...successorData[ d ] as Iterable<T> ])
                : this.mergeTrieableNode( successorData[ d ] as TrieableNode<T> );
        }
    }
    get childNodes() { return this._cNodes }
    get data() { return this._data }
    get isEmpty() { return !this._countSequences( 1 ) }
    get isRoot() { return !this._pNode }
    get isSequenceBoundary() { return this._isSequenceBoundary }
    set isSequenceBoundary( flag : boolean ) { this._isSequenceBoundary = flag }
    get parentNode () { return this._pNode }
    get size() { return this._countSequences() }
    addChild( childData : Array<T> ) {
        if( !childData.length ) {
            if( !this.isRoot ) {
                this._isSequenceBoundary = true;
            }
            return;
        }
        const data = childData.shift();
        const existingChild = this._cNodes.get( data );
        existingChild !== null
            ? existingChild.addChild( childData )
            : this._cNodes.set( new Node<T>(
                data,
                this._isEqualValue,
                this._isLessThanValue,
                [ childData ],
                this,
                childData.length === 0
            ) );
    }
    /** converts this node into sequences of data */
    asArray( completeSequencesOnly = true, depth = 0 ) {
        const successors : Array<Array<T>> = [];
        const cLen = this._cNodes.size
        if( this._isSequenceBoundary || (
            !completeSequencesOnly && !cLen
        ) ) {
            let path : Array<T> = new Array( depth );
            path[ depth - 1 ] = this._data;
            successors.push( path );
        }
        if( !cLen ) { return successors }
        for( let cNodes = this._cNodes.list(), c = 0; c < cLen; c++ ) {
            const grandSuccessors = cNodes[ c ].asArray( completeSequencesOnly, depth + 1 );
            for( let gLen = grandSuccessors.length, g = 0; g < gLen; g++ ) {
                if( !this.isRoot ) {
                    grandSuccessors[ g ][ depth - 1 ] = this._data;
                }
                successors.push( grandSuccessors[ g ] );
            }
        }
        return successors;
    }
    /** converts this node into a trieableNode */
    asTrieableNode( parentTrieableNode : TrieableNode<T> = null ) {
        const trieableNode : TrieableNode<T> = {
            children: [],
            data: this._data,
            isBoundary: this._isSequenceBoundary,
            parent: parentTrieableNode,
        };
        for( let children = this._cNodes.list(), cLen = children.length, c = 0; c < cLen; c++ ) {
            trieableNode.children.push( children[ c ].asTrieableNode( trieableNode ) );
        }
       return trieableNode;
    }
    empty() { this._cNodes.clear() }
    getChildPrefixEnd( prefix : Array<T> = [] ) {
        const deepestInfo = this.getDeepestNodeIn( prefix );
        return deepestInfo.index === prefix.length - 1
            ? deepestInfo.node
            : null;
    }
    getDeepestNodeIn({ length: sLen, ...sequence } : Array<T> = [] ) {
        const result = { index: -1, node: null as Node<T> };
        if( !sLen ) { return result }
        let s = 0;
        let currentNode : Node<T> = this;
        do {
            if( !currentNode.childNodes.size ) { return result }
            currentNode = currentNode.childNodes.get( sequence[ s ] );
            if( currentNode === null ) { return result }
            result.index = s;
            result.node = currentNode;
            s++;
        } while( s < sLen );
        return result;
    }
    isEqual( graph : Array<Array<T>> ) : boolean;
    isEqual( graph : Node<T> ) : boolean;
    isEqual( graph : TrieableNode<T> ) : boolean;
    isEqual( graph ) : boolean {
        const arr = this.asArray();
        const cArr = !Array.isArray( graph )
            ? ( getDescriptor( graph ) === NODE_DESC ? graph : new Trie( graph ) ).asArray()
            : [ ...graph ];
        if( cArr.length !== arr.length ) { return false }
        for( let a = arr.length; a--; ) {
            const thisSequence = arr[ a ];
            for( let c = cArr.length; c--; ) {
                const compSequence = cArr[ c ];
                if( compSequence.length !== thisSequence.length ) {
                    continue;
                }
                let found = true;
                for( let i = compSequence.length; i--; ) {
                    if( !this._isEqualValue(
                        compSequence[ i ],
                        thisSequence[ i ]
                    ) ) {
                        found = false;
                        break;
                    }
                }
                if( found ) {
                    cArr.splice( c, 1 );
                    break;
                }
            }
        }
        return !cArr.length;
    }
    merge( node : Node<T> ) {
        let match = this._cNodes.get( node.data );
        if( match === null ) {
            this._cNodes.set( node );
            return;
        }
        if( !match.isSequenceBoundary ) {
            match.isSequenceBoundary = node.isSequenceBoundary;
        }
        for( let d = 0, data = node._cNodes.list(), dLen = data.length; d < dLen; d++ ) {
            match.merge( data[ d ] );
        }
        return;
    }
    mergeTrieableNode( trieableNode : TrieableNode<T> ) {
        let match = this._cNodes.get( trieableNode.data );
        if( match === null ) {
            this._cNodes.set( new Node<T>(
                trieableNode.data,
                this._isEqualValue,
                this._isLessThanValue,
                trieableNode.children,
                this,
                trieableNode.isBoundary
            ) );
            return;
        }
        if( !match.isSequenceBoundary ) {
            match.isSequenceBoundary = trieableNode.isBoundary;
        }
        for( let d = 0, data = trieableNode.children, dLen = data.length; d < dLen; d++ ) {
            match.mergeTrieableNode( data[ d ] );
        }
        return;
    }
    removeChild( childData : Array<T> ) {
        const status = this._removeChild( childData );
        return status === Status.REMOVED || status === Status.UPDATED;
    }
    private _countSequences( minCount = 0, count = { value: 0 } ) {
        count.value += this._isSequenceBoundary && !this.isRoot ? 1 : 0;
        for( let cNodes = this._cNodes.list(), c = cNodes.length; c--; ) {
            cNodes[ c ]._countSequences( minCount, count );
            if( minCount > 0 && minCount === count.value ) { break }
        }
        return count.value;
    }
    /** can only remove child if all childData exist in the descendant nodes to form a bounded range (a.k.a. sequence) */
    private _removeChild( childData : Array<T>, currentChildIndex : number = 0 ) : Status {
        const currentNode = this._cNodes.get( childData[ currentChildIndex ] );
        if( currentNode === null ) { return Status.NOOP }
        if( currentChildIndex === childData.length - 1 ) {
            if( !currentNode._isSequenceBoundary ) { return  Status.NOOP }
            if( currentNode._cNodes.size ) {
                currentNode._isSequenceBoundary = false;
                return Status.UPDATED;
            }
            const siblings = currentNode._pNode._cNodes;
            siblings.remove( currentNode );
            return siblings.size ? Status.UPDATED : Status.REMOVED;
        }
        const status = currentNode._removeChild( childData, currentChildIndex + 1 );
        if( status === Status.REMOVED ) {
            if( currentNode._isSequenceBoundary ) { return Status.UPDATED }
            const siblings = currentNode._pNode._cNodes;
            siblings.remove( currentNode );
            if( siblings.size ) { return Status.UPDATED }
        }
        return status;
    }
}

Node.prototype[ Symbol.toStringTag ] = NODE_DESC;

export abstract class ChildNodes<T = unknown> {
    protected codes : Array<number>;
    protected keys : Array<T>;
    protected buckets : Array<Array<[Node<T>, number]>>; // [node, keys Index]
    protected isEqualValue : EqualityFn<T>;
    constructor( isEqualityValue : EqualityFn<T> ) {
        this.clear();
        this.isEqualValue = isEqualityValue;
    }
    get size() { return this.keys.length }
    clear() {
        this.codes = [];
        this.keys = [];
        this.buckets = []; 
    }
    get( key : T ) {
        let code : number; 
        if( this._optForKeyLocator( key ) ) {
            const i = this.indexOf( key );
            if( i === -1 ) { return null }
            code = this.codes[ i ];
        }    
        return this._get( key, code );
    }
    list() {
        const nodes : Array<Node<T>> = [];
        for( let codes = this.codes, cLen = codes.length, c = 0; c < cLen; c++ ) {
            const bucket = this.buckets[ codes[ c ] ];
            for( let b = bucket.length; b--; ) {
                if( bucket[ b ][ 1 ] !== c ) { continue }
                nodes.push( bucket[ b ][ 0 ] );
                break;
            }
        }
        return nodes;
    }
    abstract indexOf( data : T ) : number;
    remove( node : Node<T> ) {
        const { code, bucketIndex } = this._optForKeyLocator( node.data )
            ? this._getEntryByKeyIndex( this.indexOf( node.data ) )
            : this._getEntry(  node.data )
        this._splice( code, bucketIndex );
    }
    set( node : Node<T> ) { this._set( node ) }
    protected _get( key : T, code : number = null ) {
        const { value } = this._getEntry( key, code );
        if( value === null ) { return null }
        return value[ 0 ];
    }
    protected _getEntry( key : T, code : number = null ) {
        if( code === null ) { code = robustHash( key ) }
        const entry : ChildNodeEntry<T> = { code, value: null, bucketIndex: -1 };
        const bucket = this.buckets[ code ];
        if( typeof bucket === 'undefined' ) { return entry }
        for( let b = bucket.length; b--; ) {
            if( this.isEqualValue( key, bucket[ b ][ 0 ].data ) ) {
                entry.bucketIndex = b;
                entry.value = bucket[ b ];
                return entry;
            }
        }
        return entry;
    }
    protected _getEntryByKeyIndex( i : number ) {
        if( i === -1 ) { return }
        const key = this.keys[ i ];
        const code = this.codes[ i ];
        return this._getEntry( key, code );
    }
    protected _set( node : Node<T>, code : number = null ) {
        const { data: key } = node;
        const { code: _code, value } = this._getEntry( key, code );
        if( value !== null ) { return }
        this._splice( _code, node );
    }
    protected abstract _optForKeyLocator( key : T ) : boolean;
    protected _splice( code : number, bucketIndex : number ) : void; // deletion
    protected _splice( code : number, newNode : Node<T>, insertionIndex? : number )  : void;  // insertion
    protected _splice( a, b, i = -1 ) {
        if( typeof b === 'number' ) {
            if( b < 0 || b > this.size - 1 ) { return }
            i = this.buckets[ a ][ b ][ 1 ];
            this.buckets[ a ].splice( b, 1 );
            this.codes.splice( i, 1 );
            this.keys.splice( i, 1 );
            return this._syncBuckets( i );
        }
        if( getDescriptor( b ) !== NODE_DESC ) { return }
        const { size } = this;
        i = i < 0 || i > size ? size : i;
        if( typeof this.buckets[ a ] === 'undefined' ) {
            this.buckets[ a ] = [[ b, i ]];
        } else {
            this.buckets[ a ].push([ b, i ]);
        }
        this.codes.splice( i, 0, a );
        this.keys.splice( i, 0, b.data );
        this._syncBuckets( i + 1 );
    }
    protected _syncBuckets( startKeyIndex : number = 0 ) {
        for( let codes = this.codes, keys = this.keys, cLen = codes.length, c = startKeyIndex; c < cLen; c++ ) {
            const { code, bucketIndex } = this._getEntry( keys[ c ], codes[ c ] );
            this.buckets[ code ][ bucketIndex ][ 1 ] = c;
        }
    }
}

class ChronoChildNodes<T = unknown> extends ChildNodes<T> {
    constructor( isEqualValue : EqualityFn<T> ) { super( isEqualValue ) }
    indexOf( key : T ) {
        for( let k = this.keys.length; k--; ) {
            if( this.isEqualValue( key, this.keys[ k ] ) ) {
                return k;
            }
        }
        return -1;
    }
    set( node : Node<T> ) {
        ( this._optForKeyLocator( node.data ) && this.indexOf(  node.data ) !== -1 ) || super.set( node );
    }
    protected _optForKeyLocator( key : T ) {
        return typeof key === 'object' &&
            Object.keys( key ).length < this.keys.length
    } 
}

class SortedChildNodes<T = unknown> extends ChildNodes<T> {
    private _isLessThanValue : EqualityFn<T>
    private _keyComparator : ( a : T, b : T ) => Compared = null;
    constructor(
        isEqualValue : EqualityFn<T>,
        isLessThanValue : EqualityFn<T>
    ) {
        super( isEqualValue );
        this._isLessThanValue = isLessThanValue;
    }
    indexOf( key : T ) {
        const t = this._getClosestKeyIndex( key );
        return t.desc === Compared.EQ ? t.index : -1;
    }
    set( node : Node<T> ) {
        let { desc, index } = this._getClosestKeyIndex( node.data );
        if( desc === Compared.EQ ) { return }
        if( desc === Compared.LT ) { index += 1 }
        this._splice( robustHash( node.data ), node, index );
    }
    private _getClosestKeyIndex( key : T ) {
        if( this._keyComparator === null ) {
            this._keyComparator = this._compareKeys.bind( this );
        }
        return bSearch( key, this.keys, this._keyComparator );
    }
    private _compareKeys( keyA: T, keyB: T ) {
        if( this.isEqualValue( keyA, keyB ) ) { return Compared.EQ }
        if( this._isLessThanValue( keyA, keyB ) ) { return Compared.LT }
        return Compared.GT;
    }
    protected _optForKeyLocator( key : T ) { return typeof key === 'object' } 
}

export function robustHash<T>( key : T ) { return Math.abs( runHash( key ) ) }
function runHash<T>(
    key : T,
    visited : Array<unknown> = []
) {
    if( key === null ) { return 0 }
    switch( typeof key ) {
        case 'string': return stringHash( key as string );
        case 'number': return key as number | 0;
        case 'boolean': return key ? 1 : 0;
        case 'function': return stringHash( key.toString() )
        case 'undefined': return 0;
        case 'symbol': return stringHash( key.description );
    }
    {   
        const _key = key as Record<string, unknown>
        if( 'hashCode' in _key ) {
            return runHash(
                typeof _key.hashCode === 'function'
                    ? _key.hashCode()
                    : _key.hashCode
            );
        }
    }
    const { desc, index } = bSearch( key, visited );
    if( desc === Compared.EQ ) { return 0 }
    visited.splice( index + ( desc === Compared.LT ? 1 : 0 ), 0, key );
    let hash = 0
    if( Array.isArray( key ) ) {
        for( let k = key.length; k--; ) {
            hash += runHash( key[ k ], visited );
        }
        return hash;
    }
    for( let keys = Object.keys( key ).sort(), k = keys.length; k--; ) {
        if( keys[ k ] === 'hashCode' ) { continue }
        hash += runHash( key[ keys[ k ] ], visited );
    }
    return hash;
}
function stringHash( key : string ) {
    let hash = 0;
    for( let k = ( key as string ).length; k--; ) {
        // Multiply by prime and use bitwise OR to ensure 32-bit int.
        hash = ( hash * 31 + ( key as string ).charCodeAt( k ) ) | 0;
    }
    return hash;
};
export function bSearch<T = unknown>(
    needle : T,
    haystack : Array<T>,
    compare : ( a, b ) => Compared = defaultComparator
) {
    let startIndex = 0;
    let endIndex = haystack.length - 1;
    const res : ClosestKeyDesc = { index: endIndex, desc: Compared.GT };
    while( startIndex <= endIndex ) {
        res.index = Math.floor( ( startIndex + endIndex ) / 2 );
        const midValue = haystack[ res.index ];
        res.desc = compare( midValue, needle );
        if( res.desc === Compared.EQ ) { break }
        if( res.desc === Compared.LT ) {
            startIndex = res.index + 1;
            continue;
        }
        endIndex = res.index - 1;
    }
    return res;
}
function defaultComparator ( a, b ){ return a < b ? Compared.LT : a > b ? Compared.GT : Compared.EQ }
export function isIterable( sequence ) {
    if( sequence === null ) { return false }
    if( typeof sequence[ Symbol.iterator ] === 'function' ) { return true }
    /* pre-es6 support */
    const type = getDescriptor( sequence );
    return type === 'Array' || type === 'String';
}

export function toArray<T>( sequence : Iterable<T> ) : Array<T> {
    return Array.isArray( sequence ) ? sequence : [ ...sequence ];
}
