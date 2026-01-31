/**
 * @module
 * A type-safe MongoDB query builder for Deno
 *
 * @example
 * ```ts
 * import { QueryBuilder } from "@geauxweisbeck4/mongo-builder";
 *
 * interface User {
 *   name: string;
 *   age: number;
 *   email: string;
 * }
 *
 * const query = QueryBuilder<User>()
 *   .where('age').gte(18)
 *   .where('name').eq('John')
 *   .build();
 * ```
 */

/**
 * Type-safe query builder for MongoDB
 * @class QueryBuilder
 *
 */
export class QueryBuilder<T extends Record<string, any>> {
  private filter: Record<string, any> = {};
  private projectionObj: Record<string, 0 | 1> = {};
  private sortObj: Record<string, 1 | -1> = {};
  private limitNum?: number;
  private skipNum?: number;

  /**
   * Start building a where clause for a field
   */
  where<K extends keyof T>(field: K): WhereClause<T, K> {
    return new WhereClause(this, field as string);
  }

  /**
   * Add a raw filter object (for complex queries)
   */
  raw(filter: Partial<Record<keyof T, any>>): this {
    Object.assign(this.filter, filter);
    return this;
  }

  /**
   * Set projection (select specific fields)
   */
  select<K extends keyof T>(...fields: K[]): this {
    this.projectionObj = {};
    for (const field of fields) {
      this.projectionObj[field as string] = 1;
    }
    return this;
  }

  /**
   * Exclude specific fields from results
   */
  exclude<K extends keyof T>(...fields: K[]): this {
    for (const field of fields) {
      this.projectionObj[field as string] = 0;
    }
    return this;
  }

  /**
   * Sort by field in ascending order
   */
  sortAsc<K extends keyof T>(field: K): this {
    this.sortObj[field as string] = 1;
    return this;
  }
  /**
   * Sort by field in descending order
   */
  sortDesc<K extends keyof T>(field: K): this {
    this.sortObj[field as string] = -1;
    return this;
  }

  /**
   * Limit number of results
   */
  limit(num: number): this {
    this.limitNum = num;
    return this;
  }

  /**
   * Skip number of results
   */
  skip(num: number): this {
    this.skipNum = num;
    return this;
  }

  /**
   * Build and return the query object
   */
  build(): QueryResult {
    return {
      filter: this.filter,
      projection:
        Object.keys(this.projectionObj).length > 0
          ? this.projectionObj
          : undefined,
      sort: Object.keys(this.sortObj).length > 0 ? this.sortObj : undefined,
      limit: this.limitNum,
      skip: this.skipNum,
    };
  }

  /**
   * Internal method to add filter
   */
  _addFilter(field: string, operator: string, value: any): this {
    if (operator === "$eq") {
      this.filter[field] = value;
    } else {
      if (!this.filter[field]) {
        this.filter[field] = {};
      }
      this.filter[field][operator] = value;
    }
    return this;
  }

  /**
   * Logical OR operator
   */
  or(...queries: QueryBuilder<T>[]): this {
    const conditions = queries.map((q) => q.build().filter);
    if (this.filter.$or) {
      this.filter.$or.push(...conditions);
    } else {
      this.filter.$or = conditions;
    }
    return this;
  }

  /**
   * Logical AND operator (default behavior , but explicit)
   */
  and(...queries: QueryBuilder<T>[]): this {
    const conditions = queries.map((q) => q.build().filter);
    if (this.filter.$and) {
      this.filter.$and.push(...conditions);
    } else {
      this.filter.$and = conditions;
    }
    return this;
  }
}

/**
 * Where clause builder for type-safe field operations
 * @constructor
 */
export class WhereClause<T extends Record<string, any>, K extends keyof T> {
  constructor(
    private builder: QueryBuilder<T>,
    private field: string,
  ) {}

  /** Equal to */
  eq(value: T[K]): QueryBuilder<T> {
    return this.builder._addFilter(this.field, "$eq", value);
  }

  /** Not equal to */
  ne(value: T[K]): QueryBuilder<T> {
    return this.builder._addFilter(this.field, "$ne", value);
  }

  /** Greater than */
  gt(value: T[K]): QueryBuilder<T> {
    return this.builder._addFilter(this.field, "$gt", value);
  }

  /** Greater than or equal to */
  gte(value: T[K]): QueryBuilder<T> {
    return this.builder._addFilter(this.field, "$gte", value);
  }

  /** Less than */
  lt(value: T[K]): QueryBuilder<T> {
    return this.builder._addFilter(this.field, "$lt", value);
  }

  /** Less than or equal to */
  lte(value: T[K]): QueryBuilder<T> {
    return this.builder._addFilter(this.field, "$lte", value);
  }

  /** In array */
  in(value: T[K]): QueryBuilder<T> {
    return this.builder._addFilter(this.field, "$in", value);
  }

  /** Not in array */
  nin(values: T[K][]): QueryBuilder<T> {
    return this.builder._addFilter(this.field, "$nin", values);
  }

  /** Exists */
  exists(value: boolean = true): QueryBuilder<T> {
    return this.builder._addFilter(this.field, "$exists", value);
  }

  /** Regex match (for string fields) */
  regex(pattern: string | RegExp, options?: string): QueryBuilder<T> {
    if (typeof pattern === "string") {
      return this.builder._addFilter(
        this.field,
        "regex",
        options ? { $regex: pattern, $options: options } : pattern,
      );
    }
    return this.builder._addFilter(this.field, "$regex", pattern);
  }
}

/**
 * Result of building a query
 */
export interface QueryResult {
  filter: Record<string, any>;
  projection?: Record<string, 0 | 1>;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
}

/**
 * Helper to create a new query builder
 */
export function query<T extends Record<string, any>>(): QueryBuilder<T> {
  return new QueryBuilder<T>();
}

// Re-export aggregation and update builders
export { aggregate, AggregationBuilder, Accumulators } from "./aggregation.ts";
export { update, UpdateBuilder } from "./update.ts";
export type { PushModifiers } from "./update.ts";
