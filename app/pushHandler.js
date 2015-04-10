var pushWoosh = require('pushwoosh');
var pushClient = new pushWoosh("64CA2-47D44", "NCyxWjQi5bc3RbhcN8iohZPlhKvjsIM5WfvdGIGJr5K3mtvvmNJIjUmJYYg4Fc9bZmEhhmrRQxG4Z8h70f2j");

function sendPushHandler(date, msg,tokenArry){

    // setup config vars
    var icon="http://s30.postimg.org/puwlu78vl/doctor1.png";
    var android_header="FP-T2";

    // Converts the date as required from Pushwoosh
    var now = date.toJSON();
    var ScheduledPush = now.replace("T", " ");
    ScheduledPush = ScheduledPush.slice(0, 16);
    console.log(ScheduledPush);

    // setup the configuration sent to pushwoosh
    var config=setUpConfig(ScheduledPush,android_header,icon,msg,tokenArry);

    // call the "sendMessage" method from pushWoosh module to send the notification request to Pushwoosh server
    var messageId=pushClient.sendMessage(config).then(function (data) {
        //console.log(data.status_code);
        return data.response.Messages;
    });

    return messageId;
}

function deletePushHandler(NotificationCode) {
    var status_code=pushClient.deleteMessage(NotificationCode).then(function (data) {
        return data.status_code;
    }); //to delate irelevant pending push notification

    return status_code;
}

// For notification to be send on time;
function calctNotificationSendTime(YY,MM,DD,HH,mm, TimeToBeNotifiy){

    var date = new Date();
   // HH -= 3; // Because its may be depend on GMT time?
    MM -= 1; // i don't know why but it sould be like this!
    if (mm < TimeToBeNotifiy) {
        if (HH === 0) {
            if (DD === 1) {
                date = date - 1;
            }

            HH = 23;
        }
        else {
            HH--;
        }

        mm = 60 - (TimeToBeNotifiy - mm);
    }

    date.setFullYear(YY);
    date.setMonth(MM);
    date.setDate(DD);
    date.setHours(HH);
    date.setMinutes(mm);

    return date;
}

function setUpConfig(ScheduledPush,android_header,icon,msg,tokenArry){
    var config = {
        "send_date": ScheduledPush,
        "android_header": android_header,
        "android_vibration": 1,   // Android force-vibration for high-priority pushes, boolean
        "android_custom_icon": icon,
        "ignore_user_timezone": true, // false = user_timezone <not good> , true -UTC time
        "content": msg,
        "data": { "custom": "json data" },
        "devices":tokenArry
    };
    return config;
}

exports.sendPushHandler=sendPushHandler;
exports.calctNotificationSendTime=calctNotificationSendTime;
exports.deletePushHandler=deletePushHandler;