/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as chunks from "../chunks.js";
import type * as concepts from "../concepts.js";
import type * as consts from "../consts.js";
import type * as evaluate from "../evaluate.js";
import type * as helpers from "../helpers.js";
import type * as ingest from "../ingest.js";
import type * as openrouter from "../openrouter.js";
import type * as pages from "../pages.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  chunks: typeof chunks;
  concepts: typeof concepts;
  consts: typeof consts;
  evaluate: typeof evaluate;
  helpers: typeof helpers;
  ingest: typeof ingest;
  openrouter: typeof openrouter;
  pages: typeof pages;
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
