const request = require('request')


exports.get = (latitude, longitude) => {
    let options = {
        url: 'https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=' + longitude + ',' + latitude + '&output=json&orders=addr&orders=admcode&orders=roadaddr',
        method: 'GET',
        headers: {
            'X-NCP-APIGW-API-KEY-ID':'t0onsa248e', //앱 등록 시 발급받은 Client ID
            'X-NCP-APIGW-API-KEY':'i6jm0umpPLm4oYf3z9EfbbdRXAgwRHFJeFsANllI', //앱 등록 시 발급받은 Client Secret
        },
    };
    return new Promise((resolve, reject) => {
        request(options, async (err, res, body) => {
            if(err) {
                throw err;
            }
            
            try {
                let reqResult = JSON.parse(body);
                let result = [];
                if(reqResult.results[0].region.area4.name !== "") {
                    result.push(reqResult.results[0].region.area1.name + " " 
                        + reqResult.results[0].region.area2.name + " " 
                        + reqResult.results[0].region.area3.name + " "
                        + reqResult.results[0].region.area4.name);
                }
                result.push(reqResult.results[0].region.area1.name + " " 
                    + reqResult.results[0].region.area2.name + " " 
                    +reqResult.results[0].region.area3.name);
                result.push(reqResult.results[0].region.area1.name + " " 
                    + reqResult.results[0].region.area2.name);
                result.push(reqResult.results[0].region.area1.name);
                resolve(result);
                
            } catch (error) {
                throw error
            }
        });
    });
}
