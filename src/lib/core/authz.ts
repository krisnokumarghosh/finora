type SessionUser = {
  id: string;
  name?: string | null;
  role?: string | null;
};

export const isStaffOrAdmin = (user: SessionUser) =>
  user.role === "bank-staff" || user.role === "admin";
