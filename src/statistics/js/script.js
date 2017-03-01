'use strict';
{
    Chart.defaults.global.elements.line.fill = false;
    Chart.defaults.global.legend.labels.boxWidth = 4;
    Chart.defaults.global.elements.tension = 0.2;


    let toBase64 = input => {
        return window.btoa(decodeURIComponent(encodeURIComponent(input)));
    };

    let getUserData = (storage) => {
        const IGNORE_USERS = storage.ignore.split(','); //We don't care about the stats for these users.

        let users = {};
        let lookups = [];
        let dates = [];

        const headers = new Headers({
            'Authorization': 'Basic ' + toBase64(storage.login + ':' + storage.password)
        });

        return new Promise((resolve, reject) => {
            fetch(`https://api.github.com/repos/${storage.github}/pulls?state=all&page=1&per_page=100`, {
                    method: 'GET',
                    redirect: 'follow',
                    headers: headers
                })
                .then(response => {
                    return response.json()
                })
                .then(json => {
                    headers.append('Accept', 'application/vnd.github.black-cat-preview+json');

                    for (let pr of json) {
                        lookups.push(fetch(`https://api.github.com/repos/${storage.github}/pulls/${pr.number}/reviews`, {
                            method: 'GET',
                            redirect: 'follow',
                            headers: headers
                        }).then(response => {
                            return response.json()
                        }).then(reviews => {
                            for (let review of reviews) {
                                let thisDate = new Date(new Date(review.submitted_at).setHours(0, 0, 0, 0)).toISOString().split('T')[0];

                                if(IGNORE_USERS.includes(review.user.login)){
                                    return; //Ignore these users
                                }

                                if (users[review.user.login]) {
                                    if (users[review.user.login][thisDate]) {
                                        users[review.user.login][thisDate].count++;
                                    } else {
                                        users[review.user.login][thisDate] = {};
                                        users[review.user.login][thisDate].count = 1;
                                    }
                                } else {
                                    users[review.user.login] = {};
                                    users[review.user.login][thisDate] = {};
                                    users[review.user.login][thisDate].count = 1;
                                }

                                dates.push(thisDate);
                            }


                        }));
                    }

                    Promise.all(lookups).then(() => {
                        console.table(users);
                        resolve(users);
                    }, reason => {
                        debugger;
                        console.log(reason);
                        reject(reason);
                    })
                });
        })
    };

    let createChart = (id, data, type = 'line') => {
        const loading = document.getElementById('loading');
        const headline = document.getElementById('headline');

        if(loading){
            loading.parentNode.removeChild(loading);
            headline.classList.remove('visuallyhidden');
            headline.classList.add('bounceInLeft');
        }

        return new Chart(document.getElementById(id), {
            type: type,
            data: data,
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            }
        });
    };

    let createDataset = (thisData) => {
        let detailsDataset = {};
        let detailsData = {};

        detailsData.labels = [];
        detailsData.datasets = [];

        for (let [user, dates] of Object.entries(thisData)) {
            detailsDataset = {};
            detailsDataset.data = [];
            detailsDataset.thisData = [];
            detailsDataset.label = user;
            detailsDataset.borderColor = rcolor();

            for (let [date, review] of Object.entries(dates)) {
                detailsData.labels.push(date);

                detailsDataset.thisData.push({
                    date: date,
                    count: review.count
                })
            }

            detailsData.datasets.push(detailsDataset);
        }

        detailsData.labels = Array.from(new Set(detailsData.labels)); //Make entries unique and convert back to Array
        detailsData.labels.sort();

        for (let thisDate of detailsData.labels) { //Loop thru the dates
            for (let [index, details] of Object.entries(detailsData.datasets)) {
                let hasDate = false;

                for (let [count, data] of Object.entries(details.thisData)) {
                    if (thisDate === data.date) {
                        hasDate = true;
                        detailsData.datasets[index].data.push(data.count);
                    }
                }

                if (hasDate === false) {
                    detailsData.datasets[index].data.push(0); //Add a 0 for this date as no reviews could be found.
                }
            }
        }

        createChart('chartPeriod', {
            labels: detailsData.labels,
            datasets: detailsData.datasets
        });

        let data = {};
        let dataset = {};
        let user = [];

        data.labels = [];
        data.datasets = [];

        dataset.backgroundColor = [];
        dataset.data = [];

        detailsData.datasets.map((details) => {
            user.push(
                {
                    label: details.label,
                    total: details.data.reduce((a, b) => a + b)
                }
            )
        });

        user.sort((a, b) => {
            return b.total - a.total; //Sort in descending order
        });

        user.map(details => {
            data.labels.push(details.label);

            dataset.backgroundColor.push(rcolor());
            dataset.data.push(details.total);
        });

        dataset.label = 'Total amount during period';
        data.datasets.push(dataset);

        createChart('chartTotal', data, 'bar');
    };

    chrome.storage.local.get({
        'github': '',
        'login': '',
        'password': '',
        'ignore': ''
    }, function (storage) {
        getUserData(storage).then(data => createDataset(data));
    })
}