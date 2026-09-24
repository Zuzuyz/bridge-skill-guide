/**
 * Client-safe authentication error types.
 *
 * This module intentionally has NO server-only imports so that both
 * the server (registerUser) and the client (auth page) can share the
 * same error identity and payload shapes without pulling Prisma or
 * session code into the client bundle.
 */

/** A real College row offered for selection when a name is ambiguous. */
export type CollegeOption = {
  id: string;
  name: string;
};

/**
 * Thrown when a faculty registrant's declared institution matches
 * MORE THAN ONE College row (College.name is intentionally not
 * unique, so duplicate names are possible in legacy/test data).
 * The registration UI must let the registrant pick the exact
 * College instead of the server silently linking an arbitrary row.
 */
export class AmbiguousCollegeError extends Error {
  readonly collegeOptions: CollegeOption[];

  constructor(collegeOptions: CollegeOption[]) {
    super(
      "Multiple college records share this institution name. Select the correct college to continue.",
    );
    this.name = "AmbiguousCollegeError";
    this.collegeOptions = collegeOptions;
  }
}
