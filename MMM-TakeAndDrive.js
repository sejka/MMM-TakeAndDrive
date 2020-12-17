/* global Module */

/* Magic Mirror
 * Module: MMM-TakeAndDrive
 *
 * By Karol Sejka
 * MIT Licensed.
 */

Module.register("MMM-TakeAndDrive", {
	defaults: {
		updateInterval: 600,
		lat: 0,
		lon: 0,
		city: "poznan",
		providers: ["traficar", "easyshare"],
		animationSpeed: 1000
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function () {
		var self = this;
		this.closestVehicles = [];

		//Flag for check if module is loaded
		this.loaded = false;

		this.sendSocketNotification('TAD_GET_VEHICLES', { lat: this.config.lat, lon: this.config.lon, city: this.config.city, providers: this.config.providers });
		setInterval(() => {
			this.sendSocketNotification('TAD_GET_VEHICLES', { lat: this.config.lat, lon: this.config.lon, city: this.config.city, providers: this.config.providers });
		}, this.config.updateInterval * 1000);
	},

	getDom: function () {
		var self = this;
		var wrapper = document.createElement("div");
		if (!this.loaded) {
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.setAttribute("class", "small dimmed");
			return wrapper;
		}

		wrapper = document.createElement("table");
		wrapper.setAttribute("class", "small table");
		this.closestVehicles.map(x => {
			var row = document.createElement("tr");

			var providerName = document.createElement("td");
			providerName.innerText = x.providerName;
			providerName.setAttribute("class", "provider-name");
			row.appendChild(providerName);

			var vehicleDistance = document.createElement("td");
			vehicleDistance.innerText = Math.round(x.distance * 10) / 10 + "km";
			row.appendChild(vehicleDistance);

			var direction = document.createElement("td");
			direction.setAttribute("class", "direction-arrow");
			var directionArrow = document.createElement("img");
			directionArrow.setAttribute("src", "/MMM-TakeAndDrive/arrow.svg");
			directionArrow.setAttribute("style", `filter: invert(50%); height: 0.7em; width: 0.7em; transform: rotate(${Math.round(x.angle)}deg)`)
			direction.appendChild(directionArrow);
			row.appendChild(direction);

			wrapper.appendChild(row);
		})
		return wrapper;
	},

	getStyles: function () {
		return ['MMM-TakeAndDrive.css'];
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === "TAD_CLOSEST_VEHICLES") {
			// set dataNotification
			this.closestVehicles = payload;
			this.loaded = true;
			this.updateDom(this.config.animationSpeed);
		}
	},
});