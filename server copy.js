import express from "express";
import bodyParser from "body-parser";
import connectDb from "./app/connection.js";
import cors from "cors";
import path from "path";
import cron from "node-cron";
import Realm from 'realm';

//Routes
import router from "./app/routes/index.js";
import http from 'http';
import { Server } from "socket.io";
import redisClient from './app/utils/redisService.js'
import { calcDistance, computeHeading, interpolatedPoint } from "./app/utils/helpers.js";
import User from "./app/models/user.model.js";


const realmApp = new Realm.App({ id: `${process.env.APP_ID}` || 'sync-psdolzr' });

const app = express();
const server = http.createServer(app);
redisClient.connect()

//logging if any error



const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 5050;
const STATIC_PATH = process.env.STATIC_PATH || process.cwd();

var corsOptions = {
  origin: "*",
  // methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
  credentials: true,
};

connectDb().then(() => {
  console.log("MongoDb connected");
  // initData();
});

app.use(cors(corsOptions));
app.use("/api/v1/static", express.static(path.join(STATIC_PATH, "uploads")));

app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '200mb' }));

// io.on("connection", (socket) => {
//   console.log(`connect ${socket.id}`);

//   socket.on("disconnect", (reason) => {
//     console.log(`disconnect ${socket.id} due to ${reason}`);
//   });
// });

//Serve socket as middleware.
app.use(function (req, res, next) {
  req.io = io;

  // console.log(req.io, "server")
  next();
});

redisClient.set(`sockets`, JSON.stringify({}))



io.on("connection", async (socket, next) => {
  console.log('CONNECTED', socket.id)
  console.log('AUTH TOKEN', socket.handshake.auth)

  if (socket.handshake.auth && socket.handshake.auth.token) {
    let newSockets = await redisClient.get(`sockets`)
    let activeSockets = newSockets ? JSON.parse(newSockets) : {};

    let user = activeSockets[socket.handshake.auth.token] ?? [];
    user.push(socket.id);

    activeSockets[socket.handshake.auth.token] = user;
    console.log('CONNECTED NEW SOCKETS', activeSockets)
    await redisClient.set(`sockets`, JSON.stringify(activeSockets))

  }
  socket.emit('connection', 'CONNECTED!');


  socket.on("disconnect", async () => {
    if (socket.handshake.auth && socket.handshake.auth.token) {
      let newSockets = await redisClient.get(`sockets`)
      let activeSockets = newSockets ? JSON.parse(newSockets) : {};



      let user = activeSockets[socket.handshake.auth.token];
      console.log('DISCONECTING', user)
      if (user) {
        if (user.length > 1) {
          let filtered = user.filter(a => a !== socket.id);
          activeSockets[socket.handshake.auth.token] = filtered;
          await redisClient.set(`sockets`, JSON.stringify(activeSockets))
        } else {
          delete activeSockets[socket.handshake.auth.token]
          await redisClient.set(`sockets`, JSON.stringify(activeSockets))
        }
      }
      console.log(activeSockets)
    }
    console.log("Disconnected: " + socket.id);
  });



  socket.on("liveTrack", async (data) => {
    let activeTracks = await redisClient.get(`tracks`)
    let allTracks = activeTracks ? JSON.parse(activeTracks) : {};
    let newTracks = allTracks[socket.handshake.auth.token];
    let newSockets = await redisClient.get(`sockets`)
    let activeSockets = newSockets ? JSON.parse(newSockets) : {};

    console.log('LIVE TRACKING', data)
    console.log('RIDER ID', socket.handshake.auth.token)
    console.log('TRACKIN', newTracks)

    if (newTracks && Object.keys(newTracks).length !== 0) {
      for (let track of Object.values(newTracks)) {
        console.log(track, 'ACTUAL TRACK')

        //OWNER
        const riderSocket = activeSockets[track.rider] ?? [];
        console.log('RIDER SOCKET', riderSocket)
        if (riderSocket && riderSocket.length !== 0) {
          for (let socketId of riderSocket) {
            socket.to(socketId).emit('liveTrack', data)
          }
        }

        //RIDER
        const shopSocket = activeSockets[track.shop] ?? [];
        console.log('SHOP SOCKET', shopSocket)
        if (shopSocket && shopSocket.length !== 0) {
          for (let socketId of shopSocket) {
            console.log(socketId, 'SHOP SOCKET')
            socket.to(socketId).emit('liveTrack', data)
          }
        }

        //Customer
        const customerSocket = activeSockets[track.owner] ?? [];
        console.log('CUSTOMER SOCKET', customerSocket)
        if (customerSocket && customerSocket.length !== 0) {
          for (let socketId of customerSocket) {
            console.log(socketId, 'CUSTOMER SOCKET')
            socket.to(socketId).emit('liveTrack', data)
          }
        }


      }
    }

  });

  socket.on("velocity", async (val) => {
    let velocity = await redisClient.get(`velocity`)
    if (val === 'add') {
      if (velocity < 25) {
        velocity = Number(velocity) + 1;
      }
    } else {
      if (velocity > 0) {
        velocity = Number(velocity) - 1;
      }
    }
    await redisClient.set(`velocity`, velocity);
  });
})

