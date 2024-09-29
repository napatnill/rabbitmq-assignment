const PROTO_PATH="../restaurant.proto";

const grpc = require("@grpc/grpc-js"); // Updated import
const protoLoader = require("@grpc/proto-loader");

var packageDefinition = protoLoader.loadSync(PROTO_PATH,{
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});

const restaurantProto = grpc.loadPackageDefinition(packageDefinition);

const client = new restaurantProto.RestaurantService(
  "localhost:30043",
  grpc.credentials.createInsecure()
);

module.exports = client;