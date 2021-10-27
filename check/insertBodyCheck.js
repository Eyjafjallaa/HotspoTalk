exports.check = (body) => {
    if(body.name == '' || body.name == undefined) {
        throw "'name'이 빠졌습니다.";
    }
    if(body.memberLimit == '' || body.memberLimit == undefined) {
        throw "'memberLimit'이 빠졌습니다.";
    }
    if(body.latitude == '' || body.latitude == undefined) {
        throw "'latitude'가 빠졌습니다.";
    }
    if(body.longitude == '' || body.longitude == undefined) {
        throw "'longitude'가 빠졌습니다.";
    }
    if(body.areaType == '' || body.areaType == undefined) {
        throw "'areaType'이 빠졌습니다.";
    }
    if(body.areaDetail == '' || body.areaDetail == undefined) {
        throw "'areaDetail'이 빠졌습니다.";
    }
    if(body.nickName == '' || body.nickName == undefined) {
        throw "'nickName'이 빠졌습니다.";
    }
}
 