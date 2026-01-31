# MongoDB Query Builder

A comprehensive, type-safe query builder for MongoDB in Deno. Build complex MongoDB queries, aggregations, and updates with full TypeScript support and autocomplete.

## Features

- 🔒 **Type-safe**: Full TypeScript support with field-level type checking
- 🎯 **Fluent API**: Chainable methods for readable query construction
- 🚀 **Zero dependencies**: Lightweight and fast
- 📦 **Deno-first**: Built specifically for Deno runtime
- 🔍 **IntelliSense**: Get autocomplete for your schema fields
- 🔄 **Aggregation Pipelines**: Build complex aggregations with ease
- ✏️ **Update Operations**: Type-safe update builders for all MongoDB update operators
- 🔌 **Driver Integration**: Works with official MongoDB driver and Deno MongoDB

## Installation

```typescript
// Query builder
import { query } from "jsr:@your-scope/mongo-builder";

// Aggregation builder
import { aggregate, Accumulators } from "jsr:@your-scope/mongo-builder";

// Update builder
import { update } from "jsr:@your-scope/mongo-builder";

// TypedCollection wrapper (recommended)
import { typed } from "jsr:@your-scope/mongo-builder/integration";
```

## Quick Start

```typescript
import { query } from "jsr:@your-scope/mongo-builder";

// Define your schema
interface User {
  name: string;
  age: number;
  email: string;
  active: boolean;
  createdAt: Date;
}

// Build a query
const result = query<User>()
  .where('age').gte(18)
  .where('active').eq(true)
  .where('email').regex(/gmail\.com$/)
  .select('name', 'email')
  .sortDesc('createdAt')
  .limit(10)
  .build();

// Use with MongoDB driver
const users = await collection.find(result.filter, {
  projection: result.projection,
  sort: result.sort,
  limit: result.limit,
});
```

## API Reference

### Basic Queries

#### Comparison Operators

```typescript
query<User>()
  .where('age').eq(25)      // Equal
  .where('age').ne(25)      // Not equal
  .where('age').gt(18)      // Greater than
  .where('age').gte(18)     // Greater than or equal
  .where('age').lt(65)      // Less than
  .where('age').lte(65)     // Less than or equal
```

#### Array Operators

```typescript
query<User>()
  .where('role').in(['admin', 'moderator'])
  .where('status').nin(['banned', 'deleted'])
```

#### Field Operators

```typescript
query<User>()
  .where('email').exists(true)
  .where('deletedAt').exists(false)
  .where('name').regex(/^John/, 'i')  // Case-insensitive regex
```

### Projection

```typescript
// Select specific fields
query<User>()
  .select('name', 'email')
  .build();

// Exclude specific fields
query<User>()
  .exclude('password', 'internalId')
  .build();
```

### Sorting

```typescript
query<User>()
  .sortAsc('name')
  .sortDesc('createdAt')
  .build();
```

### Pagination

```typescript
query<User>()
  .limit(20)
  .skip(40)  // Page 3 with 20 items per page
  .build();
```

### Logical Operators

```typescript
const query1 = query<User>().where('age').gte(18);
const query2 = query<User>().where('country').eq('US');

// OR
query<User>()
  .or(query1, query2)
  .build();

// AND (explicit, though default behavior)
query<User>()
  .and(query1, query2)
  .build();
```

### Raw Queries

For complex queries not covered by the builder:

```typescript
query<User>()
  .raw({ 
    $or: [
      { age: { $gte: 18 } },
      { verified: true }
    ]
  })
  .build();
```

## TypedCollection - Recommended Approach

For the best developer experience, wrap your collections with the `typed()` helper:

```typescript
import { typed } from "jsr:@your-scope/mongo-builder/integration";
import { MongoClient } from "npm:mongodb@6";

const client = new MongoClient("mongodb://localhost:27017");
await client.connect();

interface User {
  name: string;
  email: string;
  age: number;
  active: boolean;
}

const db = client.db("myapp");
const users = typed<User>(db.collection("users"));

// Find with fluent builder
const activeUsers = await users.find(qb =>
  qb.where('active').eq(true)
    .where('age').gte(18)
    .sortDesc('name')
    .limit(10)
);

// Update with fluent builder
await users.updateOne(
  qb => qb.where('email').eq('user@example.com'),
  ub => ub.inc('loginCount', 1).currentDate('lastLogin')
);

// Aggregate with fluent builder
const stats = await users.aggregate(ab =>
  ab.match({ active: true })
    .group('country', {
      count: { $sum: 1 },
      avgAge: { $avg: '$age' }
    })
    .sort({ count: -1 })
);
```

