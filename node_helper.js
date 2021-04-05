const NodeHelper = require('node_helper');
const request = require('request');

module.exports = NodeHelper.create({

    start: function () { },

    socketNotificationReceived: async function (notification, payload) {

        if (notification == 'TAD_GET_VEHICLES') {
            if ((payload.providers.length > 0) && ('city' in payload)) {
                let apiEndpoint = `https://takeanddrive.eu/api/v2/vehicles?city=${payload.city}&locale=pl&user_lat=${payload.lat}&user_lon=${payload.lon}`;
                let response = await this.getAllVehicles(apiEndpoint);
                let vehicles = response;

                var closestVehicles = vehicles
                    .filter(x => payload.providers.includes(x.id) && x.vehicles.length > 0)
                    .map(provider => provider.vehicles.map(vehicle => {
                        vehicle.distance = this.getDistanceFromLatLonInKm(
                            payload.lat,
                            payload.lon,
                            vehicle.latitude,
                            vehicle.longitude);
                        vehicle.angle = this.angle(
                            payload.lat,
                            payload.lon,
                            vehicle.latitude, vehicle.longitude);
                        vehicle.providerName = provider.name;
                        return vehicle;
                    }))
                    .map(x => x.sort((a, b) => a.distance - b.distance))
                    .map(x => x[0])
                    .sort((a, b) => a.distance - b.distance);
                this.sendSocketNotification('TAD_CLOSEST_VEHICLES', closestVehicles);
            }
            else {
                console.log(`${this.name}: the config file must contain myPosition and cityId!`);
            }
        }
    },

    getAllVehicles: (url) => {
        return new Promise((resolve, reject) => {
            request({ url: url, method: 'GET' }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    try {
                        resolve(JSON.parse(body));
                    }
                    catch (e) {
                        console.log(e);
                        reject(e);
                    }
                }
            });
        });
    },

    getDistanceFromLatLonInKm: function (lat1, lon1, lat2, lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = this.deg2rad(lat2 - lat1); // deg2rad below
        var dLon = this.deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    },

    deg2rad: function (deg) {
        return deg * (Math.PI / 180)
    },

    angle: function (lat1, lng1, lat2, lng2) {
        var dLon = this.toRad(lng2 - lng1);
        lat1 = this.toRad(lat1);
        lat2 = this.toRad(lat2);
        var y = Math.sin(dLon) * Math.cos(lat2);
        var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        var rad = Math.atan2(y, x);
        var brng = this.toDeg(rad);
        return (brng + 360) % 360;
    },

    toRad: function (deg) {
        return deg * Math.PI / 180;
    },

    toDeg: function (rad) {
        return rad * 180 / Math.PI;
    }
});
