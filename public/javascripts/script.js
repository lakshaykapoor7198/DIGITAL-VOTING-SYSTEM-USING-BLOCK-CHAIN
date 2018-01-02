urlToInspect = "/vote/inspect/" // Done
urlToAdd = "/vote/add" // Done
urlToCandidate = "/vote/candidate/" //No need
urlToTotal = "/vote/total/" //Done
urlToFollow = "/vote/follow/" //Done
urlToChange = "/vote/change/"
urlToAllVotes = "/vote/all/"


$(document).ready(() => {


    var inspectId = setInterval(function () {
        ajaxRequest(urlToInspect)
            .then((data) => {
                msg = data.msg
                if (msg.code == 1) {
                    // while (true) {
                    alert("BREACHED")
                    // }
                } else {
                    console.log("SAFE")
                }
            })
            .catch(() => {
                alert("SOME_SERVER_PROBLEM")
            })
    }, 10000)




    setInterval(function () {
        ajaxRequest(urlToAllVotes)
            .then((data) => {
                data = data.msg;
                console.log("All Updated!!!")
                $("div.all").remove();
                for (var cand in data) {
                    candname = cand
                    arr = data[cand]
                    var outerhtmlStart = '<div class="container-fluid all">  <div class="left">    <span class="span">    ' + candname.toUpperCase() + '    </span>  </div>  <div class="middle"> '
                    var outerhtmlEnd = '</div></div>'
                    str = ''
                    for (i = 0; i < arr.length; i++) {

                        vote = arr[i]

                        name = vote.name
                        nonce = vote.nonce
                        hash = vote.hash
                        phash = vote.prevhash || "Genesis Block"
                        id = vote.userid
                        time = vote.time
                        //id,name,nonce,time,phash, hash
                        str += middleHTML(id, name, nonce, time, phash, hash)

                        if (i == arr.length - 1) {
                            html = outerhtmlStart + str + outerhtmlEnd
                            $("body").append(html)

                        }

                    }


                }
                $(".change-vote").click((e) => {
                    userid = $(e.target).attr("data-id")
                    name = $(e.target).attr("data-name")

                    data = { userid: userid, candname: name }
                    if (userid != "000000") {
                        if (name == "Trump") {
                            cToName = "Obama"
                        }
                        else {
                            cToName = "Trump"
                        }
                        data["candname"] = cToName
                        console.log(data)
                        ajaxRequest(urlToChange, data)
                            .then((msg) => {
                                console.log(msg)
                            })
                            .catch((err) => {
                                console.log(err)
                                alert("SOME_SERVER_PROBLEM")
                            })
                    }
                })

            })
            .catch(() => {
                alert("SOME_SERVER_PROBLEM")
            })
    }, 10000)


    ajaxRequest(urlToTotal)
        .then((msg) => {
            data = msg.msg
            votes = { "Trump": [], "Obama": [] }
            for (var vote in data) {
                votes[data[vote][1]].push(data[vote])
            }
            data = []
            for (can in votes) {
                data.push({ label: can, value: votes[can].length })
            }
            makeChart(data)
        })
        .catch((err) => {
            alert("SOME_SERVER_PROBLEM")
        })

    setInterval(function () {
        ajaxRequest(urlToTotal)
            .then((msg) => {
                data = msg.msg
                votes = { "Trump": [], "Obama": [] }
                for (var vote in data) {
                    votes[data[vote][1]].push(data[vote])
                }
                data = []
                for (can in votes) {
                    data.push({ label: can, value: votes[can].length })
                }
                makeChart(data)
            })
            .catch((err) => {
                alert("SOME_SERVER_PROBLEM")
            })
    }, 5000)


    $("img").on("click", function (e) {
        var cand = e.target.id.charAt(0).toUpperCase() + e.target.id.slice(1);
        // alert(cand + " selected")
        $("input[name=cand]").val(cand);
        user = $("input[name=uid]")
        if (e.target.id == "obama") {
            $("#trump").css("opacity", "0.1")
            $("#obama").css("opacity", "1")
        }
        else {
            $("#trump").css("opacity", "1")
            $("#obama").css("opacity", "0.1")
        }
        if (user.val() == "") {
            $(".inp-u").show()
        }
    })


    $("#vote").click(() => {
        u = $("#userid").val()
        user = $("input[name=uid]")
        if (u.length != 6) {
            $("#userid").val("")
        }
        else {
            user.val(u)

            $(".inp-u").hide()
        }

    })

    $("#add-vote").click(() => {
        user = $("input[name=uid]")
        if (user.val() == "") {
            $(".inp-u").show()
        }
        else {
            addVote()
        }

    })




    $("#my-vote").click(() => {
        $("#my-vote").css('background-color', '#FF3C00')
        $("#tot-vote").css('background-color', '#ABAFB2')

        user = $("input[name=uid]")
        if (user.val() == "") {
            $(".inp-u").show()
        }
        else {
            $("#chart-container").hide()
            $("#my-vote-show").show()
            var userid = user.val()
            ajaxRequest(urlToFollow, { userid: userid })
                .then((msg) => {
                    data = msg.msg
                    cand = data[1]
                    var d = new Date(parseInt(data[0]));
                    date = d.getDate() + " - " + (d.getMonth() + 1) + " - " + d.getFullYear()
                    img = "/images/" + cand.toLowerCase() + "fol.jpg"
                    // console.log(date, cand, img)
                    $(".fol-cand").text(cand)
                    $(".fol-date").text(date)
                    $(".fol-img").attr("src", img)

                })
                .catch((err) => {
                    console.log(err)
                    alert("SOME_SERVER_PROBLEM")
                })
        }

    })

    $("#tot-vote").click(() => {
        $("#tot-vote").css('background-color', '#FF3C00')
        $("#my-vote").css('background-color', '#ABAFB2')
        $("#my-vote-show").hide()
        $("#chart-container").show()
    })





})



