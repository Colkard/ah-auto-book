const request = require('request');
const moment = require('moment');
var _ = require('lodash');
  request({
    url: `https://crossfitboxcastelldefels.aimharder.com/api/bookings?day=20190118&familyId=&box=9283&_=${moment().valueOf()}`,
    jar: true,
    method: "GET",
    headers: {
      "Cookie": `_ga=GA1.2.985420368.1529072355; __stripe_mid=28396597-08e3-451e-8ada-0d0ad287ac56; __stripe_mid=28396597-08e3-451e-8ada-0d0ad287ac56; _gid=GA1.2.1752464807.1547842153; _fbp=fb.1.1547842153300.930074486; PHPSESSID=f0i18flt96qkolc3kbhl5dp7p1; crisp-client%2Fsession%2Fdf0c7671-9c6c-407e-8f6e-2b319d29f188=session_37ca8427-3292-4d97-81e1-9446533923a9; amhrdrauth=23688%7C1555621390%7Cee33eef06c1aa2b4358c7cff6bf6f51b; __stripe_sid=12e3b1b3-99bc-46d8-b59d-9eeb9c1ebcb8; AWSELB=F571F9EF16E8876E7FD628E559CADE048064DC36AF575857E35B35B2B490265A43D739FA80EE5DF68ADEAE623FDF1E44D288342E4CA03269AB87CB85842277624208CCEF00; _gat=1`
    }
  })
  .on('response', function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      var oData = JSON.parse(chunk);
      var oClass = _.find(oData.bookings, element => element.time === "18:30 - 19:30");
      console.log(oClass);
    });
  })
