const headers = new Headers({
    'Authorization':'Basic bGVuc3dheTpzaDB3bTNkNGMwZGV6'
});
const request = new Request('https://api.github.com/repos/lensway/lensway-all/pulls', {
    method: 'GET',
    redirect: 'follow',
    headers: headers
});

fetch(request)
    .then(function(response) {return response.json()})
    .then(function(json){
        let prs = [];

        headers.append('Accept', 'application/vnd.github.black-cat-preview+json');

        for(let pr of json){
            fetch(`https://api.github.com/repos/lensway/lensway-all/pulls/${pr.number}/reviews`, {
                method: 'GET',
                redirect: 'follow',
                headers: headers
            }).then(function(response) {return response.json()})
                .then(function(json){
                    debugger;
                })
        }
    });