## Aggregation Pipelines

Build complex aggregation pipelines with type safety:

```typescript
import { aggregate, Accumulators } from "jsr:@your-scope/mongo-builder";

interface Order {
  customerId: string;
  total: number;
  status: string;
  items: Array<{ productId: string; quantity: number }>;
  createdAt: Date;
}

const pipeline = aggregate<Order>()
  .match({ status: 'completed' })
  .unwind('items')
  .group('customerId', {
    orderCount: Accumulators.count(),
    totalSpent: Accumulators.sum('total'),
    avgOrderValue: Accumulators.avg('total'),
  })
  .sort({ totalSpent: -1 })
  .limit(10)
  .build();

const topCustomers = await orders.aggregate(pipeline).toArray();
```

### Available Aggregation Stages

- `match()` - Filter documents
- `group()` - Group by field with accumulators
- `project()` - Reshape documents
- `sort()` - Sort results
- `limit()` / `skip()` - Pagination
- `unwind()` - Deconstruct arrays
- `lookup()` - Join collections
- `addFields()` - Add computed fields
- `count()` - Count documents
- `bucket()` - Categorize into buckets
- `sample()` - Random sample
- `facet()` - Multiple pipelines
- `replaceRoot()` - Replace root document

## Update Operations

Type-safe update builders for all MongoDB update operators:

```typescript
import { update } from "jsr:@your-scope/mongo-builder";

interface Product {
  name: string;
  price: number;
  quantity: number;
  tags: string[];
  views: number;
}

// Build complex updates
const updateDoc = update<Product>()
  .set('price', 29.99)
  .inc('quantity', -1)
  .inc('views', 1)
  .push('tags', 'featured')
  .currentDate('updatedAt')
  .build();

await products.updateOne({ _id: productId }, updateDoc);
```

### Available Update Operators

- `set()` / `setMany()` - Set field values
- `unset()` - Remove fields
- `inc()` - Increment numbers
- `mul()` - Multiply numbers
- `min()` / `max()` - Update if less/greater
- `push()` - Add to array (with modifiers)
- `pull()` - Remove from array
- `addToSet()` - Add unique to array
- `pop()` - Remove first/last element
- `rename()` - Rename field
- `currentDate()` - Set to current date/timestamp

## Complete Example

```typescript
import { query } from "jsr:@your-scope/mongo-builder";
import { MongoClient } from "mongodb_driver";

interface BlogPost {
  title: string;
  author: string;
  tags: string[];
  published: boolean;
  views: number;
  createdAt: Date;
}

const client = new MongoClient();
const db = client.database("blog");
const posts = db.collection<BlogPost>("posts");

// Find popular, published posts from the last month
const oneMonthAgo = new Date();
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

const queryResult = query<BlogPost>()
  .where('published').eq(true)
  .where('views').gte(1000)
  .where('createdAt').gte(oneMonthAgo)
  .where('tags').in(['javascript', 'typescript', 'deno'])
  .select('title', 'author', 'views', 'createdAt')
  .sortDesc('views')
  .limit(10)
  .build();

const popularPosts = await posts.find(queryResult.filter, {
  projection: queryResult.projection,
  sort: queryResult.sort,
  limit: queryResult.limit,
}).toArray();

console.log(popularPosts);
```

## More Examples

See [examples.md](./examples.md) for comprehensive examples including:
- Official MongoDB driver integration
- Deno MongoDB driver integration
- Advanced aggregation patterns
- Complex update operations
- Real-world application examples

## Type Safety

The query builder provides full type safety:

```typescript
interface User {
  name: string;
  age: number;
}

// ✅ Valid - age is a number
query<User>().where('age').gte(18);

// ✅ Valid - name is a string
query<User>().where('name').eq('John');

// ❌ TypeScript error - 'invalid' is not a field of User
query<User>().where('invalid').eq('value');

// ✅ Autocomplete works for select
query<User>().select('name', 'age');  // IDE suggests only 'name' and 'age'
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR on the repository.
