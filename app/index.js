require(['http', 'util'], function (http, util) {

    var userInfo = null;
    var accountNo = '';

    var app = function () { };

    app.init = function () {
        var _this = this;

        util.ajax({
            reqData: [{
                //method: 'user.get_user_info',
                //method:'ra.user_base_info',
                method: 'ra.restful_service',
                //method:'product.fund_need_login_pass',
                //method:'users.all_proposal_books',

                /*
                params: {
                    "jsonrpc":"2.0",
                    "id":"0.5c9sg1u0b6h",
                    "method":"back_ground.test",
                    "params":{
                        "mobilePhone":"15600000001",
                        "uid":45
                    }
                }*/
                
                params: {
                    "restful_method": "GET",
                    "restful_url": "/api/users/all_proposal_books/",

                }
                
                /*
                params: {
                    "javaMethod":"AC029"
                }
                */
            }]
        }).then(function (err, res) {
            // util.ui.closeWait();
            if (err) {
                alert(err);
                return;
            }
            console.log(JSON.stringify(res))
            //userInfo = res.result;

            //console.log('user name:' + userInfo);
            //document.getElementById('content').innerHTML = userInfo.realName;

            // if (err || res[1].error) {
            //     alert(res[1].error.message);
            //     return;
            // }
            // accountNo = res[1].result.accountNo;

        });
    }

    app.init();
})