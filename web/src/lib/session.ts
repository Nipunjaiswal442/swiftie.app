// Cross-component flags that must not live in React state.
export const sessionFlags = {
  /** Set while "Delete my account" runs so the route guard does not recreate the user row. */
  deletingAccount: false,
}
