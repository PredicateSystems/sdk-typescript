/**
 * Element query builders for assertion DSL.
 *
 * This module provides the E() query builder and dominant-group list operations
 * for creating element queries that compile to existing Predicates.
 *
 * Key classes:
 * - ElementQuery: Pure data object for filtering elements (E())
 * - ListQuery: Query over dominant-group elements (inDominantList())
 * - MultiQuery: Represents multiple elements from ListQuery.top(n)
 *
 * All queries work with existing Snapshot fields only:
 *     id, role, text, bbox, doc_y, group_key, group_index,
 *     dominant_group_key, in_viewport, is_occluded, href
 */

import { Element, Snapshot } from '../types';

/**
 * Options for creating an ElementQuery via E().
 */
export interface EOptions {
  /** ARIA role to match (e.g., "button", "textbox", "link") */
  role?: string;
  /** Text to match exactly (alias for text, best-effort) */
  name?: string;
  /** Exact text match */
  text?: string;
  /** Substring match against text (case-insensitive) */
  textContains?: string;
  /** Substring match against href (case-insensitive) */
  hrefContains?: string;
  /** Filter by viewport visibility */
  inViewport?: boolean;
  /** Filter by occlusion state */
  occluded?: boolean;
  /** Exact match against group_key */
  group?: string;
  /** True = must be in dominant group */
  inDominantGroup?: boolean;
}

/**
 * Pure query object for filtering elements.
 *
 * This is the data representation of an E() call. It does not execute
 * anything - it just stores the filter criteria.
 *
 * @example
 * E({ role: "button", textContains: "Save" })
 * E({ role: "link", hrefContains: "/cart" })
 * E({ inViewport: true, occluded: false })
 */
export class ElementQuery {
  role?: string;
  name?: string;
  text?: string;
  textContains?: string;
  hrefContains?: string;
  inViewport?: boolean;
  occluded?: boolean;
  group?: string;
  inDominantGroup?: boolean;

  // Internal: for ordinal selection from ListQuery
  _groupIndex?: number;
  _fromDominantList: boolean = false;

  constructor(options: EOptions = {}) {
    this.role = options.role;
    this.name = options.name;
    this.text = options.text;
    this.textContains = options.textContains;
    this.hrefContains = options.hrefContains;
    this.inViewport = options.inViewport;
    this.occluded = options.occluded;
    this.group = options.group;
    this.inDominantGroup = options.inDominantGroup;
  }

