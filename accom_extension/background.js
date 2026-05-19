chrome.alarms.onAlarm.addListener((alarm) => {

  console.log('Background alarm fired:', alarm);

  chrome.tabs.query(
    { active: true, currentWindow: true },
    (tabs) => {

      console.log('Tabs:', tabs);

      if (tabs[0]) {

        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'TIMER_ALARM',
          studentName: alarm.name
        });

        console.log('Alarm message sent');
      }
    }
  );
});

/*
// background.js
chrome.alarms.onAlarm.addListener((alarm) => {
  // When a scheduled alarm fires, notify the content script in the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'TIMER_ALARM',
        studentName: alarm.name
      });
    }
  });
});
*/