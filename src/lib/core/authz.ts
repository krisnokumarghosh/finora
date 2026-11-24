type SessionUser = {
  id: string;
  name?: string | null;
  role?: string | null;
};

/**
 * Bank Staff and Admin are allowed to review transactions across all customers.
 */
export const isStaffOrAdmin = (user: SessionUser) =>
  user.role === "bank-staff" || user.role === "admin";
