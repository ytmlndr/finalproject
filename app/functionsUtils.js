module.exports = {

    compareAppointments: function (a, b) {
        if (a.date.split('/')[2] < b.date.split('/')[2])
            return -1;
        if (a.date.split('/')[2] > b.date.split('/')[2])
            return 1;
        if (a.date.split('/')[1] < b.date.split('/')[1])
            return -1;
        if (a.date.split('/')[1] > b.date.split('/')[1])
            return 1;
        if (a.date.split('/')[0] < b.date.split('/')[0])
            return -1;
        if (a.date.split('/')[0] > b.date.split('/')[0])
            return 1;
        if (a.realStartTime < b.realStartTime)
            return -1;
        else
            return 1;
    },

    removeOldAppointments: function (apo) {
        var now = new Date();
        var apodate = new Date();

        apodate.setYear(apo.date.split('/')[2]);
        apodate.setMonth(apo.date.split('/')[1] - 1);
        apodate.setDate(apo.date.split('/')[0]);
        apodate.setHours(apo.realEndTime.split(':')[0]);
        apodate.setMinutes(apo.realEndTime.split(':')[1]);
        if (now.isBefore(apodate))
            return apo;
    },

    getOldAppointments: function (apo) {
        var now = new Date();
        var apodate = new Date();

        apodate.setYear(apo.date.split('/')[2]);
        apodate.setMonth(apo.date.split('/')[1] - 1);
        apodate.setDate(apo.date.split('/')[0]);
        apodate.setHours(apo.realEndTime.split(':')[0]);
        apodate.setMinutes(apo.realEndTime.split(':')[1]);
        if (apodate.isBefore(now))
            return apo;
    },

    diffInMinutesBetweenTwoHours: function (a, b) {
        return (parseInt(a.split(":")[0]) * 60 + parseInt(a.split(":")[1])) - (parseInt(b.split(":")[0]) * 60 + parseInt(b.split(":")[1]));
    }

};