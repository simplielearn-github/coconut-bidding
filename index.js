const express = require("express");
const cors = require("cors");
require("dotenv").config();

const UserProductBidding = require('./app/models/UserProductBidding');
const ProductModel = require('./app/models/Products');
const AppResponse = require("./app/services/AppResponse");

const multer = require('multer');
const inMemoryStorage = multer.memoryStorage();
const singleFileUpload = multer({ storage: inMemoryStorage });
const aubio = require('aubiojs');

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

rootRoute1.post("/extract-music", singleFileUpload.single('file'), async (req, res) => {
  try {
    const { Pitch } = await aubio();
    const audioData = new Float32Array(req.file.buffer);

    console.log(req.file.buffer);
    
    const ragas = {
      Hindolam: [
        { name: 'S', lower: 195, upper: 495 },
        { name: 'G2', lower: 275, upper: 575 },
        { name: 'M1', lower: 325, upper: 625 },
        { name: 'D1', lower: 430, upper: 730 },
        { name: 'N2', lower: 500, upper: 800 },
        { name: 'S1', lower: 590, upper: 890 }
      ],
      Anandabhairavi: [
        { name: 'S', lower: 195, upper: 495 },
        { name: 'G2', lower: 275, upper: 575 },
        { name: 'R2', lower: 245, upper: 545 },
        { name: 'M1', lower: 325, upper: 625 },
        { name: 'P', lower: 390, upper: 690 },
        { name: 'D2', lower: 455, upper: 755 },
        { name: 'S1', lower: 590, upper: 890 }
      ],
      // kalyani: [
      //   { name: 'S', lower: 195, upper: 495}, // 208 Hz
      //   { name: 'R2', lower: 245, upper: 575},   // 234 Hz
      //   { name: 'G3', lower: 150, upper: 350 },   // 260 Hz
      //   { name: 'M2', lower: 200, upper: 400},   // -->   296 Hz
      //   { name: 'P', lower: 390, upper: 690},     // -->   312 Hz
      //   { name: 'D2', lower: 455, upper: 755},    // -->   347 Hz
      //   { name: 'N3', lower: 300, upper: 500},   //-->   390 Hz
      //   { name: 'S1', lower: 590, upper: 890}    //  -->   416 Hz ] 
      // ],
      // Abhogi: [
      //   { name: 'S', lower: 195, upper: 495}, // 208 Hz
      //   { name: 'R2', lower: 245, upper: 575},   // 234 Hz
      //   { name: 'G2', lower: 275, upper: 575 },   // 250 Hz
      //   { name: 'M1', lower: 325, upper: 625},   // -->   278 Hz
      //   { name: 'D2', lower: 455, upper: 755},    // -->   347 Hz
      //   { name: 'S1', lower: 590, upper: 890}    //  -->   416 Hz 
      // ]
    };


  const pitchDetector = new Pitch('default', 2048, 1024, 44100);

  const pitches = [];
  let noteNames = []
  let ragaNames = []
  for (let i = 0; i < audioData.length; i += 1024) {
    if(audioData.slice(i, i + 1024) !== "undefined" && audioData[i + 1024]){
      const pitch = pitchDetector.do(audioData.slice(i, i + 1024));
      const {noteName, closestRaga} = getPitchNameAndRaga(pitch)
      noteNames.push(noteName)
      ragaNames.push(closestRaga)
      pitches.push({
        pitchFrequency: pitch,
        noteName: closestRaga
      });
    }
  }

  noteNames = noteNames.filter(function (value) {
    return !Number.isNaN(value);
  });

  noteNames = noteNames.filter((value, index, self) => self.indexOf(value) === index);

  ragaNames = ragaNames.filter(function (value) {
    return !Number.isNaN(value);
  });

  ragaNames = ragaNames.filter((value, index, self) => self.indexOf(value) === index);

    const scores = {};
    Object.keys(ragas).forEach((ragaName) => {
      const notes = ragas[ragaName];
      let score = 0;
      notes.forEach((note) => {
        console.log(note);
        const matches = pitches.filter((pitch) => 
          pitch.pitchFrequency >= note.lower && pitch.pitchFrequency <= note.upper && pitch.noteName === note.name
        );
        console.log(matches);
        score += matches.length;
        console.log({score, note, ragaName})
      });
      scores[ragaName] = score;
    })

    console.log(scores, 'scores');

    // Determine the raga with highest score
    let maxScore = 0;
    let ragaName = 'Unkonwn';
    Object.keys(scores).forEach((name) => {
      if(scores[name] > maxScore) {
        maxScore = scores[name];
        ragaName = name;
      }
    });
    console.log(ragaName, 'ragaName +++++++++++++++++++++++');

  return AppResponse.success(res, {ragaName}) 

  // console.log('Raga:', raga);
  } catch (error) {
    console.log(error);
  }
  
})

function getPitchNameAndRaga(pitch) {

  const ragaMap = {
    'S': 261.626,  // Sa
    'r1': 293.665,  // Re (komal)
    'R1': 293.665,  // Re (shuddha)
    'g1': 329.628,  // Ga (komal)
    'G1': 329.628,  // Ga (shuddha)
    'm1': 349.228,  // Ma (komal)
    'M1': 349.228,  // Ma (shuddha)
    'P': 391.995,  // Pa
    'd1': 440.000,  // Dha (komal)
    'D1': 440.000,  // Dha (shuddha)
    'n1': 493.883,  // Ni (komal)
    'N1': 493.883,  // Ni (shuddha)
    'S1': 523.251   // Sa (shuddha)
  }

  const noteNumber = 12 * (Math.log2(pitch / 440) + 4);
  const noteNames = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
  const octave = Math.floor(noteNumber / 12) - 1;
  const noteIndex = noteNumber % 12;
  const noteName = noteNames[Math.floor(noteIndex)] + octave;

  let closestRaga = null;
  let closestDistance = Infinity;
  for (const [ragaName, ragaFrequency] of Object.entries(ragaMap)) {
   const distance = Math.abs(pitch - ragaFrequency);
   if (distance < closestDistance) {
      closestRaga = ragaName.toUpperCase();
      closestDistance = distance;
    }
  }

  return {
    noteName,
    closestRaga
  }
}


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

  const productInfo = await ProductModel.findById(productId);
  if(!productInfo) {
    return AppResponse.notFound(
      res,
      'ERR_PRODUCT_DOES_NOT_EXIST',
      'ERR_PRODUCT_DOES_NOT_EXIST'
    )
  }

  // get the highest bidding.
  const productBidding = await UserProductBidding.find({productId}).sort({biddingAmount: -1})
  if(productInfo.basePrice >= payload.biddingAmount) {
    return AppResponse.badRequest(
      res,
      'ERR_BIDDING_AMOUNT_SHOULD_BE_GREATER_THAN_BASE_PRICE',
      'ERR_BIDDING_AMOUNT_SHOULD_BE_GREATER_THAN_BASE_PRICE'
    )
  }

  if(productBidding.length && productBidding[0].biddingAmount >= biddingAmount) {
    return AppResponse.badRequest(
      res,
      'ERR_BIDDING_AMOUNT_SHOULD_BE_GREATER_THAN_LAST_BIDING_AMOUNT',
      'ERR_BIDDING_AMOUNT_SHOULD_BE_GREATER_THAN_LAST_BIDING_AMOUNT'
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


