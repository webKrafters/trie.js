# Trie JS

<p align="center">
  <img height="240" src="logo.png" width="640"></img>
</p>

# Introduction

**Trie JS** is a sortable Trie data structure for arranging any sequential data type for a speedy search and retrieval

### Name:

<strong>@webkrafters/trie</strong><br />
<strong>Alternate:</strong> trie.js

# Installation

npm install --save @webkrafters/trie

# Usage

## First Things First
### Define "complete sequence".
<p>A complete sequence is an instant sequential data placed in a Trie instance at a specific point in time.</p>
<p>Consider we placed in a hypothetical Trie instance the following three entries:</p>
<ol>
  <li><code>[ 'u','t', 'a', 'h' ]</code></li>
  <li><code>[ 'm', 'i', 's', 's', 'i', 's', 's', 'i', 'p', 'p', 'i' ]</code></li>
  <li><code>[ 'o', 'h', 'i', 'o' ]</code></li>
</ol>
<p>The Trie instance now comprises 3 complete seqeuences.</p>
<p>The following sequence <code>[ 'm', 'i', 's', 's', 'i', 's', 's', 'i' ]</code>, though present in the instance, is currently an incomplete sequence. But once we add it, it then becomes a complete sequence.</p>

## Constructor (3 Overloads)
```tsx
1. constructor(data?: Trie<T>, opts?: Options<T>);
```
```tsx
2. constructor(data?: TrieableNode<T>, opts?: Options<T>);
```
```tsx
3. constructor(data?: Array<Iterable<T>|TrieableNode<T>>, opts?: Options<T>);
```
<p>
To create an instance of this Trie with the following data:<br />
<code>[ 'Tennessee', 'MI', Nevada', 'Texas', 'Oregon', 'Michigan' ]</code>,<br />
use the <code>constructor #4</code> like so:
</p>

```tsx
new Trie<string>([ 'tennessee', 'mi', 'texas', 'oregon', 'michigan' ]);
```
***OR***
```tsx
new Trie<string>([
    [ 't', 'e', 'n', 'n', 'e', 's', 's', 'e', 'e' ],
    [ 'm', 'i' ],
    [ 't', 'e', 'x', 'a', 's' ],
    [ 'o', 'r', 'e', 'g', 'o', 'n' ],
    [ 'm', 'i', 'c', 'h', 'i', 'g', 'a', 'n' ]
]); 
```

### Sorted Option
<p>
  For a sorted instance, add the </code>sorted</code> option at instantiation. A Trie instance created with this option automatically stores items in ascending order:
</p>

```tsx
new Trie<string>( data, { sorted: true }); 
```
### Working with Complex Data Types
<p>
The default <code>lessThanMatcher</code> only allows for a single data type at a time, namely: <code>string</code>, <code>number</code>, <code>bigint</code> and <code>boolean</code>.
</p>
<p>
When working with <b>complex data types</b>, including mixed data types, in a sorted instance, also add a custom <code>lessThanMatcher</code> option at instantiation:
</p>

```tsx
new Trie<string>( data, {
    lessThanMatcher: EqualityFn<string>,
    sorted: true
} ); 
```
<p>
This Trie implementation uses <code>sameZeroValue</code> algorithm by default for equality checks for all types. For a more granular control, feel free to add a custom <code>equalityMatcher</code> option at instantiation.
</p>

```tsx
new Trie<string>( data, {
    equalityMatcher: EqualityFn<string>,
    lessThanMatcher?: EqualityFn<string>,
    sorted?: boolean
} ); 
```

### A Quick Word on Hashing
<p>This Trie implementation employs a bespoke HashMap implementation under the hood to enhance data retrieval. It applies a default hashing algorithm as part of this HashMap.</p>
<p>For data objects with <code>hashCode</code> property, that <code>hashCode</code> property will be used instead. Both constant <code>hashCode</code> property and <code>hashCode</code> method types are recognized.</p>

```tsx
new Trie([
    [
      { ..., hashCode(){ return <some value> } },
      { ..., hashCode: <some value> },
      ...
    ],
    ...
]); 
```

## Properties

### isEmpty
#### readonly
<p>Confirms if this instance contains any complete sequence in it.</p>

```tsx
isEmpty: boolean
```
### size
#### readonly
<p>Produces the number of complete sequences in this instance.</p>

```tsx
size: number
```

## Methods (Scope: Public)

### add
<p>Accepts a sequence of items to merge into this instance.</p>

```tsx
add( data: Iterable<T> ): void
```
### addMany
<p>Accepts sequences of items and TrieableNodes or a combination thereof to merge into this instance.</p>

```tsx
addMany( data: Array<Iterable<T>|TrieableNode<T>> ): void
```
### asArray
<p>Produces all sequences in this instance as an array of sequential data.</p>
<p><b>Strings are returned as array of <code>chars</code>.</b></p>
<p>Only complete sequences are returned by default. Set the optional <code>completeSequencesOnly</code> argument to false to produce all sequences in the instance.

```tsx
asArray( completeSequencesOnly: boolean ): Array<Array<T>> 
```
### asTrieableNode
<p>Produces the data in this instance as a TrieableNode.</p>

```tsx
asTrieableNode(): TrieableNode<T>
```
### clear
<p>Clears all data contained in this instance.</p>

```tsx
clear(): void
```
### clone
<p>Creates a deep clone of this instance.</p> 

```tsx
clone(): Trie<T>
```
### getAllStartingWith
<p>
Produces all sequences that begin with the prefix sequence. Will produce only complete sequences by default. 
</p>
<p><b>Strings are returned as array of <code>chars</code>.</b></p>
<p>
To get all sequences including incomplete ones, set the optional <code>completeSequencesOnly</code> argument to <code>false</code>.
</p>
<p>
<strong>Note:</strong><br /> 
Produces up to and including the prefix sequence if found to be a complete sequence within this instance.
</p>
<p>
<strong>Note:</strong><br /> 
An empty prefix sequence will produce an empty array.
</p>

```tsx
getAllStartingWith(
  prefix: Iterable<T>, 
  completeSequencesOnly: boolean
): Array<Array<T>>
```

### getFarthestIn
<p>Finds the longest subsequence within the <code>sequence</code> argument currently existing in this instance. The returned longest subsequence does not have to be a complete sequence.</p>
<p>
<p><b>Strings are returned as array of <code>chars</code>.</b></p>
<strong>Note:</strong><br /> 
Produces up to and including the sequence if found within this instance.
</p>
<p>
<strong>Note:</strong><br /> 
An empty sequence will produce an empty array.
</p>

```tsx
getFarthestIn( sequence: Iterable<T> ): Array<T>
```
### has
<p>
Confirms that a complete matching sequence exists in this instance. 
</p>

```tsx
has( sequence : Iterable<T> ): boolean
```
### isSame
<p>
 Confirms that the Trie is this instance.
 </p>

```tsx
isSame( trie: Trie<T> ): boolean
```
### matches (4 Overloads)
<p>
Confirms that the supplied graph is a data equivalent of this instance.
</p>

```tsx
1. matches( graph : Array<Iterable<T>> ): boolean
```
```tsx
2. matches( graph : Array<TrieableNode<T>> ): boolean
```
```tsx
3. matches( graph : TrieableNode<T> ): boolean
```
```tsx
4. matches( graph : Trie<T> ): boolean
```
### merge (2 Overloads)
<p>
Merges tree data into this instance.
</p>

```tsx
1. merge( data : Trie<T> ): void
```
```tsx
2. merge( data : TrieableNode<T> ): void
```
### remove
<p>
Accepts a sequence of items to remove from this instance if a matching complete sequence located.
</p>
<p>
Returns <code>true</code> if found and removed.
</p>

```tsx
 remove( data: Iterable<T> ): boolean
```
### removeAllStartingWith
<p>
Removes all complete sequences that begin with the prefix sequence.
</p>
<p>
<strong>Note:</strong><br />
Removes up to and including the prefix sequence if found to be a complete sequence within this instance.
</p>
<p>
<strong>Note:</strong><br />
An empty prefix sequence will result in no removal.
</p>

```tsx
removeAllStartingWith(prefix : Iterable<T>): void
```

### removeMany
<p>
Accepts sequences of items to remove from the trie. Will record the outcome of the removal operation for each sequence:
</p>
<p>
<code>SUCCESSFUL</code> if found and removed and <code>FAILED</code> if a complete sequence matching this data was not located in this instance.
</p>

```tsx
removeMany(data : Array<Iterable<T>>): Array<OpStatus>
```

## Methods (Scope: Protected)

### _getNodeAtPrefixEnd
<p>Produces the underlying node containing the final value in <code>prefix</code> items.</p>
<p>Will produce the root node for the empty <code>prefix</code> items.</p>

```tsx
_getNodeAtPrefixEnd( prefix: Iterable<T> ): Node<T>
```
## Static

### makeTrieable
<p>Converts any nested object to a TrieableNode by applying a keyMapping.</p>
<p>The generated TrieableNode object could then be supplied to a Trie instance.</p>

```tsx
makeTrieable<T>(
    node: NESTED_OBJECT,
    keyMap: TrieableNodeKeyMapping,
    parentNode: TrieableNode<T>
): TrieableNode<T>
```
<p>
A TrieableNode<T> mapping to a complete Trie<T> instance has the following root node shape:
</p>

```tsx
{
    data: null, // <--- notice the `null` value for this property at the root level.
    children?: Array<TrieableNode<T>>,
    isBoundary?: boolean,
    parent?: any
}  
```
<p>Here is a sample call:</p>

```tsx
/* assuming the following nested object to convert */
const nested = {
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
};
/* assuming the following keyMap please see more on keyMap in the next subsection. */
const keyMap = {
    children: [ 'x', 'z' ],
    data: 'y',
    isBoundary: 'w'
}
const trieableNode = Trie.makeTrieable( nested, keyMap );
//  => {
//     data: 55,
//     children: [{
//         data: 22,
//         isBoundary: true,
//         children: [{
//             data: 11,
//             parent: <ref 1>
//         }, {
//             data: 99,
//             children: [{
//                  isBoundary: true,
//                  data: 77,
//                  children: [
//                      { data: 760, parent: <ref 1> },
//                      { data: null, parent: <ref 1> }
//                  ],
//                  parent: <ref 1>
//             }, {
//                  data: null,
//                  parent: <ref 1>
//             }],
//             parent: <ref 1>
//         }]
//     }, {
//          data: 'testing',
//          parent: <ref 1>
//     }],
//     parent: null
// };

```
<strong><u>More on the KeyMap object:</u></strong><br />
<p>The <code>KeyMap</code> object maps properties in the nested object to corresponding TrieableNode properties.</p>
<p><code>KeyMap.children</code> can be:
<ol>
  <li>
    either <u>a single value</u> holding the name of a property within the nested object. The data in this property is either a single value or an iterable. This data will be transfered into the children property of a TrieableNode.
  </li>
  <li>
    or <u>an ordered array</u> containing various names of individual properties within the nested object. The data in each property will be transfered into an array index of a TrieableNode children property. The index coreesponds to the index of the key within <code>KeyMap.children</code>. <strong><u>NOTE:</u></strong> in case of any key whose property is missing in the nested object, a <code>null</code> value will be assigned in its place.
  </li>
</ol>
</p> 

# See Also
[@webKrafters/radix-trie](https://github.com/webKrafters/radix-trie.js/blob/master/README.md)

# License
MIT

