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
import SalerRecord from './pages/SalerRecord';
import YearSalerRecordDetails from './pages/YearSalerRecordDetails';
import YearBuyerRecordDetails from './pages/YearBuyerRecordDetails';
import DailyProfitRecord from './pages/DailyProfitRecord';
import DailyProfitRecordDetails from './pages/DailyProfitRecordDetails';
import MonthlyProfitRecord from './pages/MonthlyProfitRecord';
import MonthProfitRecordDetails from './pages/MonthProfitRecordDetails';
import DailyYearBuyerProductTotalPriceRecordDetails from './pages/DailyYearBuyerProductTotalPriceRecordDetails';
import DailyBuyerProductTotalPriceRecord from './pages/DailyBuyerProductTotalPriceRecord';

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
                        <Route path='/year-buyer-record-detail/:id' element={<PrivateRoute>
                            <YearBuyerRecordDetails />
                        </PrivateRoute>} />

                        <Route
                            path="/buyer-daily-total-price-record"
                            element={
                                <PrivateRoute>
                                    <DailyBuyerProductTotalPriceRecord />
                                </PrivateRoute>
                            }
                        />
                        <Route path='/year-buyer-daily-total-price-record-detail/:id' element={<PrivateRoute>
                            <DailyYearBuyerProductTotalPriceRecordDetails />
                        </PrivateRoute>} />

                        <Route
                            path="/saler-record"
                            element={
                                <PrivateRoute>
                                    <SalerRecord />
                                </PrivateRoute>
                            }
                        />
                        <Route path='/year-saler-record-detail/:id' element={<PrivateRoute>
                            <YearSalerRecordDetails />
                        </PrivateRoute>} />
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
