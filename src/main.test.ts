import type { EqualityFn, TrieableNode } from './main';

import {
    afterAll,
	beforeAll,
	describe,
	expect,
    jest,
	test
} from '@jest/globals';

import { removeSequence } from './test-artifacts';

import {
    getArrayifiedNode,
    getArrayifiedNodeSorted,
    getExpectedTrieAsTrieableNode,
    getTrieableNode
} from './test-artifacts/test-data';

import Trie, {
    ChildNodes,
    LT_TYPES_MSG,
    LT_ARG_TYPES_MISMATCH_MSG,
    Node,
    OpStatus
} from './main';

const arrayifiedNode = getArrayifiedNode();
const sortedArrayifiedNode = getArrayifiedNodeSorted();
const trieableNode = getTrieableNode();
const expectedTrieAsTrieableNode = getExpectedTrieAsTrieableNode();

describe( 'Trie class', () => {

    describe( 'static', () => {

        describe( 'makeTrieable(...)', () => {

            test( 'resolves incoming children as array', () => {
                let p1,  p2, p3;
                p1 = { data: 55, parent: null };
                p2 = {
                    data: 22,
                    isBoundary: true,
                    parent: p1
                };
                p3 = { data: 11, parent: p2 };
                p1.children = [ p2 ];
                p2.children = [ p3 ];
                expect(
                    Trie.makeTrieable({
                        x: [{
                            w: true,
                            x: [{
                                y: 11,
                                k: 'A'
                            }],
                            y: 22
                        }],
                        y: 55,
                        z: 'testing'
                    }, {
                        children: 'x',
                        data: 'y',
                        isBoundary: 'w'
                    })
                ).toEqual( p1 )
            } );

            test( 'resolves incoming iterable and single value children as array', () => {
                let p1,  p2, p3, p4;
                p1 = { data: 55, parent: null };
                p2 = {
                    data: 22,
                    isBoundary: true,
                    parent: p1
                };
                p3 = { data: 11, parent: p2 };
                p4 = { data: 640, parent: p3 };
                p1.children = [ p2 ];
                p2.children = [ p3 ];
                p3.children = [ p4 ];
                expect(
                    Trie.makeTrieable({
                        x: [{
                            w: true,
                            x: {
                                y: 11,
                                k: 'A',
                                x: 640
                            },
                            y: 22
                        }],
                        y: 55,
                        z: 'testing'
                    }, {
                        children: 'x',
                        data: 'y',
                        isBoundary: 'w'
                    })
                ).toEqual( p1 )
            } );

            test( 'combines multiple individual incoming properties as children', () => {
                let p1,  p2, p3, p4, p5;
                p1 = { data: 55, parent: null };
                p2 = {
                    data: 22,
                    isBoundary: true,
                    parent: p1
                };
                p3 = { data: 11, parent: p2 };
                p4 = {  data: 99, parent: p2 };
                p5 = {
                    data: 77,
                    isBoundary: true,
                    parent: p4
                };
                p1.children = [ p2, { data: 'testing', parent: p1 } ];
                p2.children = [ p3, p4 ];
                p3.children = [
                    { data: null, parent: p2 },
                    { data: null, parent: p2 }
                ];
                p4.children = [ p5, { data: null, parent: p4 } ];
                p5.children = [
                    { data: 760, parent: p5 },
                    { data: null, parent: p5 }
                ];
                try {
                    expect(
                        Trie.makeTrieable({
                            x: {
                                w: true,
                                x: {
                                    y: 11,
                                    k: 'A'
                                },
                                y: 22,
                                z: {
                                    y: 99,
                                    x: {
                                        w: true,
                                        y: 77,
                                        a: 43,
                                        x: 760
                                    }
                                }
                            },
                            y: 55,
                            z: 'testing'
                        }, {
                            children: [ 'x', 'z' ],
                            data: 'y',
                            isBoundary: 'w'
                        })
                    ).toEqual( p1 )
                } catch( e ) {
                    expect( e.message.endsWith( 'Received: serializes to the same string' ) ).toBe( true );
                }
            } );
        } );
    } );

    describe( 'constructors(...)', () => {

        test( 'creates an empty trie by default', () => {
            expect( new Trie().asTrieableNode() ).toEqual({
                children: [],
                data: null,
                isBoundary: false,
                parent: null,
            });
        } );

        test( 'creates a chronological trie by default -- tested using sequences of data objects', () => {
            let c;
            const reused = { a: 33, c };
            c = reused;
            const data = [
                [{ a: 590 }, reused ],
                [{}, reused ],
                [{ a: 590 }]
            ];
            const opts = {
                equalityMatcher: ( a, b ) => a.a === b.a,
                lessThanMatcher: ( a, b ) => ( a?.a ?? 0 ) < (( b as {a? : number} )?.a ?? 0 )
            };
            expect( new Trie( data, opts ).asArray() ).toStrictEqual([
                [{ a: 590 }],
                [{ a: 590 }, reused ],
                [{}, reused ]
            ]);
            expect( new Trie( data, { ...opts, sorted: true }).asArray() ).toStrictEqual([
                [{}, reused ],
                [{ a: 590 }],
                [{ a: 590 }, reused ]
            ]);
        } );

        test( 'also accepts array data -- tested using sequences of arrays of data objects', () => {
            let c;
            const reused = [ [{ a: 33, c }], [] ];
            c = reused;
            const data = [
                [ [{ a: 590 }], ...reused, [{ a: 922 }] ],
                [ [], ...reused, [{}] ],
                [ [{ a: 590 }] ]
            ];
            const opts = {
                equalityMatcher: ( a, b ) => a.length === b.length,
                lessThanMatcher: ( a, b ) => a.length < b.length
            };
            expect( new Trie( data, opts ).asArray() ).toStrictEqual([
                [ [{ a: 590 }] ],
                [ [{ a: 590 }], ...reused, [{ a: 922 }] ],
                [ [], ...reused, [{}] ]
            ]);
            expect( new Trie( data, { ...opts, sorted: true }).asArray() ).toStrictEqual([
                [ [], ...reused, [{}] ],
                [ [{ a: 590 }] ],
                [ [{ a: 590 }], ...reused, [{ a: 922 }] ]
            ]);
        } );

        test( 'creates a trie using an existing trie instance', () => {
           expect( new Trie( new Trie( trieableNode ) ).asTrieableNode() ).toEqual( expectedTrieAsTrieableNode );
        } );

        test( 'creates a trie using a trieable node', () => {
            expect( new Trie( trieableNode ).asTrieableNode() ).toEqual( expectedTrieAsTrieableNode );
        } );

        test( 'creates a trie using a single trieable node child', () => {
            const tNode = getTrieableNode();
            tNode.data = 'A'; // a non-null root node data causes a root to be stored as a trie child node.
            let expectedNode : TrieableNode<string> = {
                data: null,
                isBoundary: false,
                parent: null
            };
            const child = getExpectedTrieAsTrieableNode();
            child.data = 'A';
            child.parent = expectedNode;
            expectedNode.children = [ child ];
            expect( new Trie( tNode ).asTrieableNode() ).toEqual( expectedNode );
        } );

        test( 'creates a trie using an array of data sequences', () => {
            let trie = new Trie( arrayifiedNode );
            expect( trie.asArray() ).toMatchSequences( arrayifiedNode );
            expect( trie.asTrieableNode() ).toMatchNode( expectedTrieAsTrieableNode );
            // --- for strings --- //
            trie = new Trie( arrayifiedNode.map( sArr => sArr.join( '' ) ) );
            expect( trie.asArray() ).toMatchSequences( arrayifiedNode );
            expect( trie.asTrieableNode() ).toMatchNode( expectedTrieAsTrieableNode );
        } );

        test( 'creates a trie using an array of trieable nodes', () => {
            const trie = new Trie( trieableNode.children );
            expect( trie.asArray() ).toMatchSequences( arrayifiedNode );
            expect( trie.asTrieableNode() ).toEqual( expectedTrieAsTrieableNode );
        } );

        describe( 'sorted instance', () => {

            test( "creates a sorted Trie instance when 'sort' options set", () => {
                const trieData = new Trie( trieableNode.children, { sorted: true }).asArray()
                expect( trieData ).not.toStrictEqual( arrayifiedNode );
                expect( trieData ).toMatchSequences( arrayifiedNode );
                expect( trieData ).toStrictEqual( sortedArrayifiedNode );
            } );

            test( 'sorts incoming values when added', () => {
                let trie : Trie<string> = new Trie( undefined, { sorted: true } );
                expect( trie.asTrieableNode() ).toEqual({
                    children: [],
                    data: null,
                    isBoundary: false,
                    parent: null,
                });
                expect( trie.asArray() ).toStrictEqual([]);
                trie.add( [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ]);
                expect( trie.asArray() ).toStrictEqual([
                    [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ]
                ]);
                trie.add([ 'm', 'i' ]);
                expect( trie.asArray() ).toStrictEqual([
                    [ 'm', 'i' ],
                    [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ]
                ]);
                trie.addMany([
                    [ 'm', 'a', 'i', 'n', 'e' ],
                    [ 'o', 'h', 'i', 'o' ],
                    [ 'm', 'i', 's', 's', '.' ]
                ]);
                expect( trie.asArray() ).toStrictEqual([
                    [ 'm', 'a', 'i', 'n', 'e' ],
                    [ 'm', 'i' ],
                    [ 'm', 'i', 's', 's', '.' ],
                    [ 'o', 'h', 'i', 'o' ],
                    [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ]
                ]);
                trie.add([ 'o', 'r' ]);
                expect( trie.asArray() ).toStrictEqual([
                    [ 'm', 'a', 'i', 'n', 'e' ],
                    [ 'm', 'i' ],
                    [ 'm', 'i', 's', 's', '.' ],
                    [ 'o', 'h', 'i', 'o' ],
                    [ 'o', 'r' ],
                    [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ]
                ]);
                // --- using strings --- //
                trie = new Trie(
                    arrayifiedNode.slice( 0, 4 ).map( sArr => sArr.join( '' ) ),
                    { sorted: true }
                );
                expect( trie.asArray() ).toEqual([
                    [ 'm', 'a', 'i', 'n', 'e' ],
                    [ 'm', 'i' ],
                    [ 'o', 'h', 'i', 'o' ],
                    [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ]
                ]);
                trie.add( 'oregon' );
                expect( trie.asArray() ).toStrictEqual([
                    [ 'm', 'a', 'i', 'n', 'e' ],
                    [ 'm', 'i' ],
                    [ 'o', 'h', 'i', 'o' ],
                    [ 'o', 'r', 'e', 'g', 'o', 'n' ],
                    [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ]
                ]);
                trie.add( 'idaho' );
                expect( trie.asArray() ).toStrictEqual([
                    [ 'i', 'd', 'a', 'h', 'o' ],
                    [ 'm', 'a', 'i', 'n', 'e' ],
                    [ 'm', 'i' ],
                    [ 'o', 'h', 'i', 'o' ],
                    [ 'o', 'r', 'e', 'g', 'o', 'n' ],
                    [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ]
                ]);
                trie.addMany([ 'nevada', 'texas', 'michigan' ]);
                expect( trie.asArray() ).toStrictEqual([
                    [ 'i', 'd', 'a', 'h', 'o' ],
                    [ 'm', 'a', 'i', 'n', 'e' ],
                    [ 'm', 'i' ],
                    [ 'm', 'i', 'c', 'h', 'i', 'g', 'a', 'n' ],
                    [ 'n', 'e', 'v', 'a', 'd', 'a' ],
                    [ 'o', 'h', 'i', 'o' ],
                    [ 'o', 'r', 'e', 'g', 'o', 'n' ],
                    [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ],
                    [ 't', 'e', 'x', 'a', 's' ]
                ]);
                trie.add( 'or' );
                expect( trie.asArray() ).toStrictEqual([
                    [ 'i', 'd', 'a', 'h', 'o' ],
                    [ 'm', 'a', 'i', 'n', 'e' ],
                    [ 'm', 'i' ],
                    [ 'm', 'i', 'c', 'h', 'i', 'g', 'a', 'n' ],
                    [ 'n', 'e', 'v', 'a', 'd', 'a' ],
                    [ 'o', 'h', 'i', 'o' ],
                    [ 'o', 'r' ],
                    [ 'o', 'r', 'e', 'g', 'o', 'n' ],
                    [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ],
                    [ 't', 'e', 'x', 'a', 's' ]
                ]);
            } );

            test( "assigns default precedence to 'undefined' and 'null' values in that order", () => {
                const trie = new Trie([
                    [ 6, 3, 1, null, 2, undefined, 10, 1 ],
                    [ null, 3, 6, 9, undefined, 10, 1, 2 ],
                    [ -29, 8, 1, null, 2, 37, 770 ],
                    [ undefined, 3, 1, null, 2, undefined, 10, 1 ],
                    [ null, 3, 0 ]
                ], { sorted: true });
                expect( trie.asArray() ).toStrictEqual([
                    [ undefined, 3, 1, null, 2, undefined, 10, 1 ],
                    [ null, 3, 0 ],
                    [ null, 3, 6, 9, undefined, 10, 1, 2 ],
                    [ -29, 8, 1, null, 2, 37, 770 ],
                    [ 6, 3, 1, null, 2, undefined, 10, 1 ]
                ]);
            } );

            test.each([
                [ 'objects', [[{}, { a:33 }], [{ a: 590 }]], LT_TYPES_MSG ],
                [ 'symbols', [[ Symbol( 33 ), Symbol( 67 )], [ Symbol( 582 ) ]], LT_TYPES_MSG ],
                [ 'functions', [[ () => 33, () => {} ], [ function(){} ]], LT_TYPES_MSG ],
                [ 'mixed data types', [[ 33, 'e'], [ true ]], LT_ARG_TYPES_MISMATCH_MSG ],
            ])( "requires a custom 'lessThan' matcher when storing %s", (
                typeDesc, data, expectedErrorMsg
            ) => {
                expect(() => new Trie<unknown>( data, { sorted: true }) ).toThrow( expectedErrorMsg );
                const lessThanMatcher = jest.fn().mockReturnValue( true ) as EqualityFn;
                new Trie( data, { lessThanMatcher, sorted: true });
                expect( lessThanMatcher ).toHaveBeenCalled();
            } );

            test( 'maintains sort order upon data removal', () => {
                const removableData = { a: 590 };
                const t = new Trie<{a? : number}>([
                    [{ a: 590 }, { a: 33 }],
                    [{}, { a: 33 }],
                    [ removableData ]
                ], {
                    lessThanMatcher: ( a, b ) => ( a?.a ?? 0 ) < (( b as {a? : number} )?.a ?? 0 ),
                    sorted: true
                });
                expect( t.asArray() ).toStrictEqual([
                    [{}, { a: 33 }],
                    [ removableData ],
                    [{ a: 590 }, { a: 33 }]
                ]);
                t.remove([ removableData ]);
                expect( t.asArray() ).toStrictEqual([
                    [{}, { a: 33 }],
                    [{ a: 590 }, { a: 33 }]
                ]);
            } );
        } );
    } );
    describe( 'properties', () => {

        describe( 'isEmpty', () => {

            test( 'confirms if this instance is devoid of data', () => {
                const trie = new Trie();
                expect( trie.isEmpty ).toBe( true );
                trie.addMany( arrayifiedNode );
                expect( trie.isEmpty ).toBe( false );
                trie.clear();
                expect( trie.isEmpty ).toBe( true );
            } );

            test( 'confirms if this instance is devoid of data2', () => {
                expect( new Trie( arrayifiedNode ).isEmpty ).toBe( false );
            } );

            test( 'confirms that a trie w/o any complete sequence is devoid of data', () => {
                expect( new Trie<string|number>({
                    data: null,
                    children: [{
                        data: 22,
                        children: [{
                            data: 788,
                            children: [{
                                data: 'a',
                                children: []
                            }]
                        },{
                            data: 21,
                            children: [{
                                data: 't'
                            }, {
                                data: 97,
                                children: [{
                                    data: 'z',
                                }]
                            }]
                        }]
                    }]
                }).isEmpty ).toBe( true );
            } );

        } );

        describe( 'size', () => {

            test( 'returns number of complete sequences', () => {
                const trie = new Trie();
                expect( trie.size ).toBe( 0 );
                trie.addMany( arrayifiedNode );
                expect( trie.size ).toBe( arrayifiedNode.length );
                trie.remove([ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ]);
                expect( trie.size ).toBe( arrayifiedNode.length - 1 );
                trie.clear();
                expect( trie.size ).toBe( 0 );
            } );

            test( 'returns number of complete sequences2', () => {
                expect( new Trie( arrayifiedNode ).size ).toBe( arrayifiedNode.length );
            } );

        } );

    } );

    describe( 'methods', () => {

        describe( 'add(...)', () => {

            test( 'inserts a sequence into this instance', () => {
                let throttledEntry = [ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ];
                let abridgedArr = removeSequence( getArrayifiedNode(), throttledEntry );
                let trie = new Trie( abridgedArr );
                let asArray = trie.asArray();
                expect( asArray ).toMatchSequences( abridgedArr );
                expect( asArray ).not.toMatchSequences( arrayifiedNode );
                trie.add( throttledEntry );
                expect( trie.asArray() ).toMatchSequences( arrayifiedNode );
                // --- using strings --- //
                trie = new Trie( abridgedArr.map( sArr => sArr.join( '' ) ) );
                asArray = trie.asArray();
                expect( asArray ).toMatchSequences( abridgedArr );
                expect( asArray ).not.toMatchSequences( arrayifiedNode );
                trie.add( throttledEntry.join( '' ) );
                expect( trie.asArray() ).toMatchSequences( arrayifiedNode );
            } );

        } );

        describe( 'addMany(...)', () => {
            let abridgedArr, throttledEntries;
            beforeAll(() => {
                throttledEntries = [
                    [ 'o', 'r', 'e', 'g', 'o', 'n' ],
                    [ 'm', 'i', 's', 's', '.' ],
                    [ 't', 'e', 'x', 'a', 's' ]
                ];
                abridgedArr = getArrayifiedNode();
                throttledEntries.forEach( e => {
                    abridgedArr = removeSequence( abridgedArr, e );
                } );
            });
            afterAll(() => { abridgedArr = throttledEntries = null });
            
            test( 'inserts an array of sequences into this instance', () => {
                let trie = new Trie( abridgedArr );
                let asArray = trie.asArray();
                expect( asArray ).toMatchSequences( abridgedArr );
                expect( asArray ).not.toMatchSequences( arrayifiedNode );
                trie.addMany( throttledEntries );
                expect( trie.asArray() ).toMatchSequences( arrayifiedNode );
                // --- using strings --- //
                trie = new Trie( abridgedArr );
                asArray = trie.asArray();
                expect( asArray ).toMatchSequences( abridgedArr );
                expect( asArray ).not.toMatchSequences( arrayifiedNode );
                trie.addMany( throttledEntries.map( e => e.join( '' ) ) );
                expect( trie.asArray() ).toMatchSequences( arrayifiedNode );
            } );
            
            test( 'inserts an array of trieable nodes into this instance', () => {
                const trie = new Trie( abridgedArr );
                const asArray = trie.asArray();
                expect( asArray ).toMatchSequences( abridgedArr );
                expect( asArray ).not.toMatchSequences( arrayifiedNode );
                trie.addMany( new Trie( throttledEntries ).asTrieableNode().children! );
                expect( trie.asArray() ).toMatchSequences( arrayifiedNode );
            } );
            
            test( 'inserts an array of both sequences and trieable nodes into this instance', () => {
                const trie = new Trie( abridgedArr );
                const asArray = trie.asArray();
                expect( asArray ).toMatchSequences( abridgedArr );
                expect( asArray ).not.toMatchSequences( arrayifiedNode );
                const data = new Trie([
                    throttledEntries[ 0 ],
                    throttledEntries[ 2 ]
                ]).asTrieableNode().children!
                data.splice( 1, 0, throttledEntries[ 1 ] );
                trie.addMany( data );
                expect( trie.asArray() ).toMatchSequences( arrayifiedNode );
            } );

        } );

        describe( 'asArray(...)', () => {

            test( 'produces this instance data as an array of complete sequences by default', () => {
                const actuals = new Trie( trieableNode ).asArray();
                expect( actuals ).toMatchSequences( arrayifiedNode );
            } );

            test( 'produces all sequences including incomplete ones in this instance', () => {
                const trie = new Trie( trieableNode );
                expect( trie.asArray() ).toMatchSequences( arrayifiedNode );
                expect( trie.asArray( false ) ).toMatchSequences( arrayifiedNode );
                let mississip = 'mississip';
                let tenness = 'tenness';
                trie.removeAllStartingWith(( mississip + 'p' ).split( '' ) );
                trie.removeAllStartingWith(( tenness + 'e' ).split( '' ) );
                let data = trie.asArray().map( d => ( d as Array<string> ).join( '' ) );
                expect( data.every( d => d !== mississip ) ).toBe( true );
                expect( data.every( d => d !== mississip + 'pi' ) ).toBe( true );
                expect( data.every( d => d !== tenness ) ).toBe( true );
                expect( data.every( d => d !== tenness + 'ee' ) ).toBe( true );
                data = trie.asArray( false ).map( d => ( d as Array<string> ).join( '' ) );
                expect( data.every( d => d !== mississip ) ).toBe( false );
                expect( data.every( d => d !== mississip + 'pi' ) ).toBe( true );
                expect( data.every( d => d !== tenness ) ).toBe( false );
                expect( data.every( d => d !== tenness + 'ee' ) ).toBe( true );
            } );

        } );

        describe( 'asTrieableNode(...)', () => {
        
            test( 'produces this instance data as a pojo tree', () => {
                expect( new Trie( trieableNode ).asTrieableNode() ).toEqual( expectedTrieAsTrieableNode );
            } );
        
        } );
        
        describe( 'clear(...)', () => {
        
            test( 'removes all data from this instance', () => {
                const trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toMatchSequences( arrayifiedNode );
                expect( trie.asTrieableNode() ).toMatchNode( trieableNode );
                trie.clear();
                expect( trie.asArray() ).toEqual([]);
                expect( trie.asTrieableNode() ).toMatchNode({
                    data: null,
                    children: [],
                    isBoundary: false,
                    parent: null
                });
            } );

        } );

        describe( 'clone(...)', () => {

            test( 'makes a deep copy of this instance', () => {
                const sequences = [
                    [ 'n', 'e', 'v', 'a', 'd', 'a' ],
                    [ 't', 'e', 'x', 'a', 's' ],
                    [ 'o', 'r', 'e', 'g', 'o', 'n' ]
                ];
                const superSequences = [
                    ...sequences,
                    [ 'm', 'a', 'i', 'n', 'e' ]
                ];
                const trie = new Trie( sequences );
                expect( trie.asArray() ).toMatchSequences( sequences );
                const trieClone = trie.clone();
                expect( trieClone.asArray() ).toMatchSequences( sequences );
                trie.add( superSequences[ 3 ] );
                let _array = trie.asArray();
                expect( _array ).not.toMatchSequences( sequences );
                expect( _array ).toMatchSequences( superSequences );
                _array = trieClone.asArray();
                expect( _array ).toMatchSequences( sequences );
                expect( _array ).not.toMatchSequences( superSequences );
            } );

        } );

        describe( 'getAllStartingWith(...)', () => {

            test( 'produces an array of sequences starting with a subsequence', () => {
                const arr = getArrayifiedNode();
                expect(
                    new Trie( arr ) .getAllStartingWith([ 'm', 'i', 's' ])
                ).toMatchSequences([
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
                    [ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ],
                    [ 'm', 'i', 's', 's', '.' ]
                ]);
                // --- using strings --- //
                expect(
                    new Trie( arr ).getAllStartingWith( 'mis' )
                ).toMatchSequences([
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
                    [ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ],
                    [ 'm', 'i', 's', 's', '.' ]
                ]);
            } );
            
            test( 'produces all up to and including the prefix sequence if a complete sequence', () => {
                const arr = getArrayifiedNode();
                expect(
                    new Trie( arr ).getAllStartingWith([ 'o', 'r' ])
                ).toMatchSequences([
                    [ 'o', 'r' ],
                    [ 'o', 'r', 'e', 'g', 'o', 'n' ]
                ]);
                // --- using strings --- //
                expect(
                    new Trie( arr ).getAllStartingWith( 'or' )
                ).toMatchSequences([
                    [ 'o', 'r' ],
                    [ 'o', 'r', 'e', 'g', 'o', 'n' ]
                ]);
            } );
            
            test( 'produces an empty array if no prefix sequence supplied', () => {
                const trie = new Trie( getArrayifiedNode() );
                expect( trie.getAllStartingWith() ).toEqual([]);
                expect( trie.getAllStartingWith([]) ).toEqual([]);
            } );
           
            test( 'produces an empty array if no complete sequences found preceded by the prefix sequence.', () => {
                expect(
                    new Trie( getArrayifiedNode() )
                        .getAllStartingWith([ 'w', 'y', 'o' ])
                ).toEqual([]);
            } );

            test( 'produces all sequences with a prefix including incomplete ones in this instance', () => {
                let trie = new Trie( trieableNode );
                let prefix = [ 'm', 'i', 's' ];
                let actual = trie.getAllStartingWith( prefix );
                const sequences = [
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
                    [ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ],
                    [ 'm', 'i', 's', 's', '.' ]
                ];
                expect( actual ).toMatchSequences( sequences );
                actual = trie.getAllStartingWith( prefix, false );
                expect( actual ).toMatchSequences( sequences );
                let mississip = 'mississip';
                trie.removeAllStartingWith(( mississip ).split( '' ));
                expect( trie.getAllStartingWith( prefix ) ).toMatchSequences([
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
                    [ 'm', 'i', 's', 's', '.' ]
                ]);
                expect( trie.getAllStartingWith( prefix, false ) ).toMatchSequences([
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
                    [ 'm', 'i', 's', 's', 'i', 's', 's', 'i' ],
                    [ 'm', 'i', 's', 's', '.' ]
                ]);

                // --- using strings --- //
                trie = new Trie( trieableNode );
                actual = trie.getAllStartingWith( prefix.join( '' ) );
                expect( actual ).toMatchSequences( sequences );
                actual = trie.getAllStartingWith( prefix.join( '' ), false );
                expect( actual ).toMatchSequences( sequences );
                trie.removeAllStartingWith( mississip );
                expect( trie.getAllStartingWith( prefix.join( '' ) ) ).toMatchSequences([
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
                    [ 'm', 'i', 's', 's', '.' ]
                ]);
                expect( trie.getAllStartingWith( prefix.join( '' ), false ) ).toMatchSequences([
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ],
                    [ 'm', 'i', 's', 's', 'i', 's', 's', 'i' ],
                    [ 'm', 'i', 's', 's', '.' ]
                ]);

            } );

        } );

        describe( 'getFarthestIn(...)', () => {

            let trie : Trie<string>;
            beforeAll(() => { trie = new Trie( getArrayifiedNode() ) });

            test( 'finds the farthest item in sequences currently in this Trie', () => {
                expect( trie.getFarthestIn([
                    'm', 'i', 'c', 'h', 'o', 'a', 'c', 'a', 'n'
                ]) ).toEqual([ 'm', 'i', 'c', 'h' ]);
                // --- using strings --- //
                expect( trie.getFarthestIn( 'michoacan' ) ).toEqual([ 'm', 'i', 'c', 'h' ]);
            } );

            test( 'produces an empty sequence if none found in this Trie', () => {
                expect( trie.getFarthestIn([
                    'w', 'e', 's', 't', ' ', 'v', 'i', 'r', 'g', 'i', 'n', 'i', 'a'
                ]) ).toEqual([]);
                // --- using strings --- //
                expect( trie.getFarthestIn( 'west virginia' ) ).toEqual([]);
            } );

            test( 'produces an empty sequence for an empty sequence', () => {
                expect( trie.getFarthestIn() ).toEqual([]);
                expect( trie.getFarthestIn([]) ).toEqual([]);
            } );

            test( 'produces all items if all found in this Trie', () => {
                expect( trie.getFarthestIn([
                    'n', 'e', 'v', 'a', 'd', 'a'
                ]) ).toEqual([ 'n', 'e', 'v', 'a', 'd', 'a' ]);
                // --- using strings --- //
                expect( trie.getFarthestIn( 'nevada' ) ).toEqual([ 'n', 'e', 'v', 'a', 'd', 'a' ]);
            } );

            test( 'produces all items if found to be a complete subsequence in this Trie', () => {
                expect( trie.getFarthestIn([ 't', 'e', 'n' ]) ).toEqual([ 't', 'e', 'n' ]);
                // --- using strings --- //
                expect( trie.getFarthestIn( 'ten' ) ).toEqual([ 't', 'e', 'n' ]);
            } );

        } );
        
        describe( 'has(...)', () => {
            
            let trie;
            beforeAll(() => { trie = new Trie( getArrayifiedNode() ) });
            afterAll(() => { trie = null });
        
            test( 'affirms for a complete sequence in this instance', () => {
                expect( trie.has([ 'o', 'r', 'e', 'g', 'o', 'n' ]) ).toBe( true );
                // --- using strings --- //
                expect( trie.has( 'oregon' ) ).toBe( true );
            } );
        
            test( 'does not affirm for sequences not in this instance', () => {
                expect( trie.has([ 'i', 'o', 'w', 'a' ]) ).toBe( false );
                // --- using strings --- //
                expect( trie.has( 'iowa' ) ).toBe( false );
            } );
        
            test( 'does not affirm for imcomplete sequences in this instance', () => {
                expect( trie.has([ 'm', 'i', 's', 's', 'i' ]) ).toBe( false );
                // --- using strings --- //
                expect( trie.has( 'missi' ) ).toBe( false );
            } );
        
        } );
        
        describe( 'isSame(...)', () => {
        
            test( 'confirms a reference to this instance', () => {
                const trie = new Trie( trieableNode );
                expect( trie.isSame( trie ) ).toBe( true );
                expect( trie.isSame( new Trie( trieableNode ) ) ).toBe( false );
            } );
        
        } );
        
        describe( 'matches(...)', () => {

            let trie;
            beforeAll(() => { trie = new Trie( getArrayifiedNode() ) });
            afterAll(() => { trie = null });
        
            test( 'affirms that this instance data can be matched to this trieableNode children', () => {
                expect( trie.matches( trieableNode.children ) ).toBe( true );
            } );
        
            test( 'affirms that this instance data can be matched to this trieableNode', () => {
                expect( trie.matches( trieableNode ) ).toBe( true );
            } );
        
            test( 'affirms that this instance data can be matched to itself', () => {
                expect( trie.matches( trie ) ).toBe( true );
            } );
        
            test( 'affirms that this instance data can be matched to this trie', () => {
                expect( trie.matches( new Trie( arrayifiedNode ) ) ).toBe( true );
                // --- using strings --- //
                expect( trie.matches( new Trie( arrayifiedNode.map( arr => arr.join( '' ) ) ) ) ).toBe( true );
            } );
        
            test( 'affirms that this instance data can be matched this array of sequences', () => {
                expect( trie.matches( arrayifiedNode ) ).toBe( true );
                // --- using strings --- //
                expect( trie.matches( arrayifiedNode.map( arr => arr.join( '' ) ) ) ).toBe( true );
            } );
        
            test( 'affirms that this instance data is a mismatch of unmatched sequences', () => {
                const arr = getArrayifiedNode();
                arr.splice( 5, 1 );
                expect( trie.matches( arr ) ).toBe( false );
            } );
        
        } );
        
        describe( 'merge(...)', () => {
            let delayed, _arr;
            let exTrie : Trie<string>;
            beforeAll(() => {
                delayed = [
                    [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ],
                    [ 'o', 'r' ],
                    [ 'n', 'e', 'v', 'a', 'd', 'a' ],
                    [ 't', 'e', 'x', 'a', 's' ],
                    [ 'i', 'd', 'a', 'h', 'o' ]
                ];
                _arr = getArrayifiedNode();
                delayed.forEach( d => { _arr = removeSequence( _arr, d ) } );
                exTrie = new Trie( delayed );
            });
        
            test( 'merges an existing trie into this instance', () => {
                const thisTrie = new Trie<string>( _arr );
                let asArray = thisTrie.asArray();
                expect( asArray ).toMatchSequences( _arr );
                expect( asArray ).not.toMatchSequences( arrayifiedNode );
                asArray = exTrie.asArray();
                expect( asArray ).toMatchSequences( delayed );
                expect( asArray ).not.toMatchSequences( arrayifiedNode );
                thisTrie.merge( exTrie );
                asArray = exTrie.asArray();
                expect( asArray ).toMatchSequences( delayed );
                expect( asArray ).not.toMatchSequences( arrayifiedNode );
                asArray = thisTrie.asArray();
                expect( asArray ).not.toMatchSequences( _arr );
                expect( asArray ).toMatchSequences( arrayifiedNode );
            } );
        
            test( 'merges a existing trieableNode into this instance', () => {
                const trieableNode = exTrie.asTrieableNode()
                const thisTrie = new Trie<string>( _arr );
                let asArray = thisTrie.asArray();
                expect( asArray ).toMatchSequences( _arr );
                expect( asArray ).not.toMatchSequences( arrayifiedNode );
                thisTrie.merge( trieableNode );
                asArray = thisTrie.asArray();
                expect( asArray ).not.toMatchSequences( _arr );
                expect( asArray ).toMatchSequences( arrayifiedNode );
            } );
        
            test( 'spins off subsequences from longer sequence', () => {
                const prefix = [ 'm', 'i' ];
                const delayed = [
                    [ 'm', 'i' ],
                    [ 'm', 'i', 'c', 'h', 'i', 'g', 'a', 'n' ],
                    [ 'm', 'i', 's', 's', '.' ],
                    [ 'm', 'i', 's', 's', 'o', 'u', 'r', 'i' ]
                ];
                let _arr = getArrayifiedNode();
                delayed.forEach( d => { _arr = removeSequence( _arr, d ) } );
                const root = new Node<string>( null, undefined, undefined, _arr );
                let node = root.childNodes.get( prefix[ 0 ] );
                node = node!.childNodes.get( prefix[ 1 ] );
                let sequences = node!.asArray().map( seq => [ ...prefix, ...seq ] );
                expect( sequences ).toMatchSequences([
                    [ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ]
                ]);
                root.merge( new Node<string>(
                    delayed[ 0 ][ 0 ],
                    undefined,
                    undefined,
                    delayed.map( d => d.slice( 1 ) )
                ) );
                node = root.childNodes.get( prefix[ 0 ] );
                node = node!.childNodes.get( prefix[ 1 ] );
                sequences = node!.asArray().map( seq => [ ...prefix, ...seq ] );
                expect( sequences ).toMatchSequences([
                    [ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ],
                    ...delayed
                ]);
            } );
        } );
        
        describe( 'remove(...)', () => {
        
            test( 'removes a complete sequence', () => {
                let trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                let status = trie.remove([ 't', 'e', 'x', 'a', 's' ]);
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length - 1 );
                expect( status ).toBe( true );
                // --- using strings --- //
                trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                status = trie.remove( 'texas' );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length - 1 );
                expect( status ).toBe( true );
            } );
        
            test( 'removes a complete subsequence of a longer sequence', () => {
                let trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                let status = trie.remove([ 'o', 'r' ]);
                expect( trie.has([ 'o', 'r', 'e', 'g', 'o', 'n' ]) ).toBe( true );
                expect( trie.has([ 'o', 'r' ]) ).toBe( false );
                expect( status ).toBe( true );
                // --- using strings --- //
                trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                status = trie.remove( 'or' );
                expect( trie.has([ 'o', 'r', 'e', 'g', 'o', 'n' ]) ).toBe( true );
                expect( trie.has([ 'o', 'r' ]) ).toBe( false );
                expect( status ).toBe( true );
            } );
        
            test( 'removes a complete longer sequence while preserving its subsequence', () => {
                let trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                let status = trie.remove([ 'o', 'r', 'e', 'g', 'o', 'n' ]);
                expect( trie.has([ 'o', 'r', 'e', 'g', 'o', 'n' ]) ).toBe( false );
                expect( trie.has([ 'o', 'r' ]) ).toBe( true );
                expect( status ).toBe( true );
                // --- using string --- //
                trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                status = trie.remove( 'oregon' );
                expect( trie.has( 'oregon ') ).toBe( false );
                expect( trie.has( 'or' ) ).toBe( true );
                expect( status ).toBe( true );
            } );
        
            test( 'ignores incomplete sequence', () => {
                let trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                let status = trie.remove([ 'o', 'r', 'e', 'g' ]);
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                expect( status ).toBe( false );
                // --- using  strings --- //
                trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                status = trie.remove( 'oreg' );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                expect( status ).toBe( false );
            } );
        
            test( 'ignores inexistent sequence', () => {
                let trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                let status = trie.remove([ 'i', 'o', 'w', 'a' ]);
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                expect( status ).toBe( false );
                // --- using strings --- //
                trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                status = trie.remove( 'iowa' );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                expect( status ).toBe( false );
            } );
        
        } );
        
        describe( 'removeAllStartingWith(...)', () => {
        
            test( 'removes all under a particular node', () => {
                let trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                const prefix = [ 'm', 'i', 's', 's' ];
                trie.removeAllStartingWith( prefix );
                let remaining = trie.asArray();
                expect( remaining ).not.toHaveLength( arrayifiedNode.length );
                expect( remaining.length ).toBeLessThan( arrayifiedNode.length );
                expect( trie.asArray() ).toHaveLength(
                    arrayifiedNode.filter( n => !prefix.every(
                        ( p, i ) => n[ i ] === p
                    ) ).length
                );
                // --- using strings --- //
                trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                trie.removeAllStartingWith( 'miss' );
                remaining = trie.asArray();
                expect( remaining ).not.toHaveLength( arrayifiedNode.length );
                expect( remaining.length ).toBeLessThan( arrayifiedNode.length );
                expect( trie.asArray() ).toHaveLength(
                    arrayifiedNode.filter( n => !prefix.every(
                        ( p, i ) => n[ i ] === p
                    ) ).length
                );
            } );
        
            test( 'removes all up to and including the prefix sequence if a complete sequence', () => {
                let trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                const prefix = [ 'm', 'i' ];
                trie.removeAllStartingWith( prefix );
                let remaining = trie.asArray();
                expect( remaining ).not.toHaveLength( arrayifiedNode.length );
                expect( remaining.length ).toBeLessThan( arrayifiedNode.length );
                expect( trie.asArray() ).toHaveLength(
                    arrayifiedNode.filter( n => !prefix.every(
                        ( p, i ) => n[ i ] === p
                    ) ).length
                );
                // --- using strings --- //
                trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                trie.removeAllStartingWith( 'mi' );
                remaining = trie.asArray();
                expect( remaining ).not.toHaveLength( arrayifiedNode.length );
                expect( remaining.length ).toBeLessThan( arrayifiedNode.length );
                expect( trie.asArray() ).toHaveLength(
                    arrayifiedNode.filter( n => !prefix.every(
                        ( p, i ) => n[ i ] === p
                    ) ).length
                );
            } );
        
            test( 'removes nothing if node not found', () => {
                const trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                trie.removeAllStartingWith([ 'i', 'l' ]);
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                // --- using strings --- //
                trie.removeAllStartingWith( 'il' );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
            } );
        
            test( 'removes nothing if no prefix was provided', () => {
                let trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                trie.removeAllStartingWith([]);
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                trie.removeAllStartingWith();
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
            } );
        
        } );
        
        describe( 'removeMany(...)', () => {
        
            test( 'remove several sequences at once', () => {
                const trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                const removed = [
                    [ 'o', 'r' ],
                    'idaho',
                    [ 'm', 'a', 'i', 'n', 'e' ]
                ];
                const status = trie.removeMany( removed );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length - removed.length );
                expect( status ).toHaveLength( removed.length );
                status.forEach( s => expect( s ).toBe( OpStatus.SUCCESSFUL ) );
            } );
        
            test( 'provides feedback per item ', () => {
                const trie = new Trie( arrayifiedNode );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length );
                const removed = [
                    [ 'o', 'r' ],
                    [ 'l', 'o', 'u', 'i', 's', 'i', 'a', 'n', 'a' ],
                    [ 'i', 'd', 'a', 'h', 'o' ],
                    [ 'm', 'i', 'n', 'n', 'e', 's', 'o', 't', 'a' ],
                    [ 'm', 'a', 'i', 'n' ],
                    [ 'm', 'a', 'i', 'n', 'e' ]
                ];
                const status = trie.removeMany( removed );
                expect( trie.asArray() ).toHaveLength( arrayifiedNode.length - 3 );
                expect( status ).toHaveLength( removed.length );
                expect( status[ 0 ] ).toBe( OpStatus.SUCCESSFUL );
                expect( status[ 1 ] ).toBe( OpStatus.FAILED );
                expect( status[ 2 ] ).toBe( OpStatus.SUCCESSFUL );
                expect( status[ 3 ] ).toBe( OpStatus.FAILED );
                expect( status[ 4 ] ).toBe( OpStatus.FAILED );
                expect( status[ 5 ] ).toBe( OpStatus.SUCCESSFUL );
            } );
        
        } );
    
    } );

    describe( "deference to data's own hashCode property whenever present", () => {
        class Int {
            v : number;
            constructor( v ) { this.v = v }
        }
        class TNodes extends ChildNodes<Int> {
            getCodes() { return this.codes }
            getKeys() { return this.keys }
            constructor() { super( ( a, b ) => a.v === ( b as Int ).v ) }
            indexOf( data : Int ) { return this.keys.findIndex( k => this.isEqualValue( data, k ) ) }
            protected _optForKeyLocator( key: Int ) { return true }
        }
        test( 'if hashCode function, resolve and use the computed value', () => {
            const hashMock = jest.fn();
            class TestInt extends Int {
                hashCode() {
                    hashMock();
                    return this.v;
                }
            }
            const getInt = v => new Node( new TestInt( v ) as Int );
            const childNodes = new TNodes();
            const zeroInt = getInt( 0 );
            childNodes.set( getInt( 5 ) );
            childNodes.set( getInt( 32 ) );
            childNodes.set( zeroInt );
            childNodes.set( getInt( -1 ) );
            childNodes.set( zeroInt );
            expect( hashMock ).toHaveBeenCalledTimes( 5 );
            hashMock.mockClear();
            expect( hashMock ).not.toHaveBeenCalled();
            childNodes.set( getInt( 88 ) );
            childNodes.set( getInt( 64 ) );
            expect( hashMock ).toHaveBeenCalledTimes( 2 );
            expect( childNodes.getCodes() ).toHaveLength( 6 );
            expect( new Set( childNodes.getCodes() ).size ).toBe( 6 );
        } );
        
        test( 'if constant hashCode, simple use the value as-is', () => {
            class TestInt extends Int { hashCode = 1024 }
            const getInt = v => new Node( new TestInt( v ) as Int );
            const childNodes = new TNodes();
            const zeroInt = getInt( 0 );
            childNodes.set( getInt( 5 ) );
            childNodes.set( getInt( 32 ) );
            childNodes.set( zeroInt );
            childNodes.set( getInt( -1 ) );
            childNodes.set( zeroInt );
            childNodes.set( getInt( 88 ) );
            childNodes.set( getInt( 64 ) );
            expect( childNodes.getCodes() ).toHaveLength( 6 );
            expect( childNodes.getCodes().every( c => c === 1024 ) ).toBe( true );
        } );
    
    } );

} );
