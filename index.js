const request = require('request');
const moment = require('moment');

let _ = require('lodash');

let config = require('./Config');

var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
var log_stdout = process.stdout;

console.log = function(d) { //
    log_file.write(util.format(d) + '\n');
    log_stdout.write(util.format(d) + '\n');
};

let aCookies;
let loginAH = fnSuccess => {
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
        .on('response', function (res) {
            aCookies = res.headers["set-cookie"];
            fnSuccess();
        })
};

let getBookings = (sDate, resolve, fnSuccess, fnError) => {
    request({
        url: `${config.api_url}/bookings?day=${sDate}&familyId=&box=${config.iBoxID}&_=${moment().valueOf()}`,
        jar: true,
        method: "GET",
        headers: {
            "Cookie": aCookies.join("; ")
        }
    })
        .on('response', function (res) {
            console.log(`${sDate} get booking STATUS: ${res.statusCode}`);
            res.setEncoding('utf8');

            let body = '';
            res.on('data', function (chunk) {
                body += chunk;
            });

            res.on('end', function () {
                let oData = JSON.parse(body);
                if (oData.bookings && oData.bookings.length) fnSuccess(oData.bookings);
                else if (oData.bookings && !oData.bookings.length) {
                    fnError("No classes available");
                    resolve();
                }
            });
        })
};

let bookClass = (sClassID, sBookDay, fnSuccess) => {
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
    }).on('response', fnSuccess)
};

console.log(moment().format("DD/MM/YYYY - HH:mm:ss"));
loginAH(res => {
    let aPromises = [Promise.resolve];
    for (let i = 0; i <= config.iCountDaysToBook; i++) {
        let oBookDay = moment().add(i, "days");
        let iForwardDay = oBookDay.day();
        let sBookDay = oBookDay.format("YYYYMMDD");
        aPromises.push(new Promise(resolve => {
            ((oBookDay, iForwardDay, sBookDay) => {
                getBookings(sBookDay, resolve, aAvailableClasses => {
                    let oTimeToBook = _.find(config.aDaysToBook, element => element.Day === iForwardDay);
                    if (!oTimeToBook) {
                        resolve();
                        return;
                    }
                    let oClass = _.find(aAvailableClasses, element => element.time === oTimeToBook.Time && element.className === oTimeToBook.ClassName);
                    if (!oClass) {
                        resolve();
                        return;
                    }
                    if (!oClass.bookState) {
                        bookClass(oClass.id, sBookDay, () => {
                            let lastLog = `Dia ${oBookDay.format("DD-MM-YYYY")} reservado durante ${oTimeToBook.Time}.`;
                            console.log(lastLog);
                            resolve({
                                consoleLog: lastLog,
                                sBookDay: sBookDay,
                                oClass: oClass,
                                oTimeToBook: oTimeToBook,
                                aAvailableClasses: aAvailableClasses
                            });
                        });
                    } else resolve();
                }, console.error)
            })(oBookDay, iForwardDay, sBookDay)
        }));
    }
    Promise.all(aPromises).then(aResValues => {
        console.log(JSON.stringify(aResValues, null, 4));
        console.log("\n------------------------------------------\n");
    })
});

