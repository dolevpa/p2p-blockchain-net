import { BloomFilter } from 'bloom-filters'
// create a Bloom Filter with a size of 10 and 4 hash functions
let filter = new BloomFilter(10, 4)
// insert data
filter.add('alice')
filter.add('yosi')
filter.add('bob')
filter.add('bobit')
console.log(filter);

// lookup for some data
console.log(filter.has('bob')) // output: true
console.log(filter.has('daniel1')) // output: false
console.log(filter.random())

// print the error rate
console.log(filter.rate())

// alternatively, create a bloom filter optimal for a number of items and a desired error rate
const items = ['alice', 'bob']
const errorRate = 0.04 // 4 % error rate
let filter2 = BloomFilter.create(items.length, errorRate)

// or create a bloom filter optimal for a collections of items and a desired error rate
filter2 = BloomFilter.from(items, errorRate)


