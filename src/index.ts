export type {
    ClosestKeyDesc,
    Compared,
    EqualityFn, 
    KeyType,
    Node,
    Options,
    OpStatus,
    Status,
    TrieableNode,
    TrieableNodeKeyMapping
} from './main';

import {
    bSearch,
    getDescriptor,
    isIterable,
    lessThanValue,
    sameValueZero,
    toArray
} from './main';

export const util = {
    bSearch,
    defaultEqMatcher: sameValueZero,
    defaultLtMatcher: lessThanValue,
    getTypeName: getDescriptor,
    isIterable,
    toArray
};

export { default as default } from './main';
