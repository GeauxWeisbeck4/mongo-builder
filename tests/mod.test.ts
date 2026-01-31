import { assertEquals } from "jsr:@std/assert";
import { QueryBuilder, query } from "./mod.ts";

interface User {
  name: string;
  age: number;
  email: string;
  active: boolean;
}

Deno.test("QueryBuilder - basic equality", () => {
  const result = query<User>()
    .where('name').eq('John')
    .build();

  assertEquals(result.filter, { name: 'John' });
});

Deno.test("QueryBuilder - comparison operators", () => {
  const result = query<User>()
    .where('age').gte(18)
    .where('age').lt(65)
    .build();

  assertEquals(result.filter, {
    age: { $gte: 18, $lt: 65 }
  });
});

Deno.test("QueryBuilder - in operator", () => {
  const result = query<User>()
    .where('name').in(['John', 'Jane', 'Bob'])
    .build();

  assertEquals(result.filter, {
    name: { $in: ['John', 'Jane', 'Bob'] }
  });
});

Deno.test("QueryBuilder - exists", () => {
  const result = query<User>()
    .where('email').exists(true)
    .build();

  assertEquals(result.filter, {
    email: { $exists: true }
  });
});

Deno.test("QueryBuilder - regex", () => {
  const result = query<User>()
    .where('email').regex(/gmail\.com$/)
    .build();

  assertEquals(result.filter, {
    email: { $regex: /gmail\.com$/ }
  });
});

Deno.test("QueryBuilder - select fields", () => {
  const result = query<User>()
    .select('name', 'email')
    .build();

  assertEquals(result.projection, {
    name: 1,
    email: 1
  });
});

Deno.test("QueryBuilder - exclude fields", () => {
  const result = query<User>()
    .exclude('email')
    .build();

  assertEquals(result.projection, {
    email: 0
  });
});

Deno.test("QueryBuilder - sorting", () => {
  const result = query<User>()
    .sortAsc('name')
    .sortDesc('age')
    .build();

  assertEquals(result.sort, {
    name: 1,
    age: -1
  });
});

Deno.test("QueryBuilder - limit and skip", () => {
  const result = query<User>()
    .limit(10)
    .skip(20)
    .build();

  assertEquals(result.limit, 10);
  assertEquals(result.skip, 20);
});

Deno.test("QueryBuilder - complex query", () => {
  const result = query<User>()
    .where('age').gte(18)
    .where('active').eq(true)
    .where('email').regex(/gmail\.com$/)
    .select('name', 'email')
    .sortDesc('age')
    .limit(5)
    .build();

  assertEquals(result.filter, {
    age: { $gte: 18 },
    active: true,
    email: { $regex: /gmail\.com$/ }
  });
  assertEquals(result.projection, { name: 1, email: 1 });
  assertEquals(result.sort, { age: -1 });
  assertEquals(result.limit, 5);
});

Deno.test("QueryBuilder - OR operator", () => {
  const query1 = query<User>().where('age').gte(18);
  const query2 = query<User>().where('name').eq('Admin');

  const result = query<User>()
    .or(query1, query2)
    .build();

  assertEquals(result.filter, {
    $or: [
      { age: { $gte: 18 } },
      { name: 'Admin' }
    ]
  });
});

Deno.test("QueryBuilder - AND operator", () => {
  const query1 = query<User>().where('age').gte(18);
  const query2 = query<User>().where('active').eq(true);

  const result = query<User>()
    .and(query1, query2)
    .build();

  assertEquals(result.filter, {
    $and: [
      { age: { $gte: 18 } },
      { active: true }
    ]
  });
});

Deno.test("QueryBuilder - raw filter", () => {
  const result = query<User>()
    .raw({ name: { $regex: /^John/ } })
    .where('age').gte(18)
    .build();

  assertEquals(result.filter, {
    name: { $regex: /^John/ },
    age: { $gte: 18 }
  });
});

Deno.test("QueryBuilder - multiple conditions on same field", () => {
  const result = query<User>()
    .where('age').gte(18)
    .where('age').lte(65)
    .build();

  assertEquals(result.filter, {
    age: { $gte: 18, $lte: 65 }
  });
});

Deno.test("QueryBuilder - not equal", () => {
  const result = query<User>()
    .where('name').ne('Admin')
    .build();

  assertEquals(result.filter, {
    name: { $ne: 'Admin' }
  });
});

Deno.test("QueryBuilder - nin operator", () => {
  const result = query<User>()
    .where('name').nin(['Admin', 'Moderator'])
    .build();

  assertEquals(result.filter, {
    name: { $nin: ['Admin', 'Moderator'] }
  });
});