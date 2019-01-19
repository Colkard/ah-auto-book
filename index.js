const express = require('express');
const app = express();
const request = require('request');
const moment = require('moment');
var CronJob = require('cron').CronJob;
var _ = require('lodash');

var config = require('./Config');

var aCookies;
var loginAH = fnSuccess => {
  request({
    url: config.login_url,
    jar: true,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    form: {
      "mail": process.env.email,
      "pw": process.env.pass,
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
    url: `${config.api_url}/bookings?day=${sDate}&familyId=&box=${config.iBoxID}&_=${moment().valueOf()}`,
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
    url: `${config.api_url}/book`,
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

app.listen(process.env.PORT, function(){
  const job = new CronJob(config.sCrontab, function() {
    console.log(moment().format("HH:mm:ss"))
    loginAH((res) => {
      for (var i = 0; i <= config.iCountDaysToBook; i++) {
        var oBookDay = moment().add(i, "days");
        var iForwardDay = oBookDay.day();
        var sBookDay = oBookDay.format("YYYYMMDD");
        ((oBookDay, iForwardDay, sBookDay) => {
          getBookings(sBookDay, aAvailableClasses => {
              var oTimeToBook = _.find(config.aDaysToBook, element => element.Day === iForwardDay);
              if (!oTimeToBook) return;
              var oClass = _.find(aAvailableClasses, element => element.time === oTimeToBook.Time);
              if (!oClass) return;
              if (!oClass.bookState) bookClass(oClass.id, sBookDay, () => console.log(`Dia ${oBookDay.format("DD-MM-YYYY")} reservado durante ${oTimeToBook.Time}.`));
          }, console.error)
        })(oBookDay, iForwardDay, sBookDay)
      }
    })
  });

  job.start();
});