  /**
   * Check if element matches this query criteria.
   *
   * @param element - Element to check
   * @param snapshot - Snapshot (needed for dominant_group_key comparison)
   * @returns True if element matches all criteria
   */
  matches(element: Element, snapshot?: Snapshot | null): boolean {
    // Role filter
    if (this.role !== undefined) {
      if (element.role !== this.role) {
        return false;
      }
    }

    // Text exact match (name is alias for text)
    const textToMatch = this.text ?? this.name;
    if (textToMatch !== undefined) {
      const elementText = element.text || '';
      if (elementText !== textToMatch) {
        return false;
      }
    }

    // Text contains (substring, case-insensitive)
    if (this.textContains !== undefined) {
      const elementText = element.text || '';
      if (!elementText.toLowerCase().includes(this.textContains.toLowerCase())) {
        return false;
      }
    }

    // Href contains (substring)
    if (this.hrefContains !== undefined) {
      const elementHref = element.href || '';
      if (!elementHref.toLowerCase().includes(this.hrefContains.toLowerCase())) {
        return false;
      }
    }

    // In viewport filter
    if (this.inViewport !== undefined) {
      if (element.in_viewport !== this.inViewport) {
        return false;
      }
    }

    // Occluded filter
    if (this.occluded !== undefined) {
      if (element.is_occluded !== this.occluded) {
        return false;
      }
    }

    // Group key exact match
    if (this.group !== undefined) {
      if (element.group_key !== this.group) {
        return false;
      }
    }

    // In dominant group check
    if (this.inDominantGroup !== undefined) {
      if (this.inDominantGroup) {
        // Element must be in dominant group
        if (!snapshot) {
          return false;
        }
        if (element.group_key !== snapshot.dominant_group_key) {
          return false;
        }
      } else {
        // Element must NOT be in dominant group
        if (snapshot && element.group_key === snapshot.dominant_group_key) {
          return false;
        }
      }
    }

    // Group index filter (from ListQuery.nth())
    if (this._groupIndex !== undefined) {
      if (element.group_index !== this._groupIndex) {
        return false;
      }
    }

    // Dominant list filter (from inDominantList())
    if (this._fromDominantList) {
      if (!snapshot) {
        return false;
      }
      if (element.group_key !== snapshot.dominant_group_key) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find all elements matching this query in the snapshot.
   *
   * @param snapshot - Snapshot to search
   * @returns Array of matching elements, sorted by doc_y (top to bottom)
   */
  findAll(snapshot: Snapshot): Element[] {
    const matches = snapshot.elements.filter(el => this.matches(el, snapshot));
    // Sort by doc_y for consistent ordering (top to bottom)
    matches.sort((a, b) => (a.doc_y ?? a.bbox.y) - (b.doc_y ?? b.bbox.y));
    return matches;
  }

  /**
   * Find first matching element.
   *
   * @param snapshot - Snapshot to search
   * @returns First matching element or null
   */
  findFirst(snapshot: Snapshot): Element | null {
    const matches = this.findAll(snapshot);
    return matches.length > 0 ? matches[0] : null;
  }
}

/**
 * Interface for the E function with static convenience methods.
 */
interface EFunction {
  (options?: EOptions): ElementQuery;
  /** Query for submit-like buttons */
  submit: () => ElementQuery;
  /** Query for search input boxes */
  searchBox: () => ElementQuery;
  /** Query for links with optional text filter */
  link: (options?: { textContains?: string }) => ElementQuery;
}

/**
 * Create an element query.
 *
 * This is the main entry point for building element queries.
 * It returns a pure data object that can be used with expect().
 *
 * @param options - Query filter options
 * @returns ElementQuery object
 *
 * @example
 * E({ role: "button", textContains: "Save" })
 * E({ role: "link", hrefContains: "/checkout" })
 * E({ inViewport: true, occluded: false })
 */
export const E: EFunction = Object.assign(
  function (options: EOptions = {}): ElementQuery {
    return new ElementQuery(options);
  },
  {
    /**
     * Query for submit-like buttons.
     * Matches buttons with text like "Submit", "Save", "Continue", etc.
     */
    submit: function (): ElementQuery {
      return new ElementQuery({ role: 'button', textContains: 'submit' });
    },

    /**
     * Query for search input boxes.
     * Matches textbox/combobox with search-related names.
     */
    searchBox: function (): ElementQuery {
      return new ElementQuery({ role: 'textbox', name: 'search' });
    },

    /**
     * Query for links with optional text filter.
     *
     * @param options - Optional text filter
     */
    link: function (options?: { textContains?: string }): ElementQuery {
      return new ElementQuery({ role: 'link', textContains: options?.textContains });
    },
  }
);

/**
 * Internal predicate for MultiQuery text checks.
 * Used by expect() to evaluate multi-element text assertions.
 */
export interface MultiTextPredicate {
  multiQuery: MultiQuery;
  text: string;
  checkType: 'any_contains';
}

/**
 * Represents multiple elements from a dominant list query.
 *
 * Created by ListQuery.top(n) to represent the first n elements
 * in a dominant group.
 *
 * @example
 * inDominantList().top(5) // First 5 items in dominant group
 */
export class MultiQuery {
  limit: number;
  _parentListQuery?: ListQuery;

  constructor(limit: number, parentListQuery?: ListQuery) {
    this.limit = limit;
    this._parentListQuery = parentListQuery;
  }

  /**
   * Create a predicate that checks if any element's text contains the substring.
   *
   * @param text - Substring to search for
   * @returns Predicate that can be used with expect()
   */
  anyTextContains(text: string): MultiTextPredicate {
    return {
      multiQuery: this,
      text,
      checkType: 'any_contains',
    };
  }
}

/**
 * Query over elements in the dominant group.
 *
 * Provides ordinal access to dominant-group elements via .nth(k)
 * and range access via .top(n).
 *
 * Created by inDominantList().
 *
 * @example
 * inDominantList().nth(0)   // First item in dominant group
 * inDominantList().top(5)   // First 5 items
 */
export class ListQuery {
  /**
   * Select element at specific index in the dominant group.
   *
   * @param index - 0-based index in the dominant group
   * @returns ElementQuery targeting the element at that position
   *
   * @example
   * inDominantList().nth(0)  // First item
   * inDominantList().nth(2)  // Third item
   */
  nth(index: number): ElementQuery {
    const query = new ElementQuery();
    query._groupIndex = index;
    query._fromDominantList = true;
    return query;
  }

  /**
   * Select the first n elements in the dominant group.
   *
   * @param n - Number of elements to select
   * @returns MultiQuery representing the first n elements
   *
   * @example
   * inDominantList().top(5) // First 5 items
   */
  top(n: number): MultiQuery {
    return new MultiQuery(n, this);
  }
}

/**
 * Create a query over elements in the dominant group.
 *
 * The dominant group is the most common group_key in the snapshot,
 * typically representing the main content list (search results,
 * news feed items, product listings, etc.).
 *
 * @returns ListQuery for chaining .nth(k) or .top(n)
 *
 * @example
 * inDominantList().nth(0)     // First item in dominant group
 * inDominantList().top(5)     // First 5 items
 *
 * // With expect():
 * expect(inDominantList().nth(0)).toHaveTextContains("Show HN")
 */
export function inDominantList(): ListQuery {
  return new ListQuery();
}