cron.schedule('*/3 * * * * *', async () => {
  try {
    let oldVelocity = await redisClient.get(`velocity`)
    let velocity = oldVelocity ? oldVelocity : 5
    let activeTracks = await redisClient.get(`tracks`)
    let allTracks = activeTracks ? JSON.parse(activeTracks) : {};
    let newSockets = await redisClient.get(`sockets`)
    let activeSockets = newSockets ? JSON.parse(newSockets) : {};

    // console.log('Sockets ', activeSockets)


    if (allTracks) {
      Object.entries(allTracks).map(([key, value]) => {
        // console.log('KEY VALUE', key, value)
        let newTracks = value;

























































        if (newTracks && Object.keys(newTracks).length !== 0) {
          Object.entries(newTracks).map(([key, value]) => {
            let { track } = value;
            // for (let { track } of Object.values(newTracks)) {

            const getDistance = (val) => {
              // seconds between when the component loaded and now
              // console.log('DEFF TIME', val.initialDate)
              const differentInTime = (new Date() - new Date(val.initialDate)) / 1000; // pass to seconds
              // console.log('DEFF TIME', differentInTime)
              // console.log('DEFF TIME', differentInTime, track.initialDate, new Date() - new Date(track.initialDate))
              return differentInTime * velocity; // d = v*t -- thanks Newton!
            };



            const distance = getDistance(track);

            // console.log(track, 'track old');
            console.log(distance, 'distance old');
            if (!distance) {
              return;
            }

            let progress = track.path.filter(
              (coordinates) => coordinates.distance < distance
            );


            const nextLine = track.path.find(
              (coordinates) => coordinates.distance > distance
            );


            // console.log('PROGRESS', progress, nextLine)
            if (!nextLine) {
              console.log('ITS THE END')
              let newTrack = {
                ...track,
                coordinate: progress[progress.length - 1],
                progress,
              }



              //  //OWNER
              const riderSocket = activeSockets[value.rider] ?? [];
              console.log('RIDER SOCKET', riderSocket)
              if (riderSocket && riderSocket.length !== 0) {
                for (let socketId of riderSocket) {
                  io.to(socketId).emit('liveTrack', newTrack)
                }
              }

              //RIDER
              const shopSocket = activeSockets[value.shop] ?? [];
              // console.log('SHOP SOCKET', shopSocket)
              if (shopSocket && shopSocket.length !== 0) {
                for (let socketId of shopSocket) {
                  console.log(socketId, 'SHOP SOCKET')
                  io.to(socketId).emit('liveTrack', newTrack)
                  if (newTracks[key].status === 'rider_pickup') {
                    newTracks[key].status = 'rider_pickup';
                    io.to(socketId).emit('newNotification', { title: `Rider Arrived!`, message: `Rider is already outside with customer laundry. ` })
                  }
                }
              }

              //Customer
              const customerSocket = activeSockets[value.owner] ?? [];
              // console.log('CUSTOMER SOCKET', customerSocket)
              if (customerSocket && customerSocket.length !== 0) {
                for (let socketId of customerSocket) {
                  // console.log(socketId, 'CUSTOMER SOCKET')
                  io.to(socketId).emit('liveTrack', newTrack)
                  if (newTracks[key].status === 'rider_confirmed') {
                    newTracks[key].status = 'rider_arrived';
                    io.to(socketId).emit('newNotification', { title: `Rider Arrived!`, message: `Rider is already waiting outside. ` })
                  }
                  if (newTracks[key].status === 'rider_delivery') {
                    newTracks[key].status = 'rider_delivery';
                    io.to(socketId).emit('newNotification', { title: `Laundry Delivery!`, message: `Rider is already waiting outside your delivery address. ` })
                  }


                }
              }

              newTracks[key].track = newTrack
              redisClient.set(`order-${newTracks[key].orderId}`, JSON.stringify(newTracks[key]));
              delete newTracks[key]

              return; // it's the end!
            }

            const lastLine = progress[progress.length - 1];

            const lastLineLatLng = lastLine


            const nextLineLatLng = nextLine

            // distance of this line
            const totalDistance = nextLine.distance - lastLine.distance;
            const percentage = (distance - lastLine.distance) / totalDistance;

            const position = interpolatedPoint(
              lastLineLatLng,
              nextLineLatLng,
              percentage
            );



            progress = progress.concat(position);
            let newTrack = {
              ...track,
              coordinate: position,
              progress,
              distanceTravelled:
                track.distanceTravelled + calcDistance(position, track.prevLatLng),
              prevLatLng: position
            }







            let point1, point2;

            if (nextLine) {
              point1 = progress[progress.length - 1];
              point2 = nextLine;
            } else {
              // it's the end, so use the latest 2
              point1 = progress[progress.length - 2];
              point2 = progress[progress.length - 1];
            }

            const point1LatLng = point1;
            const point2LatLng = point2;


            const angle = computeHeading(
              point1LatLng,
              point2LatLng
            );

            const actualAngle = angle - 90;


            newTrack.actualAngle = actualAngle;


            newTracks[key] = {
              ...value,
              track: newTrack
            }


            //  //OWNER
            const riderSocket = activeSockets[value.rider] ?? [];
            // console.log('RIDER SOCKET', riderSocket)
            if (riderSocket && riderSocket.length !== 0) {
              for (let socketId of riderSocket) {
                io.to(socketId).emit('liveTrack', newTrack)
              }
            }

            //RIDER
            const shopSocket = activeSockets[value.shop] ?? [];
            // console.log('SHOP SOCKET', shopSocket)
            if (shopSocket && shopSocket.length !== 0) {
              for (let socketId of shopSocket) {
                console.log(socketId, 'SHOP SOCKET')
                io.to(socketId).emit('liveTrack', newTrack)
              }
            }

            //Customer
            const customerSocket = activeSockets[value.owner] ?? [];
            // console.log('CUSTOMER SOCKET', customerSocket)
            if (customerSocket && customerSocket.length !== 0) {
              for (let socketId of customerSocket) {
                // console.log(socketId, 'CUSTOMER SOCKET')
                io.to(socketId).emit('liveTrack', newTrack)
              }
            }

          })

          allTracks[key] = newTracks;

        } else {
          delete allTracks[key]
        }


      })
      await redisClient.set(`tracks`, JSON.stringify(allTracks));
    }




  } catch (err) {
    console.log(err, 'ERROR CRON')
  }

});

async function registerUser(email, password) {
  try {
      const createNew = await realmApp.emailPasswordAuth.registerUser(email, password);
      console.log(createNew, "NEW")
      return true; // Registration successful
  } catch (error) {
      console.error('Error registering user:', error);
      return false; // Registration failed
  }
}

app.post('/api/auth/realm/register', async (req, res) => {
  const { password, accessLevel, username } = req.body;
    const registrationResult = await registerUser(email, password);
    if (registrationResult) {
        try {
            const userRealm = await User.create({
                password,
                username,
                email: String(username) + "@bugtech.com",
                accessLevel,
            });

            res.status(201).json({
                message: 'User registered successfully',
                data: userRealm,
            });
        } catch (err) {
            console.error('Failed to create local user record:', err);
            res.status(500).json({ message: 'Realm user created, but local DB failed' });
        }
    } else {
        res.status(400).json({ message: 'User registration failed' });
    }
})

//Routers
app.use("/api/v1", router);

server.listen(process.env.PORT || PORT, function () {
  console.log(`Listening on ${PORT}`);
});
