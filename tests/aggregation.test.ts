import { assertEquals } from "jsr:@std/assert";
import { aggregate, Accumulators } from "../src/aggregation.ts";

interface User {
  name: string;
  age: number;
  country: string;
  score: number;
}

Deno.test("AggregationBuilder - match stage", () => {
  const pipeline = aggregate<User>()
    .match({ age: { $gte: 18 } })
    .build();

  assertEquals(pipeline, [{ $match: { age: { $gte: 18 } } }]);
});

Deno.test("AggregationBuilder - group stage", () => {
  const pipeline = aggregate<User>()
    .group({ country: { count: { $sum: 1 }, avgAge: { $avg: "$age" } } })
    .build();

  assertEquals(pipeline, [
    {
      $group: {
        _id: "$country",
        count: { $sum: 1 },
        avgAge: { $avg: "$age" },
      },
    },
  ]);
});

Deno.test("AggregationBuilder - sort and limit", () => {
  const pipeline = aggregate<User>().sort({ score: -1 }).limit(10).build();

  assertEquals(pipeline, [{ $sort: { score: -1 } }, { $limit: 10 }]);
});

Deno.test("AggregationBuilder - unwind", () => {
  const pipeline = aggregate<User>()
    .unwind("tags", { preserveNullAndEmptyArrays: true })
    .build();

  assertEquals(pipeline, [
    {
      $unwind: {
        path: "$tags",
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);
});

Deno.test("AggregationBuilder - lookup", () => {
  const pipeline = aggregate<User>()
    .lookup("orders", "userId", "_id", "userOrders")
    .build();

  assertEquals(pipeline, [
    {
      $lookup: {
        from: "orders",
        localField: "userId",
        foreignField: "_id",
        as: "userOrders",
      },
    },
  ]);
});

Deno.test("AggregationBuilder - addFields", () => {
  const pipeline = aggregate<User>()
    .addFields({ fullName: { $concat: ["$firstName", " ", "$lastName"] } })
    .build();

  assertEquals(pipeline, [
    {
      $addFields: {
        fullName: { $concat: ["$firstName", " ", "$lastName"] },
      },
    },
  ]);
});

Deno.test("AggregationBuilder - count", () => {
  const pipeline = aggregate<User>().count("total").build();

  assertEquals(pipeline, [{ $count: "total" }]);
});

Deno.test("AggregationBuilder - bucket", () => {
  const pipeline = aggregate<User>()
    .bucket("age", [0, 18, 30, 50, 100], {
      output: { count: { $sum: 1 } },
    })
    .build();

  assertEquals(pipeline, [
    {
      $bucket: {
        groupBy: "$age",
        boundaries: [0, 18, 30, 50, 100],
        output: { count: { $sum: 1 } },
      },
    },
  ]);
});

Deno.test("AggregationBuilder - sample", () => {
  const pipeline = aggregate<User>().sample(5).build();

  assertEquals(pipeline, [{ $sample: { size: 5 } }]);
});

Deno.test("AggregationBuilder - complex pipeline", () => {
  const pipeline = aggregate<User>()
    .match({ age: { $gte: 18 } })
    .group("country", {
      count: { $sum: 1 },
      avgScore: { $avg: "$score" },
    })
    .sort({ count: -1 })
    .limit(5)
    .build();

  assertEquals(pipeline, [
    { $match: { age: { $gte: 18 } } },
    {
      $group: {
        _id: "$country",
        count: { $sum: 1 },
        avgScore: { $avg: "$score" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);
});

Deno.test("Accumulators helper functions", () => {
  assertEquals(Accumulators.sum("value"), { $sum: "$value" });
  assertEquals(Accumulators.sum(1), { $sum: 1 });
  assertEquals(Accumulators.avg("score"), { $avg: "$score" });
  assertEquals(Accumulators.min("price"), { $min: "$price" });
  assertEquals(Accumulators.max("price"), { $max: "$price" });
  assertEquals(Accumulators.count(), { $sum: 1 });
  assertEquals(Accumulators.push("item"), { $push: "$item" });
  assertEquals(Accumulators.addToSet("tag"), { $addToSet: "$tag" });
});
