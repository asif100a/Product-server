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
app.use(cors());

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
  const {user} = req.body;
  console.log('User from token varification', user);
  next();
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    
    // jwt api
    app.post('/jwt', async(req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.TOKEN_KEY, {expiresIn: '2h'});
      console.log(token);
    })   

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
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