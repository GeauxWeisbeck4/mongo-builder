# Quick Start Guide

Get started with MongoDB Query Builder in 5 minutes.

## 1. Install

```typescript
import { typed } from "jsr:@your-scope/mongo-builder/integration";
```

## 2. Connect to MongoDB

Choose your driver:

### Option A: Official MongoDB Driver (npm)

```typescript
import { MongoClient } from "npm:mongodb@6";

const client = new MongoClient("mongodb://localhost:27017");
await client.connect();
const db = client.db("myapp");
```

### Option B: Deno MongoDB Driver (jsr)

```typescript
import { MongoClient } from "jsr:@db/mongo@0.33";

const client = new MongoClient();
await client.connect("mongodb://localhost:27017");
const db = client.database("myapp");
```

## 3. Define Your Schema

```typescript
interface User {
  _id?: string;
  name: string;
  email: string;
  age: number;
  role: 'user' | 'admin' | 'moderator';
  active: boolean;
  tags: string[];
  createdAt: Date;
  loginCount: number;
}
```

## 4. Create Typed Collection

```typescript
import { typed } from "jsr:@your-scope/mongo-builder/integration";

const users = typed<User>(db.collection("users"));
```

## 5. Start Querying

### Find Documents

```typescript
// Simple find
const activeUsers = await users.find(qb =>
  qb.where('active').eq(true)
);

// Complex find with multiple conditions
const admins = await users.find(qb =>
  qb.where('role').eq('admin')
    .where('age').gte(18)
    .where('email').regex(/@company\.com$/)
    .sortDesc('createdAt')
    .limit(10)
);

// Find with projection
const userNames = await users.find(qb =>
  qb.select('name', 'email')
    .where('active').eq(true)
);
```

### Find One Document

```typescript
const user = await users.findOne(qb =>
  qb.where('email').eq('john@example.com')
);

if (user) {
  console.log(`Found ${user.name}`);
}
```

### Update Documents

```typescript
// Update one
await users.updateOne(
  qb => qb.where('email').eq('john@example.com'),
  ub => ub
    .inc('loginCount', 1)
    .currentDate('lastLogin')
    .set('active', true)
);

// Update many
await users.updateMany(
  qb => qb.where('active').eq(false)
    .where('createdAt').lt(new Date('2023-01-01')),
  ub => ub
    .set('archived', true)
    .currentDate('archivedAt')
);

// Array operations
await users.updateOne(
  qb => qb.where('_id').eq(userId),
  ub => ub
    .push('tags', 'premium')
    .pull('tags', 'trial')
);
```

### Delete Documents

```typescript
// Delete one
await users.deleteOne(qb =>
  qb.where('email').eq('spam@example.com')
);

// Delete many
await users.deleteMany(qb =>
  qb.where('active').eq(false)
    .where('loginCount').eq(0)
);
```

### Count Documents

```typescript
// Count all
const totalUsers = await users.count();

// Count with filter
const activeCount = await users.count(qb =>
  qb.where('active').eq(true)
);
```

### Aggregations

```typescript
// Group by role and count
const roleStats = await users.aggregate(ab =>
  ab.match({ active: true })
    .group('role', {
      count: { $sum: 1 },
      avgAge: { $avg: '$age' },
      totalLogins: { $sum: '$loginCount' }
    })
    .sort({ count: -1 })
);

console.log(roleStats);
// [
//   { _id: 'user', count: 150, avgAge: 32, totalLogins: 5230 },
//   { _id: 'admin', count: 5, avgAge: 35, totalLogins: 1200 },
//   ...
// ]
```

## Common Patterns

### Pagination

```typescript
const page = 2;
const pageSize = 20;

const paginatedUsers = await users.find(qb =>
  qb.where('active').eq(true)
    .sortDesc('createdAt')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
);
```

### Search by Multiple Fields

```typescript
const searchTerm = 'john';
const results = await users.raw.find({
  $or: [
    { name: { $regex: searchTerm, $options: 'i' } },
    { email: { $regex: searchTerm, $options: 'i' } }
  ]
}).toArray();
```

### Date Range Queries

```typescript
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-12-31');

const usersThisYear = await users.find(qb =>
  qb.where('createdAt').gte(startDate)
    .where('createdAt').lte(endDate)
);
```

### Increment Counters

```typescript
// Increment view count
await users.updateOne(
  qb => qb.where('_id').eq(userId),
  ub => ub.inc('profileViews', 1)
);
```

### Add/Remove from Arrays

```typescript
// Add tag if not exists
await users.updateOne(
  qb => qb.where('_id').eq(userId),
  ub => ub.addToSet('tags', 'verified')
);

// Remove tag
await users.updateOne(
  qb => qb.where('_id').eq(userId),
  ub => ub.pull('tags', 'pending')
);
```

## Without TypedCollection Wrapper

If you prefer to use the raw MongoDB collection:

```typescript
import { query, update, aggregate } from "jsr:@your-scope/mongo-builder";

const collection = db.collection<User>("users");

// Find
const queryResult = query<User>()
  .where('active').eq(true)
  .sortDesc('createdAt')
  .limit(10)
  .build();

const users = await collection.find(queryResult.filter, {
  projection: queryResult.projection,
  sort: queryResult.sort,
  limit: queryResult.limit,
}).toArray();

// Update
const updateDoc = update<User>()
  .inc('loginCount', 1)
  .currentDate('lastLogin')
  .build();

await collection.updateOne(
  { email: 'john@example.com' },
  updateDoc
);

// Aggregate
const pipeline = aggregate<User>()
  .match({ active: true })
  .group('role', { count: { $sum: 1 } })
  .build();

const stats = await collection.aggregate(pipeline).toArray();
```

## Next Steps

- Read the [full README](./README.md) for complete API reference
- Check out [examples.md](./examples.md) for real-world use cases
- Explore aggregation operators in [aggregation.ts](./aggregation.ts)
- Learn about update operators in [update.ts](./update.ts)

## Tips

1. **Use TypedCollection** - It provides the best developer experience
2. **Type your schemas** - TypeScript will catch field name typos
3. **Chain methods** - Build complex queries step by step
4. **Use aggregations** - For analytics and reporting
5. **Test your queries** - Run them in MongoDB shell first if unsure

Happy querying! 🚀
