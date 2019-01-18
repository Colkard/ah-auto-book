const request = require('request');
const moment = require('moment');
var _ = require('lodash');

var Password = require('./Password');
var aCookies;
var loginAH = (sMail, sPW, fnSuccess) => {
  request({
    url: `https://aimharder.com/login`,
    jar: true,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    form: {
      "mail": sMail,
      "pw": sPW,
      "login": "Iniciar sesión"
    }
  })
  .on('response', function(res) {
    aCookies = res.headers["set-cookie"];
    fnSuccess();
  })
};

var getBookings = (sDate, fnSuccess) => {
  request({
    url: `https://crossfitboxcastelldefels.aimharder.com/api/bookings?day=${sDate}&familyId=&box=9283&_=${moment().valueOf()}`,
    jar: true,
    method: "GET",
    headers: {
      "Cookie": aCookies.join("; ")
    }
  })
  .on('response', function(res) {
    console.log('get booking STATUS: ' + res.statusCode);
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      var oData = JSON.parse(chunk);
      console.log(oData);
      fnSuccess(oData.bookings);
    });
  })
}

var bookClass = (sClassID, sBookDay, fnSuccess) => {
  request({
    url: `https://crossfitboxcastelldefels.aimharder.com/api/book`,
    jar: true,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": aCookies.join("; ")
    },
    form: {
      "id": sClassID,
      "day": sBookDay,
      "insist": "0",
      "familyId": ""
    }
  })
  .on('response', fnSuccess)
}

var aDaysToBook = [
  {
    1: "21:00 - 22:00"
  },
  {
    2: "21:00 - 22:00"
  },
  {
    3: "20:30 - 21:30"
  },
  {
    4: "20:30 - 21:30"
  },
  {
    5: "18:30 - 19:30"
  },
]

loginAH("colkard96@gmail.com", Constants.password, function(res) {
  //TODO logic book days
  var sBookDay = moment().add("days", 1).format("YYYYMMDD");
  var date = moment();
  var dow = date.day();
  console.log(dow);
  getBookings(sBookDay, aAvailableClasses => {
      var oClass = _.find(aAvailableClasses, element => element.time === "12:00 - 13:30");
      if (!oClass) return;
      if (!oClass.bookState) bookClass(oClass.id, sBookDay, () => console.log("Dia reservado"));
      //bookClass(oClass.id, sBookDay, () => console.log("Dia reservado"));
  })
})
