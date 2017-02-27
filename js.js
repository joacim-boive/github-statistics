'use strict';
{
    let users = {};
    let lookups = [];

    let toBase64 = input => {
        return window.btoa(decodeURIComponent(encodeURIComponent(input)));
    };

    const headers = new Headers({
        'Authorization': 'Basic ' + toBase64('lensway:sh0wm3d4c0dez')
    });

    fetch(
        'https://api.github.com/repos/lensway/lensway-all/pulls?state=all&page=1&per_page=100', {
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
                lookups.push(fetch(`https://api.github.com/repos/lensway/lensway-all/pulls/${pr.number}/reviews`, {
                    method: 'GET',
                    redirect: 'follow',
                    headers: headers
                }).then(response => {
                    return response.json()
                }).then(reviews => {
                    for (let review of reviews) {
                        let thisDate = new Date(new Date(review.submitted_at).setHours(0, 0, 0, 0));

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
                    }

                }));
            }

            Promise.all(lookups).then(() => {
                debugger;
                console.table(users);
            }, reason => {
                debugger;
                console.log(reason);
            })
        });
}