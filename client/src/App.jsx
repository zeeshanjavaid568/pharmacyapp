// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './redux/features/protectroutes/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider } from './redux/features/protectroutes/AuthProvider';
import Layout from './layout/Layout';
import './App.css'
import BuyerRecord from './pages/BuyerRecord';
import UpdateBuyerRecord from './pages/UpdateBuyerRecord';
import SalerRecord from './pages/SalerRecord';
import DailyProfitRecord from './pages/DailyProfitRecord';
import DailyProfitRecordDetails from './pages/DailyProfitRecordDetails';
import MonthlyProfitRecord from './pages/MonthlyProfitRecord';
import MonthProfitRecordDetails from './pages/MonthProfitRecordDetails';
import DailyBuyerProductTotalPriceRecord from './pages/DailyBuyerProductTotalPriceRecord';
import DuesRecord from './pages/DuesRecord';
import UpdateDuesRecord from './pages/UpdateDuesRecord';
import TakenDuesRecord from './pages/TakenDuesRecord';
import SalerDailyTotalPriceRecord from './pages/DailySalerProductTotalPriceRecord';
import UpdateSalerProduct from './pages/UpdateSalerProduct';


function App() {
    return (
        <>
            <AuthProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Private Routes */}
                    <Route path='/' element={<Layout />}>
                        <Route
                            path="/"
                            element={
                                <PrivateRoute>
                                    <Home />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/buyer-record"
                            element={
                                <PrivateRoute>
                                    <BuyerRecord />
                                </PrivateRoute>
                            }
                        />

                        <Route path='/updatebuyerproduct/:id' element={<PrivateRoute>
                            <UpdateBuyerRecord />
                        </PrivateRoute>} />

                        <Route
                            path="/buyer-daily-total-price-record"
                            element={
                                <PrivateRoute>
                                    <DailyBuyerProductTotalPriceRecord />
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/saler-record"
                            element={
                                <PrivateRoute>
                                    <SalerRecord />
                                </PrivateRoute>
                            }
                        />

                        <Route path='/updatesalerproduct/:id' element={<PrivateRoute>
                            <UpdateSalerProduct />
                        </PrivateRoute>} />

                        <Route path="/saler-daily-total-price-record"
                            element={
                                <PrivateRoute>
                                    <SalerDailyTotalPriceRecord />
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/duesrecord"
                            element={
                                <PrivateRoute>
                                    <DuesRecord />
                                </PrivateRoute>
                            }
                        />

                        <Route path='/updatedues/:id' element={<PrivateRoute>
                            <UpdateDuesRecord />
                        </PrivateRoute>} />

                        <Route
                            path="/Takendues"
                            element={
                                <PrivateRoute>
                                    <TakenDuesRecord />
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/daily-profit"
                            element={
                                <PrivateRoute>
                                    <DailyProfitRecord />
                                </PrivateRoute>
                            }
                        />
                        <Route path='/daily-profit-record-detail/:id' element={<PrivateRoute>
                            <DailyProfitRecordDetails />
                        </PrivateRoute>} />
                        <Route
                            path="/Monthly-profit"
                            element={
                                <PrivateRoute>
                                    <MonthlyProfitRecord />
                                </PrivateRoute>
                            }
                        />
                        <Route path='/monthly-profit-record-detail/:id' element={<PrivateRoute>
                            <MonthProfitRecordDetails />
                        </PrivateRoute>} />
                    </Route>
                    {/* Default Route */}
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </AuthProvider>
        </>
    );
}

export default App;
