/**
 * Assertion DSL for Sentience SDK.
 *
 * This module provides a Playwright/Cypress-like assertion API for verifying
 * browser state in agent verification loops.
 *
 * Main exports:
 * - E: Element query builder (filters elements by role, text, href, etc.)
 * - expect: Expectation builder (creates predicates from queries)
 * - inDominantList: Query over dominant group elements (ordinal access)
 *
 * @example
 * ```typescript
 * import { E, expect, inDominantList } from '@anthropic/sentience-ts/asserts';
 *
 * // Basic presence assertions
 * await runtime.assert(
 *   expect(E({ role: "button", textContains: "Save" })).toExist(),
 *   "save_button_visible"
 * );
 *
 * // Visibility assertions
 * await runtime.assert(
 *   expect(E({ textContains: "Checkout" })).toBeVisible(),
 *   "checkout_visible"
 * );
 *
 * // Global text assertions
 * await runtime.assert(
 *   expect.textPresent("Welcome back"),
 *   "user_logged_in"
 * );
 * await runtime.assert(
 *   expect.noText("Error"),
 *   "no_error_message"
 * );
 *
 * // Ordinal assertions on dominant group
 * await runtime.assert(
 *   expect(inDominantList().nth(0)).toHaveTextContains("Show HN"),
 *   "first_item_is_show_hn"
 * );
 *
 * // Task completion
 * await runtime.assertDone(
 *   expect.textPresent("Order confirmed"),
 *   "checkout_complete"
 * );
 * ```
 *
 * The DSL compiles to existing Predicate functions, so it works seamlessly
 * with AgentRuntime.assert() and assertDone().
 */

// Query builders
export { E, ElementQuery, ListQuery, MultiQuery, inDominantList } from './query';
export type { EOptions, MultiTextPredicate } from './query';

// Expectation builders
export { expect, ExpectBuilder, EventuallyWrapper, withEventually } from './expect';
export type { EventuallyConfig } from './expect';
