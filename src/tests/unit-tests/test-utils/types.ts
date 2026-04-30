/**
 * Core type that checks if two types are perfectly structurally identical.
 */
export type IsExact<T, U> = (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2 ? true : false;

/**
 * Detailed Assertion utility.
 * If types match, it returns `true`.
 * If they fail, it returns an object detailing exactly what is out of sync.
 */
export type AssertExact<Actual, Expected> =
  IsExact<Actual, Expected> extends true
    ? true
    : {
        error: "🚨 TYPES DO NOT MATCH";
        missingExports: Exclude<keyof Expected, keyof Actual>;
        extraExports: Exclude<keyof Actual, keyof Expected>;
        mismatchedTypeExports: {
          // Loops through shared keys and returns the key name if the types don't match
          [K in keyof Actual & keyof Expected]: IsExact<Actual[K], Expected[K]> extends true ? never : K;
        }[keyof Actual & keyof Expected];
      };
