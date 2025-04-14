import type { TrieableNode } from '../main';

/**
 * @example
 * Turning the follwing list of strings:
 * [ 'Tennessee', 'MI', 'Maine', 'Ohio', 'Miss.', 'OR', 'Nevada', 'Texas', 'Oregon', 'Missouri', 'Mississippi', 'Idaho', 'Michigan' ]
 * into a trieable node for the followoing visual model:
 *           -----------------------------------------------------------------
 *           t                   m                         o          n      i   
 *           e          a -------^------- i            h --^-- r      e      d   
 *       n --^-- x      i           s ----^---- c      i       e      v      a   
 *       n       a      n           s           h      o       g      a      h   
 *       e       s      e   . -- o --^-- i      i              o      d      o   
 *       s                       u       s      g              n      a          
 *       s                       r       s      a                                
 *       e                       i       i      n                                
 *       e                               p                                        
 *                                       p                                        
 *                                       i                                        
 */

export function getTrieableNode() : TrieableNode<string> {
    return {
        data: null,
        children: [{
            data: 't',
            children: [{
                data: 'e',
                children: [{
                    data: 'n',
                    children: [{
                        data: 'n',
                        children: [{
                            data: 'e',
                            children: [{
                                data: 's',
                                children: [{
                                    data: 's',
                                    children: [{
                                        data: 'e',
                                        children: [{
                                            data: 'e',
                                            isBoundary: true
                                        }]
                                    }]
                                }]
                            }]
                        }]
                    }]
                }, {
                    data: 'x',
                    children: [{
                        data: 'a',
                        children: [{
                            data: 's',
                            isBoundary: true
                        }]
                    }]
                }]
            }]
        }, {
            data: 'm',
            children: [{
                data: 'a',
                children: [{
                    data: 'i',
                    children: [{
                        data: 'n',
                        children: [{
                            data: 'e',
                            isBoundary: true
                        }]
                    }]
                }]
            }, {
                data: 'i',
                isBoundary: true,
                children: [{
                    data: 's',
                    children: [{
                        data: 's',
                        children: [{
                            data: '.',
                            isBoundary: true
                        }, {
                            data: 'o',
                            children: [{
                                data: 'u',
                                children: [{
                                    data: 'r',
                                    children: [{
                                        data: 'i',
                                        isBoundary: true
                                    }]
                                }]
                            }]
                        }, {
                            data: 'i',
                            children: [{
                                data: 's',
                                children: [{
                                    data: 's',
                                    children: [{
                                        data: 'i',
                                        children: [{
                                            data: 'p',
                                            children: [{
                                                data: 'p',
                                                children: [{
                                                    data: 'i',
                                                    isBoundary: true
                                                }]
                                            }]
                                        }]
                                    }]
                                }]
                            }]
                        }]
                    }]
                }, {
                    data: 'c',
                    children: [{
                        data: 'h',
                        children: [{
                            data: 'i',
                            children: [{
                                data: 'g',
                                children: [{
                                    data: 'a',
                                    children: [{
                                        data: 'n',
                                        isBoundary: true
                                    }]
                                }]
                            }]
                        }]
                    }]
                }]
            }]
        }, {
            data: 'o',
            children: [{
                data: 'h',
                children: [{
                    data: 'i',
                    children: [{
                        data: 'o',
                        isBoundary: true
                    }]
                }]
            }, {
                data: 'r',
                isBoundary: true,
                children: [{
                    data: 'e',
                    children: [{
                        data: 'g',
                        children: [{
                            data: 'o',
                            children: [{
                                data: 'n',
                                isBoundary: true
                            }]
                        }]
                    }]
                }]
            }]
        }, {
            data: 'n',
            children: [{
                data: 'e',
                children: [{
                    data: 'v',
                    children: [{
                        data: 'a',
                        children: [{
                            data: 'd',
                            children: [{
                                data: 'a',
                                isBoundary: true
                            }]
                        }]
                    }]
                }]
            }]
        }, {
            data: 'i',
            children: [{
                data: 'd',
                children: [{
                    data: 'a',
                    children: [{
                        data: 'h',
                        children: [{
                            data: 'o',
                            isBoundary: true
                        }]
                    }]
                }]
            }]
        }]
    };
}

export function getArrayifiedNode() : Array<Array<string>> {
    return [
        [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ],
        [ 'm', 'i' ],
        [ 'm', 'a', 'i', 'n', 'e' ],
        [ 'o', 'h', 'i', 'o' ],
        [ 'm', 'i', 's', 's', '.' ],
        [ 'o', 'r' ],
        [ 'n', 'e', 'v', 'a', 'd', 'a' ],
        [ 't', 'e', 'x', 'a', 's' ],
        [ 'o', 'r', 'e', 'g', 'o', 'n' ],
        [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
        [ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ],
        [ 'i', 'd', 'a', 'h', 'o' ],
        [ 'm', 'i', 'c', 'h', 'i', 'g', 'a', 'n' ]
    ];
}

export function getArrayifiedNodeSorted() : Array<Array<string>> {
    return [
        [ 'i', 'd', 'a', 'h', 'o' ],
        [ 'm', 'a', 'i', 'n', 'e' ],
        [ 'm', 'i' ],
        [ 'm', 'i', 'c', 'h', 'i', 'g', 'a', 'n' ],
        [ 'm', 'i', 's', 's', '.' ],
        [ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ],
        [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
        [ 'n', 'e', 'v', 'a', 'd', 'a' ],
        [ 'o', 'h', 'i', 'o' ],
        [ 'o', 'r' ],
        [ 'o', 'r', 'e', 'g', 'o', 'n' ],
        [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ],
        [ 't', 'e', 'x', 'a', 's' ]
      ]
}

export const getExpectedTrieAsTrieableNode : () => TrieableNode<string> = (() => {
    function noMissingProperty(
        { children = [], ...input } : TrieableNode<string>,
        parentNode : TrieableNode<string>|null = null
    ) {
        const t : TrieableNode<string> = {
            children: new Array( children.length ),
            data: input.data,
            isBoundary: input.isBoundary ?? false,
            parent: parentNode
        };
        for( let cLen = children.length, c = 0; c < cLen; c++ ) {
            t.children![ c ] = noMissingProperty( children[ c ], t );
        }
        return t;
    };
    const trieableNode = getTrieableNode();
    return () => noMissingProperty( trieableNode );
})();
