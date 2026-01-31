# Integration Examples

Complete examples showing how to use the MongoDB Query Builder with different MongoDB drivers.

## Table of Contents

- [Official MongoDB Driver (npm)](#official-mongodb-driver)
- [Deno MongoDB Driver](#deno-mongodb-driver)
- [TypedCollection Wrapper](#typedcollection-wrapper)
- [Advanced Aggregation Examples](#advanced-aggregation-examples)
- [Update Operations](#update-operations)

---

## Official MongoDB Driver

Using with the official MongoDB Node.js driver via npm.

```typescript
import { MongoClient } from "npm:mongodb@6";
import { query, update, aggregate } from "jsr:@your-scope/mongo-builder";

const client = new MongoClient("mongodb://localhost:27017");
await client.connect();

const db = client.db("myapp");

interface User {
  _id?: string;
  name: string;
  email: string;
  age: number;
  role: string;
  createdAt: Date;
  loginCount: number;
}

const users = db.collection<User>("users");

// Find with query builder
const queryResult = query<User>()
  .where('age').gte(18)
  .where('role').in(['admin', 'moderator'])
  .select('name', 'email', 'role')
  .sortDesc('createdAt')
  .limit(10)
  .build();

const results = await users.find(queryResult.filter, {
  projection: queryResult.projection,
  sort: queryResult.sort,
  limit: queryResult.limit,
}).toArray();

console.log(results);

// Update with update builder
const updateDoc = update<User>()
  .inc('loginCount', 1)
  .currentDate('lastLoginAt')
  .build();

await users.updateOne(
  { email: 'user@example.com' },
  updateDoc
);

// Aggregation example
const pipeline = aggregate<User>()
  .match({ role: 'user' })
  .group('role', {
    count: { $sum: 1 },
    avgAge: { $avg: '$age' },
  })
  .sort({ count: -1 })
  .build();

const stats = await users.aggregate(pipeline).toArray();
console.log(stats);

await client.close();
```

---

## Deno MongoDB Driver

Using with the native Deno MongoDB driver.

```typescript
import { MongoClient } from "jsr:@db/mongo@0.33";
import { query, update, aggregate } from "jsr:@your-scope/mongo-builder";

const client = new MongoClient();
await client.connect("mongodb://localhost:27017");

const db = client.database("myapp");

interface Product {
  _id?: string;
  name: string;
  price: number;
  category: string;
  tags: string[];
  inStock: boolean;
  rating: number;
}

const products = db.collection<Product>("products");

// Complex query
const queryResult = query<Product>()
  .where('inStock').eq(true)
  .where('price').gte(10).lte(100)
  .where('rating').gte(4)
  .where('tags').in(['electronics', 'featured'])
  .sortDesc('rating')
  .sortAsc('price')
  .limit(20)
  .build();

const topProducts = await products
  .find(queryResult.filter, {
    projection: queryResult.projection,
    sort: queryResult.sort,
    limit: queryResult.limit,
  })
  .toArray();

// Bulk update example
const updateDoc = update<Product>()
  .mul('price', 0.9) // 10% discount
  .push('tags', 'sale')
  .set('inStock', true)
  .build();

await products.updateMany(
  { category: 'electronics' },
  updateDoc
);

client.close();
```

---

## TypedCollection Wrapper

For the best developer experience, use the `TypedCollection` wrapper.

```typescript
import { MongoClient } from "npm:mongodb@6";
import { typed } from "jsr:@your-scope/mongo-builder/integration";

const client = new MongoClient("mongodb://localhost:27017");
await client.connect();

interface BlogPost {
  _id?: string;
  title: string;
  author: string;
  content: string;
  tags: string[];
  views: number;
  published: boolean;
  createdAt: Date;
}

const db = client.db("blog");
const posts = typed<BlogPost>(db.collection("posts"));

// Find with fluent API
const popularPosts = await posts.find(qb =>
  qb.where('published').eq(true)
    .where('views').gte(1000)
    .sortDesc('views')
    .limit(10)
);

console.log(`Found ${popularPosts.length} popular posts`);

// Find one
const post = await posts.findOne(qb =>
  qb.where('title').eq('Getting Started with Deno')
);

if (post) {
  console.log(`Post by ${post.author}`);
}

// Update with fluent API
await posts.updateOne(
  qb => qb.where('_id').eq(post!._id),
  ub => ub.inc('views', 1).currentDate('lastViewedAt')
);

// Update many
await posts.updateMany(
  qb => qb.where('published').eq(false).where('createdAt').lt(new Date('2024-01-01')),
  ub => ub.set('archived', true)
);

// Delete with fluent API
await posts.deleteMany(qb =>
  qb.where('archived').eq(true)
    .where('views').lt(10)
);

// Count documents
const totalPublished = await posts.count(qb =>
  qb.where('published').eq(true)
);

console.log(`Total published posts: ${totalPublished}`);

// Aggregation
const tagStats = await posts.aggregate(ab =>
  ab.match({ published: true })
    .unwind('tags')
    .group('tags', {
      count: { $sum: 1 },
      totalViews: { $sum: '$views' },
    })
    .sort({ count: -1 })
    .limit(10)
);

console.log('Top tags:', tagStats);

await client.close();
```

---

## Advanced Aggregation Examples

### User Activity Analytics

```typescript
import { aggregate, Accumulators } from "jsr:@your-scope/mongo-builder";

interface Activity {
  userId: string;
  action: string;
  timestamp: Date;
  duration: number;
  metadata: Record<string, any>;
}

// Daily user activity summary
const dailyActivity = aggregate<Activity>()
  .match({
    timestamp: { $gte: new Date('2024-01-01') },
  })
  .addFields({
    date: {
      $dateToString: {
        format: '%Y-%m-%d',
        date: '$timestamp',
      },
    },
  })
  .group('date', {
    uniqueUsers: { $addToSet: '$userId' },
    totalActions: { $sum: 1 },
    avgDuration: { $avg: '$duration' },
    actions: { $push: '$action' },
  })
  .addFields({
    userCount: { $size: '$uniqueUsers' },
  })
  .project({
    date: '$_id',
    userCount: 1,
    totalActions: 1,
    avgDuration: 1,
    _id: 0,
  })
  .sort({ date: -1 })
  .build();
```

### E-commerce Sales Report

```typescript
interface Order {
  customerId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  total: number;
  status: string;
  createdAt: Date;
}

// Monthly sales by category with revenue
const monthlySales = aggregate<Order>()
  .match({ status: 'completed' })
  .unwind('items')
  .lookup('products', 'items.productId', '_id', 'product')
  .unwind('product')
  .addFields({
    month: {
      $dateToString: { format: '%Y-%m', date: '$createdAt' },
    },
    itemRevenue: {
      $multiply: ['$items.quantity', '$items.price'],
    },
  })
  .group('$month', {
    totalRevenue: { $sum: '$itemRevenue' },
    orderCount: { $sum: 1 },
    avgOrderValue: { $avg: '$total' },
    topProducts: {
      $push: {
        product: '$product.name',
        quantity: '$items.quantity',
        revenue: '$itemRevenue',
      },
    },
  })
  .sort({ _id: -1 })
  .build();
```

### User Segmentation

```typescript
interface User {
  email: string;
  age: number;
  country: string;
  subscriptionTier: string;
  lastActive: Date;
}

// Segment users by age and activity
const userSegments = aggregate<User>()
  .addFields({
    daysSinceActive: {
      $divide: [
        { $subtract: [new Date(), '$lastActive'] },
        1000 * 60 * 60 * 24,
      ],
    },
  })
  .bucket(
    'age',
    [18, 25, 35, 45, 55, 100],
    {
      output: {
        count: { $sum: 1 },
        avgDaysSinceActive: { $avg: '$daysSinceActive' },
        countries: { $addToSet: '$country' },
        subscriptionTiers: { $push: '$subscriptionTier' },
      },
    }
  )
  .build();
```

---

## Update Operations

### Profile Update with Validation

```typescript
import { update, query } from "jsr:@your-scope/mongo-builder";

interface UserProfile {
  email: string;
  displayName: string;
  bio: string;
  socialLinks: string[];
  stats: {
    followers: number;
    following: number;
  };
  updatedAt: Date;
}

// Update user profile
const profileUpdate = update<UserProfile>()
  .set('displayName', 'John Doe')
  .set('bio', 'Software developer and open source enthusiast')
  .addToSet('socialLinks', 'https://github.com/johndoe')
  .inc('stats.followers', 1)
  .currentDate('updatedAt')
  .build();

await users.updateOne(
  { email: 'john@example.com' },
  profileUpdate
);
```

### Inventory Management

```typescript
interface Product {
  sku: string;
  quantity: number;
  reservedQuantity: number;
  lastRestocked: Date;
  priceHistory: Array<{ price: number; date: Date }>;
}

// Reserve product quantity
const reserveUpdate = update<Product>()
  .inc('quantity', -5)
  .inc('reservedQuantity', 5)
  .currentDate('lastModified')
  .build();

// Restock product
const restockUpdate = update<Product>()
  .inc('quantity', 100)
  .currentDate('lastRestocked')
  .push('priceHistory', {
    price: 29.99,
    date: new Date(),
  })
  .build();

// Clear old price history (keep last 10)
const clearHistoryUpdate = update<Product>()
  .push('priceHistory', null, {
    $slice: -10, // Keep only last 10 items
  })
  .build();
```

### Array Operations

```typescript
interface TodoList {
  userId: string;
  items: Array<{
    id: string;
    text: string;
    completed: boolean;
    priority: number;
  }>;
}

// Add new todo item
const addTodoUpdate = update<TodoList>()
  .push('items', {
    id: crypto.randomUUID(),
    text: 'Buy groceries',
    completed: false,
    priority: 1,
  }, {
    $position: 0, // Add to beginning
    $slice: 100,  // Keep max 100 items
  })
  .build();

// Remove completed todos
const removeCompletedUpdate = update<TodoList>()
  .pull('items', { completed: true })
  .build();

// Sort items by priority
const sortTodosUpdate = update<TodoList>()
  .push('items', null, {
    $sort: { priority: -1 },
  })
  .build();
```

---

## Full Application Example

```typescript
import { MongoClient } from "npm:mongodb@6";
import { typed } from "jsr:@your-scope/mongo-builder/integration";
import { Accumulators } from "jsr:@your-scope/mongo-builder";

// Initialize MongoDB
const client = new MongoClient("mongodb://localhost:27017");
await client.connect();
const db = client.db("ecommerce");

// Define schemas
interface Customer {
  _id?: string;
  email: string;
  name: string;
  age: number;
  registeredAt: Date;
  totalSpent: number;
}

interface Order {
  _id?: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

// Create typed collections
const customers = typed<Customer>(db.collection("customers"));
const orders = typed<Order>(db.collection("orders"));

// Find VIP customers (spent > $1000, registered > 1 year ago)
const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

const vipCustomers = await customers.find(qb =>
  qb.where('totalSpent').gte(1000)
    .where('registeredAt').lt(oneYearAgo)
    .sortDesc('totalSpent')
);

console.log(`Found ${vipCustomers.length} VIP customers`);

// Get customer lifetime value report
const lifetimeValue = await orders.aggregate(ab =>
  ab.match({ status: 'completed' })
    .group('customerId', {
      orderCount: Accumulators.count(),
      totalSpent: Accumulators.sum('total'),
      avgOrderValue: Accumulators.avg('total'),
      lastOrderDate: Accumulators.max('createdAt'),
    })
    .lookup('customers', '_id', '_id', 'customer')
    .unwind('customer')
    .project({
      email: '$customer.email',
      name: '$customer.name',
      orderCount: 1,
      totalSpent: 1,
      avgOrderValue: 1,
      lastOrderDate: 1,
    })
    .sort({ totalSpent: -1 })
    .limit(50)
);

console.log('Top customers by lifetime value:', lifetimeValue);

// Update customer total spent when order is completed
const processOrder = async (orderId: string) => {
  const order = await orders.raw.findOne({ _id: orderId });
  
  if (order && order.status === 'completed') {
    await customers.updateOne(
      qb => qb.where('_id').eq(order.customerId),
      ub => ub.inc('totalSpent', order.total)
    );
  }
};

await client.close();
```
