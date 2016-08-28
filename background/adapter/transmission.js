if (typeof torrentToWeb === 'undefined') {
    var torrentToWeb = {};
};

if (typeof torrentToWeb.adapter === 'undefined') {
    torrentToWeb.adapter = {};
};

torrentToWeb.adapter.transmission = function(baseUrl, username, password, autostart)
{
    var baseUrlObject = new URL(baseUrl);
    baseUrlObject.username = username;
    baseUrlObject.password = password;
    baseUrlObject.pathname = '/transmission';
    baseUrlObject.search = '';
    baseUrlObject.hash = '';

    baseUrl = baseUrlObject.toString();

    return {
        send: function(filename, data, callback)
        {
            var fileReader = new FileReader();
            fileReader.addEventListener('load', function(){
                var requestData = {
                    'method': 'torrent-add',
                    'arguments': {
                        'metainfo': window.btoa(fileReader.result),
                        'paused': !autostart
                    }
                };

                sendRequest(requestData, callback, null);
            });
            fileReader.readAsBinaryString(data);
        }
    };

    function sendRequest(requestData, callback, transmissionSessionId){
        var request = new XMLHttpRequest();
        request.open('POST', baseUrl + '/rpc', true);
        request.setRequestHeader('Content-Type', 'json');
        request.setRequestHeader('X-Transmission-Session-Id', transmissionSessionId);

        request.onreadystatechange = function(e) {
            if (request.readyState !== XMLHttpRequest.DONE) {
                return;
            }

            if (request.status === 409) {
                sendRequest(requestData, callback, request.getResponseHeader('X-Transmission-Session-Id'));
                return;
            }

            if (request.status !== 200) {
                callback(false);
                return;
            }

            try {
                var response = JSON.parse(request.responseText);

                if ('success' !== response.result) {
                    callback(false);
                    return;
                }
            } catch (e) {
                callback(false);
                return;
            }


            callback(true);
        };
        request.send(JSON.stringify(requestData));
    };
};
