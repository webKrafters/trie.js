export type EqualityFn<T = unknown> = ( nodeData : T, comparehend : unknown ) => boolean; 

export interface Options<T = unknown> {
    isSameValue? : EqualityFn<T>
};

export enum OpStatus {
    FAILED = 'FAILED',
    SUCCESSFUL = 'SUCCESSFUL'
};

export enum Status {
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

export type KeyType = string|number|symbol;

export interface TrieableNodeKeyMapping {
    data : KeyType;
    children : KeyType|Array<KeyType>;
    isBoundary : KeyType;
}

const getDescriptor : ( ( obj: any ) => string ) = (() => {
    const t = Object.prototype.toString;
    return obj => {
        const desc = t.call( obj );
        return desc.slice( desc.indexOf( ' ' ) + 1, -1 );
    };
})();

/** Credit: curtesy of the lodash.eq() imnplementation */
const sameValueZero : EqualityFn = ( a, b ) => a === b || ( a !== a && b !== b );

const TRIE_DESC = 'webKrafters.Trie';

const NODE_DESC = 'wbKrafters.Trie.Node';

export class Node<T = unknown> {
    private _cNodes : Array<Node<T>> = [];
    private _data : T|null;
    private _isEqualValue : EqualityFn;
    private _isSequenceBoundary : boolean;
    private _pNode : Node<T>|null;
    constructor(
        data : T|null,
        isEqualValue : EqualityFn = sameValueZero,
        successorData : Array<Array<T>|TrieableNode<T>> = [],
        pNode : Node<T> = null,
        isSequenceBoundary : boolean = false
    ) {
        this._data = data;
        this._pNode = pNode;
        this._isEqualValue = isEqualValue;
        this._isSequenceBoundary = isSequenceBoundary;
        for( let dLen = successorData.length, d = 0; d < dLen; d++ ) {
            Array.isArray( successorData[ d ] )
                ? this.addChild([ ...successorData[ d ] as Array<T> ])
                : this.mergeTrieableNode( successorData[ d ] as TrieableNode<T> );
        }
    }
    get childNodes() { return this._cNodes }
    get data() { return this._data }
    get isEmpty() {
        if( this._isSequenceBoundary && !this.isRoot ) { return false }
        for( let cNodes = this._cNodes, c = cNodes.length; c--; ) {
            if( !cNodes[ c ].isEmpty ) { return false }
        }
        return true;
    }
    get isRoot() { return !this._pNode }
    get isSequenceBoundary() { return this._isSequenceBoundary }
    set isSequenceBoundary( flag : boolean ) { this._isSequenceBoundary = flag }
    get parentNode () { return this._pNode }

    addChild( childData : Array<T> ) {
        if( !childData.length ) {
            if( !this.isRoot ) {
                this._isSequenceBoundary = true;
            }
            return;
        }
        const data = childData.shift();
        let insertionIndex = this._cNodes.length;
        for( let i = insertionIndex; i--; ) {
            if( this._isEqualValue( this._cNodes[ i ]._data, data ) ) {
                insertionIndex = i;
                break;
            }
        }
        insertionIndex === this._cNodes.length
            ? this._cNodes.push( new Node<T>(
                data,
                this._isEqualValue,
                [ childData ],
                this,
                childData.length === 0
            ) )
            : this._cNodes[ insertionIndex ].addChild( childData );
    }

