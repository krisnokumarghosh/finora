import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type AccountState = { selectedAccountId: string | null };
const initialState: AccountState = { selectedAccountId: null };

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    setSelectedAccount(state, action: PayloadAction<string | null>) {
      state.selectedAccountId = action.payload;
    },
  },
});

export const { setSelectedAccount } = accountSlice.actions;
export default accountSlice.reducer;