const Airtable = require('airtable');
const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base('appTDzZIAs6Mp5rKR');
const axios = require('axios');
let currentDate = new Date();


console.log("Current Date/Time: " ,currentDate)



// retrieve all records in "T-1 Events" view in "Live Events" table
base('Live Events').select({view: 'T-1 Events'}).eachPage(function page(records, fetchNextPage) {

    // This function (`page`) will get called for each page of records.
    //checkboxes in Airtable are true, if checked, but undefined if unchecked (not really logical, I guess, but oh well...)

    records.forEach(function(record) {
        let eventDate = new Date(record.get('Start (UTC) (12h):'));
        let timeDifferenceHours = (eventDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60);
        let reminderSent = record.get('(D) T-1 Set Reminder');
        let announcementSent = record.get('(D) T-1h Event Announcement');

        if((timeDifferenceHours <= 2) && (timeDifferenceHours >=0)){

            if(reminderSent != true){
                // if reminder is not checked, send reminder to corresponding channel and check "(D) T-1 Set Reminder"
                console.log('Reminder Set:', record.get('(D) T-1 Set Reminder'));

                //postMessageToTeams('Reminder', record.get('Name (A):') + " starts at " + record.get('Start (AT) (12h) (F) (A):') + " | " + record.get('Start (US) (12h) (F) (A):'), record.get('(D) Teams Webhook (A)'))
                postMessageToTeams('Reminder', "<b>" + record.get('Name (A):') + "</b>" + " starts at <br><br>" + record.get('Start (AT) (12h) (F) (A):') + "<br>" + record.get('Start (US) (12h) (F) (A):'), process.env.TEAMS_REMINDERS_WEBHOOK)


                //updateReminderCheckbox(record.id, true)

            }

            if(announcementSent != true){
                // if announcement is not checked, send announcement to General channel and check "(D) T-1h Event Announcement"
                console.log('Event Announcement:', record.get('(D) T-1h Event Announcement'));

                let message =
                    "Hello! <br>" +
                    record.get('(D) Event Description') + "<br><br>" +
                    record.get('Event Season (Title):') + "<br>" +
                    record.get('Event Profile (Title):') + "<br><br>" +
                    record.get('Live Video (Title):') + "<br>" +
                    record.get('Start (AT) (12h) (F) (A):') + "<br>" +
                    record.get('Start (US) (12h) (F) (A):') + "<br><br>" +
                    "RBCOM" + "</br>" +
                    "<a href=\"" + record.get('(D) Bitly (Red Bull COM)') + "\">" + record.get('(D) Bitly (Red Bull COM)') +"</a>" + "<br><br>" +
                    "TEAMS\n" +
                    "RBCOM" + "</br>" +
                    "<a href=\"" + record.get('(D) Bitly TEAMS Channel Link') + "\">" + record.get('(D) Bitly TEAMS Channel Link') +"</a>";

                postMessageToTeams('Event Announcement', message, process.env.TEAMS_REMINDERS_WEBHOOK)

                //updateAnnouncementCheckbox(record.id, true)

            }

            // console name output of all records found
            console.log('Retrieved', record.get('Name (A):'));


            // test what is actually in the Link field to the channels
            console.log('Teams Channel Content:', record.get('(D) Teams Webhook (A)'))

        }

    });

    // To fetch the next page of records, call `fetchNextPage`.
    // If there are more records, `page` will get called again.
    // If there are no more records, `done` will get called.
    fetchNextPage();

}, function done(err) {
    if (err) { console.error(err); return; }
});



async function postMessageToTeams(title, message, webhook) {
    const card = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        'themeColor': "0072C6", // light blue
        summary: 'Summary description',
        sections: [
            {
                activityTitle: title,
                text: message,
            },
        ],
    };

    console.log("Card: " + card);

    try {
        const response = await axios.post(webhook, card, {
            headers: {
                'content-type': 'application/vnd.microsoft.teams.card.o365connector',
                'content-length': `${card.toString().length}`,
            },
        });
        return `${response.status} - ${response.statusText}`;
    } catch (err) {
        return err;
    }
}

function updateAnnouncementCheckbox(id, value){

    base('Live Events').update([
        {
            "id": id,
            "fields": {
                "(D) T-1h Event Announcement": value
            }
        },
    ], function(err, records) {
        if (err) {
            console.error(err);
            return;
        }
        records.forEach(function(record) {
            console.log(record.get('Name (A):'));
        });
    });
}

function updateReminderCheckbox(id, value){

    base('Live Events').update([
        {
            "id": id,
            "fields": {
                "(D) T-1 Set Reminder": value
            }
        },
    ], function(err, records) {
        if (err) {
            console.error(err);
            return;
        }
        records.forEach(function(record) {
            console.log(record.get('Name (A):'));
        });
    });
}