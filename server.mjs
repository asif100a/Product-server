import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongodb from 'mongodb';
import jwt from 'jsonwebtoken';

// Express application instance
const app = express();
// dotenv configuration declaration
dotenv.config();
// Extract the MongoClient and ServerApiVersion from the mongodb
const { MongoClient, ServerApiVersion } = mongodb;
// Port configuration
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://supreme-car-sore.web.app'
  ],
  credentials: true
}));

// Connection with Mongodb database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bu1vbif.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// jwt middleware
const verifyToken = (req, res, next) => {
  const { user } = req.body;
  // console.log('User from token varification', user);
  next();
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // Database Collections
    const productCollection = client.db('carProductDB').collection('cars');

    // ------------[Authentication API]------------
    // jwt api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.TOKEN_KEY, { expiresIn: '2h' });
      // console.log(token);

      // Set token to the Cookie
      res.cookie('Token', token, cookieOptions).send({ success: true });
    })

    // Clear the cookie if user is null
    app.post('/signOut', async (req, res) => {
      const { clearToken } = req.body;
      if (clearToken === true) {
        res.clearCookie('Token', { ...cookieOptions, maxAge: 0 }).send({ success: true });
      }
    })


    // -------------[Products API]-------------
    app.get('/products', async (req, res) => {
      // console.log(req.query);
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      // Get data by search
      const search = req.query.search;
      // console.log(search);

      // Filter data by brand name
      const brand = req.query.brandFilter;

      // Filter data by category name
      const category = req.query.categoryFilter;

      // Filte data by price range
      const price = req.query.priceFilter;
      const breakDownPrice = price.split('-');
      const firstPrice = breakDownPrice[0];
      const secondPrice = breakDownPrice[1] || null;
      // console.log('Price:', price)
      console.log(firstPrice);
      console.log(secondPrice);

      let query = {};
      // If there is a search value
      if (search) {
        query['Product Name'] = { $regex: search, $options: 'i' };
      }
      // If there is a brand value
      if (brand) {
        query['Product Name'] = { $regex: brand, $options: 'i' };
      }
      // If there is category value
      if (category) {
        query['Category'] = { $regex: category, $options: 'i' };
      }
      // If there is a price value
      if (price) {
        query['Price'] = { $gte: firstPrice, ...(secondPrice !== null ? { $lte: secondPrice } : { $lte: '200000' }) }
      }

      // Sort data by price
      const priceSort = req.query.priceSort;
      console.log('price sort:', priceSort);
      // Sort data by time and date
      const timeAndDate = req.query.timeSort
      // console.log(timeAndDate);

      let sort = {};
      if (priceSort === 'low') {
        sort = { Price: 1 }
      }
      if (priceSort === 'high') {
        sort = { Price: -1 }
      }
      if (timeAndDate === 'new') {
        sort = { 'Product Creation Date and Time': 1 }
      }
      if (timeAndDate === 'old') {
        sort = { 'Product Creation Date and Time': -1 }
      }
      const result = await productCollection.find(query)
        .skip(page * size)
        .limit(size)
        .sort(sort)
        .toArray();

      res.status(200).send(result);
    })

    app.get('/count', async (req, res) => {
      const count = await productCollection.estimatedDocumentCount();
      res.status(200).send({ count });
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


// Route definition
app.get('/', (req, res) => {
  res.json({
    status: 200,
    message: `Server is running----------`
  });
});

// Server listener
app.listen(port, () => {
  console.log(`The server is running on port: ${port}`);
});