var pushWoosh = require('pushwoosh');
var pushClient = new pushWoosh("71A38-D9E51", "p94mh8YLHX9Cz0PzmaiqIyYSwi57cOON72vlqak1HER3DCeaJVvYqamgEpiLouHSmzwXgFEshyd78lc2rSUm");

function sendPushHandler(i_date,i_appintmentTime,i_timeToBeNotify,i_tokenArry){

    // setup config vars
    var icon="http://s30.postimg.org/puwlu78vl/doctor1.png";
    var android_header="FP-T2";
    var msg="you have an appiontment at "+i_date+" "+i_appintmentTime+"!";      // TO DO - choose better msg :)

    // Converts the date as required from Pushwoosh

    //temp
    var hh=i_appintmentTime.split(":")[0];
    var mm=i_appintmentTime.split(":")[1];
    //

    var date = calctNotificationSendTime(i_date,hh,mm,i_timeToBeNotify);
    var now = date.toJSON();
    var ScheduledPush = now.replace("T", " ");
    ScheduledPush = ScheduledPush.slice(0, 16);
    console.log(ScheduledPush);

    // setup the configuration sent to pushwoosh
    var config=setUpConfig(ScheduledPush,android_header,icon,msg,i_tokenArry);

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
//function calctNotificationSendTime(YY,MM,DD,HH,mm, TimeToBeNotifiy){
function calctNotificationSendTime(i_date,hh,mm, TimeToBeNotifiy){      // TO DO - need to change func and variables name!

    var date = new Date();

    var YY=i_date.split("/")[2];
    var MM=i_date.split("/")[1];
    var DD=i_date.split("/")[0];
    //var HH=date.getHours();
    //var mm=date.getMinutes();

   // HH -= 3; // Because its may be depend on GMT time?
    MM -= 1; // counting month starting from 0
    if (mm < TimeToBeNotifiy) {
        if (hh === 0) {
            hh = 23;
            date = date - 1;
        } else {
            hh--;
        }

    }else if(mm-TimeToBeNotifiy>=60){
            if (hh === 23) {
                hh=00;
                date = date + 1;
            }else{
                hh++;
            }
        }

        mm=(mm-TimeToBeNotifiy)%60;

    date.setFullYear(YY);
    date.setMonth(MM);
    date.setMonth(MM);      //yotam WHERE DID YOU FIND THIS SHITY MODULE?!
    date.setDate(DD);
    date.setHours(hh);
    date.setMinutes(mm);

    return date;
}

function setUpConfig(ScheduledPush,android_header,icon,msg,tokenArry){
    var config=null;
        config = {
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
