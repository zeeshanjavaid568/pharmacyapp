const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const buyerRoutes = require('./routes/BuyerRoutes'); // Renamed to BuyerRoutes
const salerRoutes = require('./routes/SalerRoutes');
const dailyProfitRoutes = require('./routes/DailyProfitRoutes');
const monthlyProfitRoutes = require('./routes/MonthlyProfitRoutes');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes'); // Assuming separate routes for authentication
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

// Static Files
app.use('/uploads', express.static(path.join(__dirname, './uploadFiles')));

// Routes
app.use('/auth', authRoutes);
app.use('/buyer', buyerRoutes);
app.use('/saler', salerRoutes);
app.use('/daily-profit', dailyProfitRoutes);
app.use('/monthly-profit', monthlyProfitRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
