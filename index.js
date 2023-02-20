const express = require("express");
const cors = require("cors");
require("dotenv").config();

const UserProductBidding = require('./app/models/UserProductBidding');
const AppResponse = require("./app/services/AppResponse");

const PORT = process.env.PORT;

const app = express();
app.use(express.json());
app.use(cors());

// Import db
require("./app/configs/mongoDB");

// root
const rootRoute = require("./app/routes/index");

const rootRoute1 = express.Router();

// Port status
const server = app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

// initialise the socket connection
const io = require('socket.io').listen(server);
io.on('connection', function(socket){
  console.log('a user connected')
  socket.on('disconnect', function() {
      console.log('user disconnected')
  })
});

// apply routes
app.use("/api/v1/", rootRoute);
app.use("/api/v2/", rootRoute1)

rootRoute1.get("/userProductBidding", async (req, res) => {
  const { productId } = req.query;
  const userProductBiddings = await UserProductBidding.find({productId}).sort({biddingAmount: -1});
  return AppResponse.success(res, {userProductBiddings})
});

rootRoute1.post('/userProductBidding', async (req, res) => {
  const payload = req.body.userProductBidding;
  const { userName, productId, biddingAmount } = payload;
  if(!userName || !productId || !biddingAmount) {
    return AppResponse.badRequest(
      res,
      'MISSING_REQUIRED_FIELDS',
      'MISSING_REQUIRED_FIELDS' 
    )
  }
  await UserProductBidding.findOneAndUpdate(
            {
                userName: payload.userName,
                productId: payload.productId
            }, 
            {
                $set: payload
            },
            {
                upsert: true
            }
        );
  const userProductBiddings = await UserProductBidding.find({productId: payload.productId}).sort({biddingAmount: -1});
  io.emit(payload.productId, userProductBiddings);

    io.on(payload.productId, data => {
      console.log(data)
    })
  
  return AppResponse.success(res, {userProductBiddings}) 
})
