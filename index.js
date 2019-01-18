const request = require('request');
const moment = require('moment');
var _ = require('lodash');

var Password = require('./Password').password;
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

var getBookings = (sDate, fnSuccess, fnError) => {
  request({
    url: `https://crossfitboxcastelldefels.aimharder.com/api/bookings?day=${sDate}&familyId=&box=9283&_=${moment().valueOf()}`,
    jar: true,
    method: "GET",
    headers: {
      "Cookie": aCookies.join("; ")
    }
  })
  .on('response', function(res) {
    console.log(`${sDate} get booking STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');

    var body = '';
    res.on('data', function (chunk) {
      body += chunk;
    });

    res.on('end', function () {
      var oData = JSON.parse(body);
      if (oData.bookings && oData.bookings.length) fnSuccess(oData.bookings);
      else if (oData.bookings && !oData.bookings.length) fnError("No classes available");
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
    Day: 1,
    Time: "21:00 - 22:00"
  },
  {
    Day: 2,
    Time: "21:00 - 22:00"
  },
  {
    Day: 3,
    Time: "20:30 - 21:30"
  },
  {
    Day: 4,
    Time: "20:30 - 21:30"
  },
  {
    Day: 5,
    Time: "18:30 - 19:30"
  },
]

var iCountDaysToBook = 3;

loginAH("colkard96@gmail.com", Password, function(res) {
  for (var i = 0; i <= iCountDaysToBook; i++) {
    var oBookDay = moment().add(i, "days");
    var iForwardDay = oBookDay.day();
    var sBookDay = oBookDay.format("YYYYMMDD");
    ((oBookDay, iForwardDay, sBookDay) => {
      getBookings(sBookDay, aAvailableClasses => {
          var oTimeToBook = _.find(aDaysToBook, element => element.Day === iForwardDay);
          if (!oTimeToBook) return;
          var oClass = _.find(aAvailableClasses, element => element.time === oTimeToBook.Time);
          if (!oClass) return;
          if (!oClass.bookState) bookClass(oClass.id, sBookDay, () => console.log(`Dia ${oBookDay.format("DD-MM-YYYY")} reservado durante ${oTimeToBook.Time}.`));
      }, console.error)
    })(oBookDay, iForwardDay, sBookDay)
  }
})
