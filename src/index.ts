export type {
    ClosestKeyDesc,
    EqualityFn, 
    KeyType,
    Node,
    Options,
    TrieableNode,
    TrieableNodeKeyMapping
} from './main';

import {
    bSearch,
    getDescriptor,
    isIterable,
    lessThanValue,
    sameValueZero,
    robustHash,
    toArray
} from './main';

export const util = {
    bSearch,
    computeHash: robustHash,
    defaultEqMatcher: sameValueZero,
    defaultLtMatcher: lessThanValue,
    getTypeName: getDescriptor,
    isIterable,
    toArray
};

export {
    Compared,
    default as default,
    OpStatus,
    Status,
} from './main';
