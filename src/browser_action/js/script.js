'use strict';
{
    let init = () => {
        document.getElementById('githubStatistics').onchange = () => {
            let field = event.target;
            let data = {};
            let thisValue = field.value.trim();

            thisValue = thisValue.split(', ').join(',');
            thisValue = thisValue.split(' ,').join(',');

            data[field.id] = thisValue;
            chrome.storage.local.set(data);
        };

        document.getElementById('openStats').addEventListener('click', () => {
            chrome.tabs.create({url: 'src/statistics/index.html'});
        });

        chrome.storage.local.get(storage => {
            for (const key of Object.keys(storage)) {
                let thisField = document.getElementById(key);
                if (thisField) {
                    thisField.value = storage[key];
                }
            }
        })
    };

    init();

}