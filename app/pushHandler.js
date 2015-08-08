var pushWoosh = require('pushwoosh');
var pushClient = new pushWoosh("4345B-7C66B", "Cg4prtHRBxkKns9AtqHyH7hmpcwmlgueVkH4UDBDKfSbpG0ILNfBLFrl2o3AMkUX3CFKhlStJcVu6Tg4WCUZ");
var NEWAPPOINTMENTNOTIFIER = 1;
var DELAYNOTIFIER = 2;
var PREFERNOTIFIER = 3;

function sendPushHandler(i_date, i_appointmentTime, i_MinutesToBeNotify, i_tokenArry, i_msg) {

    // setup config vars
    var icon = "http://s30.postimg.org/puwlu78vl/doctor1.png";
    var android_header = "AppointMe";
    //var msg;
    
   // switch(i_delaymessage){
       // case NEWAPPOINTMENTNOTIFIER:
       //     msg = "You have an appiontment at " + i_date + " " + i_appointmentTime + "!";      // TO DO - choose better msg :)
       //     break;
       // case DELAYNOTIFIER:
       //        msg = "Delay detected!, new Estimated time is:" + i_appointmentTime + "!";
        //    break;
       // case PREFERNOTIFIER:
        //     msg = "Preferd appoitment freed on " + i_date +  ' at ' + i_appointmentTime + " check now!";
         //   break;
    //}
    
   /* if (i_delaymessage == false)
        msg = "You have an appiontment at " + i_date + " " + i_appointmentTime + "!";      // TO DO - choose better msg :)
    else
        msg = "Delay detected!, new Estimated time is:" + i_appointmentTime + "!";
*/
    // Converts the date as required from Pushwoosh

    //temp
    var hh = i_appointmentTime.split(":")[0];
    hh-=3 // GMT time
    var mm = i_appointmentTime.split(":")[1];
    //

    var date = calctNotificationSendTime(i_date, hh, mm, i_MinutesToBeNotify);
    var now = date.toJSON();
    var ScheduledPush = now.replace("T", " ");
    ScheduledPush = ScheduledPush.slice(0, 16);
    console.log(ScheduledPush);

    // setup the configuration sent to pushwoosh
    var config = setUpConfig(ScheduledPush, android_header, icon, i_msg, i_tokenArry);

    // call the "sendMessage" method from pushWoosh module to send the notification request to Pushwoosh server
    var messageId = pushClient.sendMessage(config).then(function (data) {
        //console.log(data.status_code);
        return data.response.Messages;
    });

    return messageId;
}

function deletePushHandler(NotificationCode) {
    var status_code = pushClient.deleteMessage(NotificationCode).then(function (data) {
        return data.status_code;
    }); //to delate irelevant pending push notification

    return status_code;
}

// For notification to be send on time;
//function calctNotificationSendTime(YY,MM,DD,HH,mm, MinutesToBeNotify){
function calctNotificationSendTime(i_date, hh, mm, MinutesToBeNotify) {      // TO DO - need to change func and variables name!

    var date = new Date();

    var DD = i_date.split("/")[0];
    var MM = i_date.split("/")[1];
    var YY = i_date.split("/")[2];

    //hh -= 3; // Because its may be depend on GMT time?
    MM -= 1; // counting month starting from 0
    if (mm < MinutesToBeNotify) {
        if (hh === 0) {
            hh = 23;
            if (MinutesToBeNotify > 60)
                hh--;

            date = date - 1;
        } else {
            hh--;
            if (MinutesToBeNotify > 60)
                hh--;
        }

    } else if (mm - MinutesToBeNotify >= 60) {
        if (hh === 23) {
            hh = 0;
            date = date + 1;
        } else {
            hh++;
        }
    }

    mm = (120 + mm - MinutesToBeNotify) % 60;     //support for 90 minute alert in case of delay

    date.setFullYear(YY);
    date.setMonth(MM);
    date.setMonth(MM);      //yotam WHERE DID YOU FIND THIS SHITY MODULE?!
    date.setDate(DD);
    date.setHours(hh);
    date.setMinutes(mm);

    return date;
}

function setUpConfig(ScheduledPush, android_header, icon, msg, tokenArry) {
    var config = null;
    config = {
        "send_date": ScheduledPush,
        "android_header": android_header,
        "android_vibration": 1,   // Android force-vibration for high-priority pushes, boolean
        "android_custom_icon": icon,
        "ignore_user_timezone": true, // false = user_timezone <not good> , true -UTC time
        "content": msg,
        "data": {"custom": "json data"},
        "devices": tokenArry
    };
    return config;
}

exports.sendPushHandler = sendPushHandler;
exports.calctNotificationSendTime = calctNotificationSendTime;
exports.deletePushHandler = deletePushHandler;