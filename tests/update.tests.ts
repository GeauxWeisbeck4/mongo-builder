// update.test.ts
import { update } from "./update.ts";

interface Product {
  name: string;
  price: number;
  quantity: number;
  tags: string[];
  views: number;
}

Deno.test("UpdateBuilder - set operator", () => {
  const result = update<Product>().set("price", 29.99).build();

  assertEquals(result, { $set: { price: 29.99 } });
});

Deno.test("UpdateBuilder - setMany", () => {
  const result = update<Product>()
    .setMany({ price: 29.99, quantity: 100 })
    .build();

  assertEquals(result, {
    $set: { price: 29.99, quantity: 100 },
  });
});

Deno.test("UpdateBuilder - unset operator", () => {
  const result = update<Product>().unset("tags", "views").build();

  assertEquals(result, {
    $unset: { tags: "", views: "" },
  });
});

Deno.test("UpdateBuilder - inc operator", () => {
  const result = update<Product>().inc("quantity", 5).inc("views", 1).build();

  assertEquals(result, {
    $inc: { quantity: 5, views: 1 },
  });
});

Deno.test("UpdateBuilder - mul operator", () => {
  const result = update<Product>().mul("price", 0.9).build();

  assertEquals(result, {
    $mul: { price: 0.9 },
  });
});

Deno.test("UpdateBuilder - min and max operators", () => {
  const result = update<Product>()
    .min("price", 10)
    .max("quantity", 1000)
    .build();

  assertEquals(result, {
    $min: { price: 10 },
    $max: { quantity: 1000 },
  });
});

Deno.test("UpdateBuilder - push operator", () => {
  const result = update<Product>().push("tags", "featured").build();

  assertEquals(result, {
    $push: { tags: "featured" },
  });
});

Deno.test("UpdateBuilder - push with modifiers", () => {
  const result = update<Product>()
    .push("tags", "new-tag", { $position: 0, $slice: 10 })
    .build();

  assertEquals(result, {
    $push: {
      tags: {
        $each: ["new-tag"],
        $position: 0,
        $slice: 10,
      },
    },
  });
});

Deno.test("UpdateBuilder - pull operator", () => {
  const result = update<Product>().pull("tags", "deprecated").build();

  assertEquals(result, {
    $pull: { tags: "deprecated" },
  });
});

Deno.test("UpdateBuilder - addToSet operator", () => {
  const result = update<Product>().addToSet("tags", "unique").build();

  assertEquals(result, {
    $addToSet: { tags: "unique" },
  });
});

Deno.test("UpdateBuilder - pop operator", () => {
  const result = update<Product>().pop("tags", -1).build();

  assertEquals(result, {
    $pop: { tags: -1 },
  });
});

Deno.test("UpdateBuilder - rename operator", () => {
  const result = update<Product>().rename("name", "title").build();

  assertEquals(result, {
    $rename: { name: "title" },
  });
});

Deno.test("UpdateBuilder - currentDate operator", () => {
  const result = update<Product>().currentDate("updatedAt").build();

  assertEquals(result, {
    $currentDate: { updatedAt: true },
  });
});

Deno.test("UpdateBuilder - currentDate with timestamp", () => {
  const result = update<Product>()
    .currentDate("updatedAt", "timestamp")
    .build();

  assertEquals(result, {
    $currentDate: { updatedAt: { $type: "timestamp" } },
  });
});

Deno.test("UpdateBuilder - complex update", () => {
  const result = update<Product>()
    .set("price", 24.99)
    .inc("quantity", -1)
    .inc("views", 1)
    .push("tags", "sale")
    .currentDate("updatedAt")
    .build();

  assertEquals(result, {
    $set: { price: 24.99 },
    $inc: { quantity: -1, views: 1 },
    $push: { tags: "sale" },
    $currentDate: { updatedAt: true },
  });
});

Deno.test("UpdateBuilder - raw operator", () => {
  const result = update<Product>()
    .raw("$bit", { flags: { and: 5 } })
    .build();

  assertEquals(result, {
    $bit: { flags: { and: 5 } },
  });
});
