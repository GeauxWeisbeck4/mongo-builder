/**
 * Integration helpers for MongoDB drivers
 * Works iwth npm:mongodb and jsr:@db/mongo
 */
import { QueryBuilder } from "./mod.ts";
import { AggregationBuilder } from "./aggregation.ts";
import { UpdateBuilder } from "./update.ts";

/**
 * Generic MongoDB collection interface
 * compatible with both official MongoDB driver and Deno MongoDB
 */
export interface MongoCollection<T> {
  find(filter: any, options?: any): any;
}
