import { createSlice } from "@reduxjs/toolkit";

const storedUserData =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("userData"))
    : null;

const userToken =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("token"))
    : null;

const initialState = {
  userData: storedUserData,
  apiToken: userToken,
};

const authSlice = createSlice({
  name: "storeAuth",
  initialState,
  reducers: {
    setUserDataFromApi: (state, action) => {
      state.userData = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("userData", JSON.stringify(action.payload));
      }
    },
    setToken: (state, action) => {
      state.apiToken = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", JSON.stringify(action.payload));
      }
    },
    logout: (state) => {
      state.userData = null;
      state.apiToken = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("userData");
        localStorage.removeItem("token");
      }
    },
  },
});

export const { setUserDataFromApi, setToken, logout } = authSlice.actions;
export default authSlice.reducer;
