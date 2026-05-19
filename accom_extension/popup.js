document.addEventListener('DOMContentLoaded', () => {

  console.log('Popup loaded');

  const btn = document.getElementById('testBtn');

  btn.addEventListener('click', async () => {

    console.log('Test button clicked');

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    console.log('Active tab:', tab);

    if (!tab || !tab.id) {
      console.error('No active tab found');
      return;
    }

    try {

      // Inject content script manually
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      console.log('Content script injected');

      // Send message AFTER injection
      chrome.tabs.sendMessage(tab.id, {
        type: 'TIMER_ALARM',
        studentName: 'Test alarm'
      });

      console.log('Message sent');

    } catch (err) {

      console.error('Injection failed:', err);

    }

  });

});


/*
document.addEventListener('DOMContentLoaded', () => {

  console.log('Popup loaded');

  const btn = document.getElementById('testBtn');

  btn.addEventListener('click', async () => {

    console.log('Test button clicked');

    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    console.log('Tabs found:', tabs);

    if (!tabs.length) {
      console.error('No active tab');
      return;
    }

    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'TIMER_ALARM',
      studentName: 'Test alarm'
    });

    console.log('Message sent to content script');

  });

});
*/


/*
document.addEventListener('DOMContentLoaded', () => {

  const btn = document.getElementById('testBtn');

  btn.addEventListener('click', async () => {

    console.log('Test button clicked');

    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tabs.length) {
      console.error('No active tab');
      return;
    }

    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'TIMER_ALARM',
      studentName: 'Test alarm'
    });
  });

});
*/


/*
// popup.js
document.getElementById('testBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'TIMER_ALARM', studentName: 'Test Student' });
    }
  });
});

*/