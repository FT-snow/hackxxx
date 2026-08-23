/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ask from "../ask.js";
import type * as auth from "../auth.js";
import type * as chunks from "../chunks.js";
import type * as concepts from "../concepts.js";
import type * as evaluate from "../evaluate.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as ingest from "../ingest.js";
import type * as notes from "../notes.js";
import type * as openrouter from "../openrouter.js";
import type * as pages from "../pages.js";
import type * as seed from "../seed.js";
import type * as stats from "../stats.js";
import type * as subjects from "../subjects.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ask: typeof ask;
  auth: typeof auth;
  chunks: typeof chunks;
  concepts: typeof concepts;
  evaluate: typeof evaluate;
  helpers: typeof helpers;
  http: typeof http;
  ingest: typeof ingest;
  notes: typeof notes;
  openrouter: typeof openrouter;
  pages: typeof pages;
  seed: typeof seed;
  stats: typeof stats;
  subjects: typeof subjects;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