    /** converts this node into sequences of data */
    asArray( depth = 0 ) {
        const cNodes = this._cNodes;
        const cLen = cNodes.length;
        const successors : Array<Array<T>> = [];
        if( this._isSequenceBoundary ) {
            let path : Array<T> = new Array( depth );
            path[ depth - 1 ] = this._data;
            successors.push( path );
        }
        if( !cLen ) { return successors }
        for( let c = 0; c < cLen; c++ ) {
            const grandSuccessors = cNodes[ c ].asArray( depth + 1 );
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
        for( let children = this._cNodes, cLen = children.length, c = 0; c < cLen; c++ ) {
            trieableNode.children.push( children[ c ].asTrieableNode( trieableNode ) );
        }
       return trieableNode;
    }

    empty() { this._cNodes = [] }

    hasChild( childData : Array<T> ) {
        return !!this._getChildNodeIndices( childData ).length;
    }

    isEqual( graph : Array<Array<T>> ) : boolean;
    isEqual( graph : Node<T> ) : boolean;
    isEqual( graph : TrieableNode<T> ) : boolean;
    isEqual( graph ) : boolean {
        const arr = this.asArray();
        const cArr = Array.isArray( graph )
            ? [ ...graph ]
            : getDescriptor( graph ) === NODE_DESC
                ? graph.asArray()
                : new Trie( graph ).asArray();
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
        let match = this._findChildMatching( node.data );
        if( match === null ) {
            this._cNodes.push( node );
            return;
        }
        if( !match.isSequenceBoundary ) {
            match.isSequenceBoundary = node.isSequenceBoundary;
        }
        for( let d = 0, data = node.childNodes, dLen = data.length; d < dLen; d++ ) {
            match.merge( data[ d ] );
        }
        return;
    }

    mergeTrieableNode( trieableNode : TrieableNode<T> ) {
        let match = this._findChildMatching( trieableNode.data );
        if( match === null ) {
            this._cNodes.push( new Node<T>(
                trieableNode.data,
                this._isEqualValue,
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
        switch( this._removeChild( childData ) ) {
            // istanbul ignore next
            case Status.REMOVED: return true;
            case Status.UPDATED: return true;
        }
        return false;
    }

    private _findChildMatching( data : T ) {
        for( let children = this._cNodes, c = children.length; c--; ) {
            const node = children[ c ];
            if( this._isEqualValue( node.data, data ) ) {
                return node;
            }
        }
        return null;
    }

    /**
     * walks a node path finding all the index of each childData in descendant parent node's childNOdes array
     * can only find child if all childData exist in the descendant nodes to form a bounded range (a.k.a. sequence)
     */
    private _getChildNodeIndices (
        childData : Array<T>,
        currentChildIndex : number = 0,
        childPathIndexes : Array<number> = []
    ) : Array<number> {
        const cLen  = childData.length;
        if( !cLen || !this._cNodes.length ) { return [] }
        let indexInChildNodes = -1;
        for( let currentSearchTerm = childData[ currentChildIndex ], n = this._cNodes.length; n--; ) {
            if( this._isEqualValue( this._cNodes[ n ].data, currentSearchTerm ) ) { 
                indexInChildNodes = n;
                break;
            }
        }
        if( indexInChildNodes === -1 ) { return [] }
        childPathIndexes.push( indexInChildNodes );
        if( currentChildIndex === cLen - 1 ) {
            return !this._cNodes[ indexInChildNodes ].isSequenceBoundary
                ? []
                : childPathIndexes;
        }
        return this._cNodes[ indexInChildNodes ]._getChildNodeIndices( childData, currentChildIndex + 1, childPathIndexes );
    }

    /** can only remove child if all childData exist in the descendant nodes to form a bounded range (a.k.a. sequence) */
    private _removeChild(
        childData : Array<T>,
        childPathIndexes : Array<number> = [],
        currentChildIndex : number = 0 
    ) : Status {
        if( !childPathIndexes.length ) {
            childPathIndexes = this._getChildNodeIndices( childData );
            if( !childPathIndexes.length ) { return Status.NOOP }
        }
        const currentNode = this._cNodes[ childPathIndexes[ currentChildIndex ] ];
        if( currentChildIndex === childData.length - 1 ) {
            if( currentNode._cNodes.length ) {
                currentNode._isSequenceBoundary = false;
                return Status.UPDATED;
            }
            currentNode._pNode._cNodes.splice( childPathIndexes[ currentChildIndex ], 1 );
            return currentNode._pNode._cNodes.length ? Status.UPDATED : Status.REMOVED;
        }
        const status = currentNode._removeChild( childData, childPathIndexes, currentChildIndex + 1 );
        if( status === Status.REMOVED ) {
            if( currentNode._pNode._cNodes[ childPathIndexes[ currentChildIndex ] ]._isSequenceBoundary ) {
                return Status.UPDATED;
            }
            currentNode._pNode._cNodes.splice( childPathIndexes[ currentChildIndex ], 1 );
            if( currentNode._pNode._cNodes.length ) {
                return Status.UPDATED;
            }
        }
        return status;
    }
}

Node.prototype[ Symbol.toStringTag ] = NODE_DESC;

export default class Trie<T = unknown> {
    private root : Node<T>;
    private isSameValue : EqualityFn<T>;

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
     * @param {Array<Array<T>>?} data - Accepts an array of sequences of items to immediately create an initial tree at instantiation.
     * @param {Options?} opts - Options to modify certain default behaviors of this object. This instances use a sameValueZero comparison for equality check.
     * @example
     * ( 1 )
     * To create Trie instance with the following data:
     * [ 'Tennessee', 'MI', Nevada', 'Texas', 'Oregon', 'Michigan' ],
     * do the following:
     * new Trie([
     *  [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ],
     *  [ 'm', 'i' ],
     *  [ 't', 'e', 'x', 'a', 's' ],
     *  [ 'o', 'r', 'e', 'g', 'o', 'n' ],
     *  [ 'm', 'i', 'c', 'h', 'i', 'g', 'a', 'n ]
     * ]) 
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
    constructor( data? : Array<Array<T>>, opts? : Options<T> );
    constructor( data = undefined, opts: Options<T> = {} ) {
        this.isSameValue = opts.isSameValue ?? sameValueZero;
        this.root = new Node<T>(
            null,
            this.isSameValue,
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

    get size () { return this.asArray().length }

    /**
     * @template {T = unknown}
     * @param {Array<Array<T>>} data - Accepts a sequence of items to merge into the trie.
     */
    add( data : Array<T> ) { this.root.addChild([ ...data ]) }

    /**
     * @template {T = unknown}
     * @param {Array<Array<T>|TrieableNode<T>>} data - Accepts sequences of items and TrieableNodes or a combination thereof to merge into the trie.
     */
    addMany( data : Array<Array<T>|TrieableNode<T>> ) {
        for( let dLen = data.length, d = 0; d < dLen; d++ ) {
            Array.isArray( data[ d ] )
                ? this.add( data[ d ] as Array<T> )
                : this.merge( data[ d ] as TrieableNode<T> );
        }
    }

    asArray(){
        const array = this.root.asArray();
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
                isSameValue: this.isSameValue
            }
        );
    }

    getAllStartingWith( prefix : Array<T> = [] ) {
        const suffixStartNode = this._getPrefixEndNode( prefix );
        if( !suffixStartNode ) { return [] }
        const sequences = suffixStartNode.asArray();
        for( let s = sequences.length; s--; ) {
            sequences[ s ] = prefix.concat( sequences[ s ] );
        }
        return sequences;
    }

    has( sequence : Array<T> ) { return this.root.hasChild( sequence ) }

    isSame( trie : Trie<T> ) { return this === trie }

    matches( graph : Array<Array<T>> ) : boolean;
    matches( graph : Array<TrieableNode<T>> ) : boolean;
    matches( graph : TrieableNode<T> ) : boolean;
    matches( graph : Trie<T> ) : boolean;
    matches( graph ) : boolean {
        return this.isSame( graph ) || this.root.isEqual(
            getDescriptor( graph ) === TRIE_DESC
                ? graph.root
                : !Array.isArray( graph ) || Array.isArray( graph[ 0 ] )
                    ? graph
                    : {
                        children: graph,
                        data: null,
                        isBoundary: false,
                        parent: null
                    }
        );
    }

    /**
     * @template {T = unknown}
     * @param {Trie<T>|TrieableNode<T>} data - Accepts a data tree to merge into this trie.
     */
    merge( data : Trie<T> ) : void;
    merge( data : TrieableNode<T> ) : void;
    merge( data ) : void {
        if( getDescriptor( data ) === TRIE_DESC ) {
            for( let children = ( data as Trie<T> ).root.childNodes, cLen = children.length, c = 0; c < cLen; c++ ) {
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
     * @param {Array<Array<T>>} data - Accepts sequences of items to remove from the trie.
     * @returns {boolean} - true is successfully removed; false otherwise
     */
    remove( data : Array<T> ) { return this.root.removeChild( data ) }
    
    removeAllStartingWith( prefix : Array<T> = [] ) {
        const suffixStartNode = this._getPrefixEndNode( prefix );
        if( !suffixStartNode ) { return }
        const cNodes = suffixStartNode.parentNode.childNodes;
        for( let c = cNodes.length; c--; ) {
            if( this.isSameValue( cNodes[ c ].data, suffixStartNode.data  ) ) {
                suffixStartNode.parentNode.childNodes.splice( c, 1 );
            }
        }
    }

    /**
     * @template {T = unknown}
     * @param {Array<Array<T>>} data - Accepts sequences of items to remove from the trie.
     * @returns {Array<"FAILED"|"SUCCESSFUL">} - A list of outcomes for each outcome removed.
     */
    removeMany( data : Array<Array<T>> ) {
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

    private _getPrefixEndNode( prefix : Array<T> ) {
        let childNodes = this.root.childNodes;
        let node : Node<T> = null;
        for( let p = 0, pLen = prefix.length; p < pLen; p++ ) {
            node = null;
            for( let currentTerm = prefix[ p ], n = childNodes.length; n--; ) {
                if( this.isSameValue( childNodes[ n ].data, currentTerm ) ) {
                    node = childNodes[ n ];
                    break;
                }
            }
            if( !node  ) { return null }
            childNodes = node.childNodes;
        }
        return node;
    }
}

Trie.prototype[ Symbol.toStringTag ] = TRIE_DESC;
