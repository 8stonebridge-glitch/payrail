/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as approvals from "../approvals.js";
import type * as finance from "../finance.js";
import type * as governance from "../governance.js";
import type * as lib_archive from "../lib/archive.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_policyEngine from "../lib/policyEngine.js";
import type * as lib_stateMachine from "../lib/stateMachine.js";
import type * as lib_workflow from "../lib/workflow.js";
import type * as queries from "../queries.js";
import type * as requests from "../requests.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  approvals: typeof approvals;
  finance: typeof finance;
  governance: typeof governance;
  "lib/archive": typeof lib_archive;
  "lib/audit": typeof lib_audit;
  "lib/permissions": typeof lib_permissions;
  "lib/policyEngine": typeof lib_policyEngine;
  "lib/stateMachine": typeof lib_stateMachine;
  "lib/workflow": typeof lib_workflow;
  queries: typeof queries;
  requests: typeof requests;
  seed: typeof seed;
  settings: typeof settings;
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
