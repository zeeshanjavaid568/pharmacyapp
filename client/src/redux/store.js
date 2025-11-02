import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { AuthApi } from "./features/auth/authApi";
import { BuyerProdcutApi } from "./features/BuyerProductApi/buyerProductApi";
import authSlice from "./features/auth/authSlice";
import { SalerProdcutApi } from "./features/SalerProductApi/salerProductApi";
import { DailyProfitApi } from "./features/DailyProfitApi/dailyProfitApi";
import { MonthlyProfitApi } from "./features/MonthlyProfitApi/monthlyProfitApi";
import { DuesApi } from "./features/DuesApi/giveDuesApi";
import { TakenDuesApi } from "./features/DuesApi/takenDuesApi";

 
export const store = configureStore({
  reducer: {
    storeAuth: authSlice,
    [AuthApi.reducerPath]: AuthApi.reducer,
    [BuyerProdcutApi.reducerPath]: BuyerProdcutApi.reducer,
    [SalerProdcutApi.reducerPath]: SalerProdcutApi.reducer,
    [DuesApi.reducerPath]: DuesApi.reducer,
    [TakenDuesApi.reducerPath]: TakenDuesApi.reducer,
    [DailyProfitApi.reducerPath]: DailyProfitApi.reducer,
    [MonthlyProfitApi.reducerPath]: MonthlyProfitApi.reducer,

  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(AuthApi.middleware)
      .concat(BuyerProdcutApi.middleware)
      .concat(SalerProdcutApi.middleware)
      .concat(DuesApi.middleware)
      .concat(TakenDuesApi.middleware)
      .concat(DailyProfitApi.middleware)
      .concat(MonthlyProfitApi.middleware)

});

setupListeners(store.dispatch);
