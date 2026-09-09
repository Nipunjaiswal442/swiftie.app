/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminDigest from "../adminDigest.js";
import type * as assessments from "../assessments.js";
import type * as comments from "../comments.js";
import type * as communities from "../communities.js";
import type * as communityMessages from "../communityMessages.js";
import type * as communityPosts from "../communityPosts.js";
import type * as crons from "../crons.js";
import type * as feedback from "../feedback.js";
import type * as helpers from "../helpers.js";
import type * as maya from "../maya.js";
import type * as messages from "../messages.js";
import type * as nvidia from "../nvidia.js";
import type * as posts from "../posts.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminDigest: typeof adminDigest;
  assessments: typeof assessments;
  comments: typeof comments;
  communities: typeof communities;
  communityMessages: typeof communityMessages;
  communityPosts: typeof communityPosts;
  crons: typeof crons;
  feedback: typeof feedback;
  helpers: typeof helpers;
  maya: typeof maya;
  messages: typeof messages;
  nvidia: typeof nvidia;
  posts: typeof posts;
  users: typeof users;
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