function addVote() {
    userid = $("input[name=uid]").val()
    candname = $("input[name=cand]").val();
    data = { userid: userid, candname: candname }
    ajaxRequest(urlToAdd, data)
        .then((msg) => {
            ajaxRequest(urlToTotal)
                .then((msg) => {
                    data = msg.msg
                    votes = { "Trump": [], "Obama": [] }
                    for (var vote in data) {
                        votes[data[vote][1]].push(data[vote])
                    }
                    data = []
                    for (can in votes) {
                        data.push({ label: can, value: votes[can].length })
                    }
                    makeChart(data)
                })
                .catch((err) => {
                    alert("SOME_SERVER_PROBLEM")
                })

            $("h1").text(msg.msg.msg)
            $("h1").css("color", "#FF3C00")
            $("h1").css("font-size", "50px")

            setTimeout(function () {
                $("h1").text("WANNA CHANGE VOTE?")
                $("h1").css("color", "#fff")
                $("img").css("opacity", "1")
            }, 5000)
        })
        .catch((err) => {
            alert("SOME_SERVER_PROBLEM")
        })
}



function middleHTML(id, name, nonce, time, phash, hash) {
    if (hash.substring(0, 4) != "0000") {
        wrong = "-wrong"
    }
    else {
        wrong = ""
    }
    var str = '<div class="middleInner' + wrong + '">      USERID : <span class="all-id">' + id + '</span><br><br>      TIMESTAMP : <span class="all-time">' + time + '</span><br><br>      NONCE : <span class="all-nonce">' + nonce + '</span><br><br>      PREVHASH : <span class="all-phash">' + phash + '</span><br><br>      HASH : <span class="all-hash">' + hash + '</span><br><br>      <center><button type="button" data-id="' + id + '" data-name="' + name + '" class="change-vote" >CHANGE VOTE</button></center>    </div>'

    return str
}



function makeChart(data) {

    FusionCharts.ready(function () {
        var revenueChart = new FusionCharts({
            type: "pie2d",
            renderAt: "chart-container",
            width: "600",
            height: "500",
            dataFormat: "json",
            dataSource: {
                "chart": {
                    "caption": "Vote Distribution",
                    "subCaption": "     ",
                    "paletteColors": "#f45b00,#1aaf5d,#0075c2,#f2c500,#8e0000",
                    "bgColor": "#21242E",
                    "bgAlpha": "100",
                    "showBorder": "0",
                    "use3DLighting": "0",
                    "baseFontColor": "#ffffff",
                    "showShadow": "1",
                    "enableSmartLabels": "1",
                    "startingAngle": "0",
                    "showPercentValues": "1",
                    "showPercentInTooltip": "0",
                    "decimals": "1",
                    "captionFontSize": "32",
                    "subcaptionFontSize": "14",
                    "subcaptionFontBold": "0",
                    "toolTipColor": "#fff",
                    "toolTipBorderThickness": "20",
                    "toolTipBgColor": "#111111",
                    "toolTipBgAlpha": "100",
                    "toolTipFontSize": "25",
                    "toolTipBorderRadius": "100",
                    "toolTipPadding": "15",
                    "showHoverEffect": "1",
                    "showLegend": "1",
                    "legendBgColor": "#111111",
                    "legendBorderAlpha": '0',
                    "legendShadow": '0',
                    "legendItemFontSize": '18',
                    "legendItemFontColor": '#ffffff'
                },
                "data": data
            }
        });

        revenueChart.render("chart-container");
    });
}


ajaxRequest = (url, data = {}) => {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: 'POST',
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: JSON.stringify(data),
            success: function (response) {
                if (response.status == 200) {
                    resolve(response);
                } else {
                    console.log(response)
                    reject(0)
                }

            }
        })
    })

}